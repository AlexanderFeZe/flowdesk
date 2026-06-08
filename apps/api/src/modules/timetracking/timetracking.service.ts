import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { TimeEntry } from './entities/time-entry.entity';
import { Task } from '../tasks/entities/task.entity';
import { CreateManualEntryDto } from './dto/create-manual-entry.dto';
import { StartTimerDto } from './dto/start-timer.dto';
import { TimeFilterDto } from './dto/time-filter.dto';

@Injectable()
export class TimetrackingService {
  constructor(
    @InjectRepository(TimeEntry)
    private readonly timeEntryRepo: Repository<TimeEntry>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) {}

  /** Helper para calcular horas exactas */
  private calculateHours(start: Date, end: Date): number {
    const ms = end.getTime() - start.getTime();
    return Number((ms / (1000 * 60 * 60)).toFixed(2));
  }

  async createManual(userId: string, tenantId: string, dto: CreateManualEntryDto): Promise<TimeEntry> {
    const task = await this.taskRepo.findOne({ where: { id: dto.taskId, tenantId } });
    if (!task) throw new NotFoundException('Task not found');

    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (start >= end) {
      throw new BadRequestException('End time must be after start time');
    }

    const hours = this.calculateHours(start, end);

    const entry = this.timeEntryRepo.create({
      userId,
      tenantId,
      taskId: dto.taskId,
      startTime: start,
      endTime: end,
      description: dto.description,
      hours,
    });

    return await this.timeEntryRepo.save(entry);
  }

  async startTimer(userId: string, tenantId: string, dto: StartTimerDto): Promise<TimeEntry> {
    const task = await this.taskRepo.findOne({ where: { id: dto.taskId, tenantId } });
    if (!task) throw new NotFoundException('Task not found');

    // Validación estricta: Verificar si ya hay un timer corriendo
    const activeTimer = await this.timeEntryRepo.findOne({
      where: { userId, tenantId, endTime: IsNull() },
    });

    if (activeTimer) {
      throw new ConflictException('You already have an active timer running');
    }

    const entry = this.timeEntryRepo.create({
      userId,
      tenantId,
      taskId: dto.taskId,
      startTime: new Date(),
      description: dto.description,
    });

    return await this.timeEntryRepo.save(entry);
  }

  async stopTimer(id: string, userId: string, tenantId: string): Promise<TimeEntry> {
    const activeTimer = await this.timeEntryRepo.findOne({
      where: { id, userId, tenantId, endTime: IsNull() },
    });

    if (!activeTimer) {
      throw new NotFoundException('Active timer not found');
    }

    activeTimer.endTime = new Date();
    activeTimer.hours = this.calculateHours(activeTimer.startTime, activeTimer.endTime);

    return await this.timeEntryRepo.save(activeTimer);
  }

  async findAll(tenantId: string, filters: TimeFilterDto) {
    const { page = 1, limit = 50, userId, projectId, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    const query = this.timeEntryRepo.createQueryBuilder('entry')
      .innerJoinAndSelect('entry.task', 'task')
      .innerJoinAndSelect('entry.user', 'user')
      .where('entry.tenantId = :tenantId', { tenantId });

    if (userId) query.andWhere('entry.userId = :userId', { userId });
    if (projectId) query.andWhere('task.projectId = :projectId', { projectId });
    if (startDate) query.andWhere('entry.startTime >= :startDate', { startDate });
    if (endDate) query.andWhere('entry.startTime <= :endDate', { endDate });

    query.orderBy('entry.startTime', 'DESC').skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getReport(tenantId: string) {
    // Usamos QueryBuilder para agrupar (GROUP BY) y sumar (SUM) directamente en SQL
    return await this.timeEntryRepo.createQueryBuilder('entry')
      .select('entry.userId', 'userId')
      .addSelect('user.firstName', 'firstName') // Asumiendo campos base de usuario
      .addSelect('user.lastName', 'lastName')
      .addSelect('task.projectId', 'projectId')
      .addSelect('SUM(entry.hours)', 'totalHours')
      .innerJoin('entry.task', 'task')
      .innerJoin('entry.user', 'user')
      .where('entry.tenantId = :tenantId', { tenantId })
      .andWhere('entry.hours IS NOT NULL')
      .groupBy('entry.userId, user.firstName, user.lastName, task.projectId')
      .getRawMany();
  }
}