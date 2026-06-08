import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Task } from './entities/task.entity';
import { Comment } from './entities/comment.entity';
import { TaskHistory } from './entities/task-history.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFilterDto } from './dto/task-filter.dto';
import { ChangeTaskStatusDto } from './dto/change-status.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Project } from '../projects/entities/project.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(TaskHistory)
    private readonly historyRepo: Repository<TaskHistory>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(projectId: string, tenantId: string, dto: CreateTaskDto): Promise<Task> {
    // 1. Validate project belongs to tenant
    const project = await this.projectRepo.findOne({ where: { id: projectId, tenantId } });
    if (!project) throw new NotFoundException('Project not found in your workspace');

    const task = this.taskRepo.create({
      ...dto,
      projectId,
      tenantId,
    });

    const savedTask = await this.taskRepo.save(task);

    if (savedTask.assigneeId) {
      this.eventEmitter.emit('task.assigned', {
        taskId: savedTask.id,
        assigneeId: savedTask.assigneeId,
        projectId: savedTask.projectId,
        tenantId,
      });
    }

    return savedTask;
  }

  async findAllByProject(projectId: string, tenantId: string, filters: TaskFilterDto) {
    const { page = 1, limit = 50, status, priority, assigneeId } = filters;
    const skip = (page - 1) * limit;

    const whereClause: FindOptionsWhere<Task> = { projectId, tenantId };
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (assigneeId) whereClause.assigneeId = assigneeId;

    const [data, total] = await this.taskRepo.findAndCount({
      where: whereClause,
      take: limit,
      skip,
      order: { createdAt: 'DESC' },
      relations: { assignee: true }, // Include assignee metadata for the Kanban cards
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, tenantId: string) {
    // Note: Since we didn't add @OneToMany in Task entity to keep it clean, 
    // we query comments and history concurrently for optimal performance.
    const taskPromise = this.taskRepo.findOne({
      where: { id, tenantId },
      relations: { assignee: true, project: true },
    });

    const commentsPromise = this.commentRepo.find({
      where: { taskId: id, tenantId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });

    const historyPromise = this.historyRepo.find({
      where: { taskId: id, tenantId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });

    const [task, comments, history] = await Promise.all([taskPromise, commentsPromise, historyPromise]);

    if (!task) throw new NotFoundException('Task could not be located');

    // Aggregate data into a single rich object
    return { ...task, comments, history };
  }

  async update(id: string, tenantId: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.taskRepo.findOne({ where: { id, tenantId } });
    if (!task) throw new NotFoundException('Task not found');

    const updatedTask = this.taskRepo.merge(task, dto);
    return await this.taskRepo.save(updatedTask);
  }

  async changeStatus(id: string, tenantId: string, userId: string, dto: ChangeTaskStatusDto): Promise<Task> {
    const task = await this.taskRepo.findOne({ where: { id, tenantId } });
    if (!task) throw new NotFoundException('Task not found');

    if (task.status !== dto.status) {
      const history = this.historyRepo.create({
        taskId: task.id,
        userId,
        tenantId,
        field: 'status',
        oldValue: task.status,
        newValue: dto.status,
      });

      task.status = dto.status;
      
      // Save both operations transactionally
      await this.taskRepo.manager.transaction(async (manager) => {
        await manager.save(task);
        await manager.save(history);
      });

      this.eventEmitter.emit('task.status_changed', {
        taskId: task.id,
        newStatus: task.status,
        projectId: task.projectId,
        tenantId,
      });
    }

    return task;
  }

  async addComment(taskId: string, tenantId: string, userId: string, dto: CreateCommentDto): Promise<Comment> {
    const task = await this.taskRepo.findOne({ where: { id: taskId, tenantId } });
    if (!task) throw new NotFoundException('Task not found');

    const comment = this.commentRepo.create({
      content: dto.content,
      taskId,
      userId,
      tenantId,
    });

    const savedComment = await this.commentRepo.save(comment);

    this.eventEmitter.emit('task.comment_added', {
      taskId: task.id,
      commentId: savedComment.id,
      projectId: task.projectId,
      tenantId,
    });

    return savedComment;
  }

  async getComments(taskId: string, tenantId: string): Promise<Comment[]> {
    const task = await this.taskRepo.findOne({ where: { id: taskId, tenantId } });
    if (!task) throw new NotFoundException('Task not found');

    return await this.commentRepo.find({
      where: { taskId, tenantId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const task = await this.taskRepo.findOne({ where: { id, tenantId } });
    if (!task) throw new NotFoundException('Task not found');
    await this.taskRepo.softRemove(task);
  }
}