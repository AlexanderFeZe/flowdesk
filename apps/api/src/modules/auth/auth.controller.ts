import { Body, Controller, HttpCode, HttpStatus, Post, Req, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse as SwaggerResponse, ApiTags } from '@nestjs/swagger';
import * as express from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiResponse } from '../../common/interfaces/api-response.interface';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Public onboarding endpoint for executing tenant registration.
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new tenant company and administrative owner' })
  @SwaggerResponse({ status: 201, description: 'Tenant system successfully provisioned' })
  @SwaggerResponse({ status: 400, description: 'Payload structural or validation anomaly detected' })
  @SwaggerResponse({ status: 409, description: 'Target corporate identifier or email conflict' })
  async register(@Body() dto: RegisterDto): Promise<ApiResponse> {
    const result = await this.authService.register(dto);
    return ApiResponse.success(result, 'Tenant workspace and administrator account successfully provisioned');
  }

  /**
   * Public endpoint for administrative and user session generation.
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user credentials and issue session access tokens' })
  @SwaggerResponse({ status: 200, description: 'Ciphers successfully matched; tokens issued' })
  @SwaggerResponse({ status: 401, description: 'Identity assertion failed due to invalid credentials' })
  async login(@Body() dto: LoginDto): Promise<ApiResponse> {
    const tokens = await this.authService.login(dto);
    return ApiResponse.success(tokens, 'Authentication tokens issued successfully');
  }

  /**
   * Public session validation gateway to swap a Refresh Token for a fresh short-lived Access Token.
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renew short-lived access credentials using an active session refresh token' })
  @SwaggerResponse({ status: 200, description: 'Cryptographic identity verified; access token rotated' })
  @SwaggerResponse({ status: 401, description: 'Refresh token signature mismatch or lifecycle expired' })
  async refresh(@Body() body: { refreshToken: string }): Promise<ApiResponse> {
    if (!body.refreshToken) {
      throw new UnauthorizedException('Refresh token payload parameter missing from body context');
    }
    const token = await this.authService.refreshAccessToken(body.refreshToken);
    return ApiResponse.success(token, 'Access session rotated successfully');
  }

  /**
   * Protected session teardown gateway. Extracts the active Bearer token from 
   * the authorization header to register it within the Redis blacklist layer.
   */
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidate current terminal session bounds via token blacklisting' })
  @SwaggerResponse({ status: 200, description: 'Session terminated cleanly and signature blacklisted' })
  @SwaggerResponse({ status: 401, description: 'Missing or malformed Authorization header context' })
  async logout(@Req() request: express.Request): Promise<ApiResponse> {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Authorization session header');
    }

    const token = authHeader.split(' ')[1];
    await this.authService.logout(token);

    return ApiResponse.success(null, 'Session tracking structures successfully decoupled and blacklisted');
  }
}