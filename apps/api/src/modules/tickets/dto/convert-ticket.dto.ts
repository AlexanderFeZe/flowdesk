import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConvertTicketDto {
  @ApiProperty({ description: 'UUID of the project where the task will be created' })
  @IsUUID()
  @IsNotEmpty()
  projectId!: string;
}