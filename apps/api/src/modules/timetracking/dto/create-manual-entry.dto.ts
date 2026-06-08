import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateManualEntryDto {
  @ApiProperty({ description: 'UUID of the task' })
  @IsUUID()
  @IsNotEmpty()
  taskId!: string;

  @ApiProperty({ description: 'Start time (ISO 8601)' })
  @IsDateString()
  @IsNotEmpty()
  startTime!: string;

  @ApiProperty({ description: 'End time (ISO 8601)' })
  @IsDateString()
  @IsNotEmpty()
  endTime!: string;

  @ApiPropertyOptional({ description: 'What was worked on' })
  @IsString()
  @IsOptional()
  description?: string;
}