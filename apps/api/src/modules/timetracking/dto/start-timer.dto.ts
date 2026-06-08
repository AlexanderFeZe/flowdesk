import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartTimerDto {
  @ApiProperty({ description: 'UUID of the task' })
  @IsUUID()
  @IsNotEmpty()
  taskId!: string;

  @ApiPropertyOptional({ description: 'What are you working on right now?' })
  @IsString()
  @IsOptional()
  description?: string;
}