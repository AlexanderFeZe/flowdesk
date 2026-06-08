import { Controller, Get, Post, Body, Patch, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse as SwaggerResponse, ApiTags } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketFilterDto } from './dto/ticket-filter.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { AddTicketMessageDto } from './dto/add-ticket-message.dto';
import { ConvertTicketDto } from './dto/convert-ticket.dto';
import { ApiResponse } from '../../common/interfaces/api-response.interface';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Support Tickets')
@ApiBearerAuth()
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new support ticket (usually from Mobile Client)' })
  @SwaggerResponse({ status: 201, description: 'Ticket created successfully' })
  async create(
    @Body() createTicketDto: CreateTicketDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
  ): Promise<ApiResponse> {
    const ticket = await this.ticketsService.create(user.sub, tenantId, createTicketDto);
    return ApiResponse.success(ticket, 'Support ticket created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a paginated and filtered list of tickets' })
  @SwaggerResponse({ status: 200, description: 'Tickets retrieved successfully' })
  async findAll(
    @Query() filters: TicketFilterDto,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    const result = await this.ticketsService.findAll(tenantId, filters);
    return ApiResponse.success(result.data, 'Tickets retrieved successfully', undefined, result.meta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve detailed ticket metadata including full conversation history' })
  @SwaggerResponse({ status: 200, description: 'Ticket details located' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    const ticketDetails = await this.ticketsService.findOne(id, tenantId);
    return ApiResponse.success(ticketDetails, 'Ticket details retrieved successfully');
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update the resolution status of the ticket' })
  @SwaggerResponse({ status: 200, description: 'Ticket status updated' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketStatusDto,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    const ticket = await this.ticketsService.updateStatus(id, tenantId, dto);
    return ApiResponse.success(ticket, 'Ticket status updated successfully');
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign an internal support agent to handle the ticket' })
  @SwaggerResponse({ status: 200, description: 'Ticket assigned successfully' })
  async assignAgent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignTicketDto,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    const ticket = await this.ticketsService.assignAgent(id, tenantId, dto);
    return ApiResponse.success(ticket, 'Agent assigned to ticket successfully');
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Reply to a ticket (append a message to the conversation)' })
  @SwaggerResponse({ status: 201, description: 'Message added successfully' })
  async addMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddTicketMessageDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
  ): Promise<ApiResponse> {
    const message = await this.ticketsService.addMessage(id, user.sub, tenantId, dto);
    return ApiResponse.success(message, 'Message added to ticket conversation');
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Escalate a ticket by converting it into an actionable Project Task' })
  @SwaggerResponse({ status: 201, description: 'Ticket successfully converted to task' })
  async convertToTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertTicketDto,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    const ticket = await this.ticketsService.convertToTask(id, tenantId, dto);
    return ApiResponse.success(ticket, 'Ticket successfully converted into a project task');
  }
}