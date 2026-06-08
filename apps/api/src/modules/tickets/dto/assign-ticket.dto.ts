import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTicketDto {
  @ApiProperty({ description: 'UUID of the internal support agent' })
  @IsUUID()
  @IsNotEmpty()
  assignedAgentId!: string;
}