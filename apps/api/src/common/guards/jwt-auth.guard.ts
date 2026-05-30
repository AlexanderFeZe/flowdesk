import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RedisBlacklistService } from '../services/redis-blacklist.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly blacklistService: RedisBlacklistService,
  ) {
    super();
  }

  /**
   * Intercepts incoming requests to assess global system security parameters 
   * and cross-check token validation signatures against the active blacklist registry.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route or controller has the @Public() decorator bypass anchor
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // Evaluate token existence and process structural validation against the blacklist
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      const isBlacklisted = await this.blacklistService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('This authentication session has been explicitly terminated');
      }
    }

    // Pass execution handling downstream to standard Passport JWT verification pipelines
    const result = await super.canActivate(context);
    return result as boolean;
  }

  /**
   * Handles individual passport security results, mapping credential missing anomalies cleanly.
   */
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or missing authentication token');
    }
    return user;
  }
}