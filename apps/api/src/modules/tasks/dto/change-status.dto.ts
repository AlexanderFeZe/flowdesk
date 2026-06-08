import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../entities/task.entity';

export class ChangeTaskStatusDto {
  @ApiProperty({ enum: TaskStatus, description: 'The new column status for the Kanban board' })
  @IsEnum(TaskStatus)
  @IsNotEmpty()
  status!: TaskStatus;
}