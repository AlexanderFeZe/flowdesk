import { IsEmail, IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TenantRole } from '@flowdesk/shared';

export class InviteUserDto {
  @ApiProperty({ description: 'Contact email address for the new member', example: 'dev@alfa.com' })
  @IsEmail({}, { message: 'Must provide a valid email format' })
  @IsNotEmpty({ message: 'Email address is required' })
  email!: string;

  @ApiProperty({ description: 'Member first name', example: 'John' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({ description: 'Member last name', example: 'Doe' })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(50)
  lastName!: string;

  @ApiProperty({ description: 'Operational role within the tenant workspace', enum: TenantRole })
  @IsEnum(TenantRole, { message: 'Role must be a valid tenant classification (admin or member)' })
  @IsNotEmpty({ message: 'Role assignment is required' })
  role!: TenantRole;
}