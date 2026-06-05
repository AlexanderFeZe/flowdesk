import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole } from '../entities/project-member.entity';

export class AddMemberDto {
  @ApiProperty({ description: 'UUID of the user being assigned to the project' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ description: 'Access level granted to the user for this specific project', enum: ProjectRole })
  @IsEnum(ProjectRole)
  @IsNotEmpty()
  role!: ProjectRole;
}