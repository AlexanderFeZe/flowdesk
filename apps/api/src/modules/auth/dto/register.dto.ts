import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

/**
 * Data contract for handling new tenant administrator registration.
 */
export class RegisterDto {
  @IsString({ message: 'Tenant corporate name must be a string' })
  @IsNotEmpty({ message: 'Tenant company name is required' })
  @MaxLength(100, { message: 'Tenant name cannot exceed 100 characters' })
  tenantName!: string;

  @IsString({ message: 'Tenant URL slug must be a string' })
  @IsNotEmpty({ message: 'Tenant slug is required' })
  @MaxLength(100, { message: 'Tenant slug cannot exceed 100 characters' })
  tenantSlug!: string;

  @IsEmail({}, { message: 'Invalid administrative email address format' })
  @IsNotEmpty({ message: 'Administrative email is required' })
  email!: string;

  @IsString({ message: 'Password must be a valid string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long for security compliance' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters' })
  firstName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
  lastName!: string;
}