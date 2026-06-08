import { Controller, Get, Post, Body, Patch, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse as SwaggerResponse, ApiTags } from '@nestjs/swagger';
import { TimetrackingService } from './timetracking.service';
import { CreateManualEntryDto } from './dto/create-manual-entry.dto';
import { StartTimerDto } from './dto/start-timer.dto';
import { TimeFilterDto } from './dto/time-filter.dto';
import { ApiResponse } from '../../common/interfaces/api-response.interface';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Time Tracking')
@ApiBearerAuth()
@Controller()
export class TimetrackingController {
  constructor(private readonly timetrackingService: TimetrackingService) {}

  @Post('time-entries')
  @ApiOperation({ summary: 'Log time worked manually (after the fact)' })
  @SwaggerResponse({ status: 201, description: 'Manual time entry created' })
  async createManual(
    @Body() dto: CreateManualEntryDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
  ): Promise<ApiResponse> {
    const entry = await this.timetrackingService.createManual(user.sub, tenantId, dto);
    return ApiResponse.success(entry, 'Manual time entry created');
  }

  @Post('time-entries/start')
  @ApiOperation({ summary: 'Start a live timer for a specific task' })
  @SwaggerResponse({ status: 201, description: 'Timer started' })
  async startTimer(
    @Body() dto: StartTimerDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
  ): Promise<ApiResponse> {
    const entry = await this.timetrackingService.startTimer(user.sub, tenantId, dto);
    return ApiResponse.success(entry, 'Timer started successfully');
  }

  @Patch('time-entries/:id/stop')
  @ApiOperation({ summary: 'Stop an active live timer' })
  @SwaggerResponse({ status: 200, description: 'Timer stopped and hours calculated' })
  async stopTimer(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
  ): Promise<ApiResponse> {
    const entry = await this.timetrackingService.stopTimer(id, user.sub, tenantId);
    return ApiResponse.success(entry, 'Timer stopped successfully');
  }

  @Get('time-entries')
  @ApiOperation({ summary: 'List time entries with optional filters' })
  @SwaggerResponse({ status: 200, description: 'Time entries retrieved' })
  async findAll(
    @Query() filters: TimeFilterDto,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    const result = await this.timetrackingService.findAll(tenantId, filters);
    return ApiResponse.success(result.data, 'Time entries retrieved successfully', undefined, result.meta);
  }

  @Get('reports/time')
  @ApiOperation({ summary: 'Get aggregated hours grouped by user and project' })
  @SwaggerResponse({ status: 200, description: 'Time report generated' })
  async getReport(@CurrentTenant() tenantId: string): Promise<ApiResponse> {
    const report = await this.timetrackingService.getReport(tenantId);
    return ApiResponse.success(report, 'Time report generated successfully');
  }
}