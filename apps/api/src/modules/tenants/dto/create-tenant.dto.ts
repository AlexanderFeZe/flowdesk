import { IsNotEmpty, IsString, MaxLength, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Data transfer object for provisioning new corporate tenants.
 */
export class CreateTenantDto {
  @ApiProperty({ description: 'Corporate entity name', example: 'Alfa Corporation' })
  @IsString({ message: 'Tenant name must be a valid string' })
  @IsNotEmpty({ message: 'Tenant name is required' })
  @MaxLength(100, { message: 'Tenant name cannot exceed 100 characters' })
  name!: string;

  @ApiProperty({ description: 'Unique workspace identifier', example: 'alfa-corp' })
  @IsString({ message: 'Tenant slug must be a valid string' })
  @IsNotEmpty({ message: 'Tenant slug is required' })
  @MaxLength(100, { message: 'Tenant slug cannot exceed 100 characters' })
  slug!: string;

  @ApiPropertyOptional({ description: 'Maximum allowed user seats', default: 5 })
  @IsOptional()
  @IsInt({ message: 'Seat limit must be an integer' })
  @Min(1, { message: 'Must allow at least 1 user seat' })
  maxUsers?: number;

  @ApiPropertyOptional({ description: 'Maximum allowed concurrent projects', default: 10 })
  @IsOptional()
  @IsInt({ message: 'Project limit must be an integer' })
  @Min(1, { message: 'Must allow at least 1 active project' })
  maxProjects?: number;
}