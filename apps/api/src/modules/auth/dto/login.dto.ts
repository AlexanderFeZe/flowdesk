import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * Data contract for processing user authentication requests.
 */
export class LoginDto {
  @IsEmail({}, { message: 'Invalid email address format' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString({ message: 'Password must be a valid string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;
}