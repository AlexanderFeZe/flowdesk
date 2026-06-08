import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse as SwaggerResponse, ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskFilterDto } from './dto/task-filter.dto';
import { ChangeTaskStatusDto } from './dto/change-status.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ApiResponse } from '../../common/interfaces/api-response.interface';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Kanban Tasks')
@ApiBearerAuth()
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('projects/:projectId/tasks')
  @ApiOperation({ summary: 'Create a new task within a specific project' })
  @SwaggerResponse({ status: 201, description: 'Task successfully created' })
  async create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() createTaskDto: CreateTaskDto,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    const task = await this.tasksService.create(projectId, tenantId, createTaskDto);
    return ApiResponse.success(task, 'Task successfully created');
  }

  @Get('projects/:projectId/tasks')
  @ApiOperation({ summary: 'Retrieve a paginated and filtered list of tasks for a project' })
  @SwaggerResponse({ status: 200, description: 'Tasks retrieved successfully' })
  async findAllByProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() filters: TaskFilterDto,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    const result = await this.tasksService.findAllByProject(projectId, tenantId, filters);
    return ApiResponse.success(result.data, 'Tasks retrieved successfully', undefined, result.meta);
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Retrieve task details including comments and audit history' })
  @SwaggerResponse({ status: 200, description: 'Task details located' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    const taskDetails = await this.tasksService.findOne(id, tenantId);
    return ApiResponse.success(taskDetails, 'Task details retrieved successfully');
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Update core task metadata (title, description, priority)' })
  @SwaggerResponse({ status: 200, description: 'Task updated successfully' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    const task = await this.tasksService.update(id, tenantId, updateTaskDto);
    return ApiResponse.success(task, 'Task updated successfully');
  }

  @Patch('tasks/:id/status')
  @ApiOperation({ summary: 'Move task across Kanban columns and record audit history' })
  @SwaggerResponse({ status: 200, description: 'Task status updated' })
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeTaskStatusDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
  ): Promise<ApiResponse> {
    // Assuming your JWT payload stores the user ID in the 'sub' property
    const task = await this.tasksService.changeStatus(id, tenantId, user.sub, dto);
    return ApiResponse.success(task, 'Task status updated successfully');
  }

  @Post('tasks/:id/comments')
  @ApiOperation({ summary: 'Add a conversational comment to a task' })
  @SwaggerResponse({ status: 201, description: 'Comment added successfully' })
  async addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
  ): Promise<ApiResponse> {
    const comment = await this.tasksService.addComment(id, tenantId, user.sub, dto);
    return ApiResponse.success(comment, 'Comment added successfully');
  }

  @Get('tasks/:id/comments')
  @ApiOperation({ summary: 'Retrieve all comments for a specific task' })
  @SwaggerResponse({ status: 200, description: 'Comments retrieved successfully' })
  async getComments(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    const comments = await this.tasksService.getComments(id, tenantId);
    return ApiResponse.success(comments, 'Comments retrieved successfully');
  }

  @Delete('tasks/:id')
  @ApiOperation({ summary: 'Archive a task via soft delete' })
  @SwaggerResponse({ status: 200, description: 'Task archived securely' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    await this.tasksService.remove(id, tenantId);
    return ApiResponse.success(null, 'Task has been securely archived');
  }
}