import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority } from '../entities/ticket.entity';

export class CreateTicketDto {
  @ApiProperty({ description: 'Brief summary of the issue' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ description: 'Detailed explanation of the problem' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'Category or module related to the issue', example: 'Billing' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category!: string;

  @ApiPropertyOptional({ enum: TicketPriority, default: TicketPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}