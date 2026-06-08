import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { TicketMessage } from './entities/ticket-message.entity';
import { Task, TaskStatus, TaskPriority } from '../tasks/entities/task.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketFilterDto } from './dto/ticket-filter.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { AddTicketMessageDto } from './dto/add-ticket-message.dto';
import { ConvertTicketDto } from './dto/convert-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(TicketMessage)
    private readonly messageRepo: Repository<TicketMessage>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(clientId: string, tenantId: string, dto: CreateTicketDto): Promise<Ticket> {
    const ticket = this.ticketRepo.create({
      ...dto,
      clientId,
      tenantId,
    });

    const savedTicket = await this.ticketRepo.save(ticket);

    this.eventEmitter.emit('ticket.created', {
      ticketId: savedTicket.id,
      tenantId,
    });

    return savedTicket;
  }

  async findAll(tenantId: string, filters: TicketFilterDto) {
    const { page = 1, limit = 50, status, priority, assignedAgentId } = filters;
    const skip = (page - 1) * limit;

    const whereClause: FindOptionsWhere<Ticket> = { tenantId };
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (assignedAgentId) whereClause.assignedAgentId = assignedAgentId;

    const [data, total] = await this.ticketRepo.findAndCount({
      where: whereClause,
      take: limit,
      skip,
      order: { createdAt: 'DESC' },
      relations: { client: true, assignedAgent: true },
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, tenantId: string) {
    const ticketPromise = this.ticketRepo.findOne({
      where: { id, tenantId },
      relations: { client: true, assignedAgent: true, task: true },
    });

    const messagesPromise = this.messageRepo.find({
      where: { ticketId: id, tenantId },
      relations: { sender: true },
      order: { createdAt: 'ASC' },
    });

    const [ticket, messages] = await Promise.all([ticketPromise, messagesPromise]);

    if (!ticket) throw new NotFoundException('Ticket not found');

    return { ...ticket, messages };
  }

  async updateStatus(id: string, tenantId: string, dto: UpdateTicketStatusDto): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({ where: { id, tenantId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    ticket.status = dto.status;
    const updatedTicket = await this.ticketRepo.save(ticket);

    this.eventEmitter.emit('ticket.status_changed', {
      ticketId: ticket.id,
      newStatus: ticket.status,
      clientId: ticket.clientId,
      tenantId,
    });

    return updatedTicket;
  }

  async assignAgent(id: string, tenantId: string, dto: AssignTicketDto): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({ where: { id, tenantId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    ticket.assignedAgentId = dto.assignedAgentId;
    // Automatically move to in_progress if it was open
    if (ticket.status === TicketStatus.OPEN) {
      ticket.status = TicketStatus.IN_PROGRESS;
    }

    const updatedTicket = await this.ticketRepo.save(ticket);

    this.eventEmitter.emit('ticket.assigned', {
      ticketId: ticket.id,
      agentId: ticket.assignedAgentId,
      clientId: ticket.clientId,
      tenantId,
    });

    return updatedTicket;
  }

  async addMessage(ticketId: string, senderId: string, tenantId: string, dto: AddTicketMessageDto): Promise<TicketMessage> {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId, tenantId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const message = this.messageRepo.create({
      ticketId,
      senderId,
      message: dto.message,
      tenantId,
    });

    const savedMessage = await this.messageRepo.save(message);

    this.eventEmitter.emit('ticket.message_added', {
      ticketId: ticket.id,
      messageId: savedMessage.id,
      senderId,
      clientId: ticket.clientId,
      tenantId,
    });

    return savedMessage;
  }

  async convertToTask(ticketId: string, tenantId: string, dto: ConvertTicketDto): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId, tenantId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    
    if (ticket.taskId) {
      throw new ConflictException('This ticket has already been converted to a task');
    }

    // 1. Create the task in the specified project
    const task = this.taskRepo.create({
      title: `[TICKET] ${ticket.title}`,
      description: `Originating Ticket ID: ${ticket.id}\n\nClient Description:\n${ticket.description}`,
      priority: TaskPriority.HIGH, // Defaulting escalated tickets to HIGH
      status: TaskStatus.BACKLOG,
      projectId: dto.projectId,
      tenantId,
    });

    // We use a transaction to ensure both the task and the ticket link are saved reliably
    await this.ticketRepo.manager.transaction(async (manager) => {
      const savedTask = await manager.save(task);
      ticket.taskId = savedTask.id;
      await manager.save(ticket);
    });

    this.eventEmitter.emit('ticket.converted', {
      ticketId: ticket.id,
      taskId: ticket.taskId,
      tenantId,
    });

    return ticket;
  }
}