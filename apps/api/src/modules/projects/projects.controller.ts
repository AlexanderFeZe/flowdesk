import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse as SwaggerResponse, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiResponse } from '../../common/interfaces/api-response.interface';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantRole } from '@flowdesk/shared';

@ApiTags('Projects Management')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles(TenantRole.ADMIN)
  @ApiOperation({ summary: 'Create a new project workspace' })
  @SwaggerResponse({ status: 201, description: 'Project created successfully' })
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    const project = await this.projectsService.create(tenantId, createProjectDto);
    return ApiResponse.success(project, 'Project created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a paginated list of workspace projects' })
  @SwaggerResponse({ status: 200, description: 'Paginated project list returned' })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    const paginatedResult = await this.projectsService.findAll(tenantId, paginationDto);
    return ApiResponse.success(
      paginatedResult.data,
      'Projects retrieved successfully',
      undefined,
      paginatedResult.meta,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve detailed project metadata including member assignments' })
  @SwaggerResponse({ status: 200, description: 'Project details located' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    const project = await this.projectsService.findOne(id, tenantId);
    return ApiResponse.success(project, 'Project details retrieved successfully');
  }

  @Patch(':id')
  @Roles(TenantRole.ADMIN)
  @ApiOperation({ summary: 'Update project structural metadata' })
  @SwaggerResponse({ status: 200, description: 'Project updated successfully' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    const project = await this.projectsService.update(id, tenantId, updateProjectDto);
    return ApiResponse.success(project, 'Project updated successfully');
  }

  @Delete(':id')
  @Roles(TenantRole.ADMIN)
  @ApiOperation({ summary: 'Archive a project via soft delete' })
  @SwaggerResponse({ status: 200, description: 'Project archived securely' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    await this.projectsService.remove(id, tenantId);
    return ApiResponse.success(null, 'Project has been securely archived');
  }

  @Post(':id/members')
  @Roles(TenantRole.ADMIN)
  @ApiOperation({ summary: 'Assign a workspace user to the specific project' })
  @SwaggerResponse({ status: 201, description: 'Member assigned successfully' })
  async addMember(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body() addMemberDto: AddMemberDto,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    const member = await this.projectsService.addMember(projectId, tenantId, addMemberDto);
    return ApiResponse.success(member, 'Member assigned to project successfully');
  }

  @Delete(':id/members/:userId')
  @Roles(TenantRole.ADMIN)
  @ApiOperation({ summary: 'Revoke a user assignment from the project' })
  @SwaggerResponse({ status: 200, description: 'Member assignment revoked' })
  async removeMember(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    await this.projectsService.removeMember(projectId, userId, tenantId);
    return ApiResponse.success(null, 'Member assignment has been successfully revoked');
  }
}