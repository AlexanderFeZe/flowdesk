import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectMember } from './entities/project-member.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo: Repository<ProjectMember>,
  ) {}

  /**
   * Creates a new project tightly bound to the calling tenant's workspace.
   */
  async create(tenantId: string, dto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepo.create({
      ...dto,
      tenantId,
    });
    return await this.projectRepo.save(project);
  }

  /**
   * Retrieves a paginated list of projects isolated by tenant.
   */
  async findAll(tenantId: string, paginationDto: PaginationDto) {
    const { page = 1, limit = 10, search } = paginationDto;
    const skip = (page - 1) * limit;

    // Golden Rule strict enforcement
    const whereClause: FindOptionsWhere<Project> = { tenantId };
    
    if (search) {
      whereClause.name = Like(`%${search}%`);
    }

    const [data, total] = await this.projectRepo.findAndCount({
      where: whereClause,
      take: limit,
      skip: skip,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Locates a specific project and hydrates its member relationships.
   */
  async findOne(id: string, tenantId: string): Promise<Project> {
    const project = await this.projectRepo.findOne({
      where: { id, tenantId },
      relations: {
        members: {
          user: true,
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      }
    });

    if (!project) {
      throw new NotFoundException('Project could not be located in your workspace');
    }

    return project;
  }

  /**
   * Applies partial updates to project metadata.
   */
  async update(id: string, tenantId: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id, tenantId);
    const updatedProject = this.projectRepo.merge(project, dto);
    return await this.projectRepo.save(updatedProject);
  }

  /**
   * Executes a soft delete on the project.
   */
  async remove(id: string, tenantId: string): Promise<void> {
    const project = await this.findOne(id, tenantId);
    await this.projectRepo.softRemove(project);
  }

  /**
   * Assigns a user to a project via the explicitly defined bridge table.
   */
  async addMember(projectId: string, tenantId: string, dto: AddMemberDto): Promise<ProjectMember> {
    // 1. Verify the project exists and belongs to this tenant
    await this.findOne(projectId, tenantId);

    // 2. Prevent duplicate assignments defensively
    const existingMember = await this.projectMemberRepo.findOne({
      where: { projectId, userId: dto.userId, tenantId },
    });

    if (existingMember) {
      throw new ConflictException('This user is already assigned to the target project');
    }

    const member = this.projectMemberRepo.create({
      projectId,
      userId: dto.userId,
      tenantId,
      role: dto.role,
    });

    return await this.projectMemberRepo.save(member);
  }

  /**
   * Removes a user assignment from a project (soft delete on the bridge entity).
   */
  async removeMember(projectId: string, userId: string, tenantId: string): Promise<void> {
    const member = await this.projectMemberRepo.findOne({
      where: { projectId, userId, tenantId },
    });

    if (!member) {
      throw new NotFoundException('Project member assignment could not be found');
    }

    // Since ProjectMember extends BaseEntity, it supports soft delete preserving audit trails
    await this.projectMemberRepo.softRemove(member);
  }
}