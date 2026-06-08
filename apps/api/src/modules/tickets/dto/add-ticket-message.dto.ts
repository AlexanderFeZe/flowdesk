import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddTicketMessageDto {
  @ApiProperty({ description: 'Content of the message/reply' })
  @IsString()
  @IsNotEmpty()
  message!: string;
}