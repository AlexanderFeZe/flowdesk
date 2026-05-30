import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Tenant, TenantStatus } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import { TenantRole, JwtPayload } from '@flowdesk/shared';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registers a new company tenant alongside its administrative user.
   * Utilizes an isolated database transaction to guarantee atomicity.
   */
  async register(dto: RegisterDto): Promise<{ user: Omit<User, 'passwordHash'>; accessToken: string; refreshToken: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const tenantRepo = queryRunner.manager.getRepository(Tenant);
    const userRepo = queryRunner.manager.getRepository(User);

    try {
      // Enforce unique multi-tenant identifier constraints early
      const existingTenant = await tenantRepo.findOne({ where: { slug: dto.tenantSlug } });
      if (existingTenant) {
        throw new ConflictException('The requested corporate tenant slug is already taken');
      }

      const existingUser = await userRepo.findOne({
        where: { email: dto.email },
      });
      if (existingUser) {
        throw new ConflictException('Administrative email address is already registered');
      }

      // Initialize and persist the corporate isolation layer
      const tenant = tenantRepo.create({
        name: dto.tenantName,
        slug: dto.tenantSlug,
        status: TenantStatus.ACTIVE,
      });
      const savedTenant = await tenantRepo.save(tenant);

      // Secure administrative credentials utilizing blowfish block cipher hashing
      const passwordHash = await bcrypt.hash(dto.password, 10);

      // Initialize the Tenant Owner Administrator account
      const user = userRepo.create({
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: TenantRole.ADMIN,
        tenantId: savedTenant.id,
        isActive: true,
      });
      const savedUser = await userRepo.save(user);

      await queryRunner.commitTransaction();

      // Issue operational cryptographic authentication tokens
      const tokens = await this.generateTokens(savedUser);

      // Safely abstract sensitive credential fields from downstream consumers
      const { passwordHash: _, ...sanitizedUser } = savedUser;

      return {
        user: sanitizedUser as Omit<User, 'passwordHash'>,
        ...tokens,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Validates client credentials and issues new session tracking tokens.
   */
  async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const userRepo = this.dataSource.getRepository(User);

    // Locate operational user records using strict object-relation maps to satisfy TypeORM contracts
    const user = await userRepo.findOne({
      where: { email: dto.email, isActive: true },
      relations: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid administrative credentials');
    }

    // Verify tenant state isolation bounds if applicable
    if (user.tenant && user.tenant.status === TenantStatus.SUSPENDED) {
      throw new UnauthorizedException('This corporate workspace account is suspended');
    }

    // Assert computational password equality safely
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid administrative credentials');
    }

    return this.generateTokens(user);
  }

  /**
   * Refreshes a session by signing a new short-lived Access Token.
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const accessToken = await this.jwtService.signAsync(
        {
          sub: payload.sub,
          email: payload.email,
          tenantId: payload.tenantId,
          role: payload.role,
        },
        {
          secret: this.configService.get<string>('jwt.secret'),
          expiresIn: this.configService.get<string>('jwt.expiresIn') as any,
        },
      );

      return { accessToken };
    } catch {
      throw new UnauthorizedException('Session lifecycle signature has expired or is invalid');
    }
  }

  /**
   * Centralized utility to generate token payloads matching organizational schemas.
   */
  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    const secret = this.configService.get<string>('jwt.secret');
    const expiresIn = this.configService.get<string>('jwt.expiresIn');
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn');

    // Type assertions applied to prevent compiler mismatch against StringValue definition
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret,
        expiresIn: expiresIn as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}