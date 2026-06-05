import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TenantRole } from '@flowdesk/shared';

export class UpdateRoleDto {
  @ApiProperty({ description: 'New operational role assignment', enum: TenantRole })
  @IsEnum(TenantRole, { message: 'Role must be a valid tenant classification' })
  @IsNotEmpty({ message: 'Role assignment is required' })
  role!: TenantRole;
}