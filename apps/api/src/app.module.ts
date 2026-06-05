import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { RedisBlacklistService } from './common/services/redis-blacklist.service';
import { TenantsModule } from './modules/tenants/tenants.module';

@Module({
  imports: [
    // Initialize central configuration state management across the monorepo application boundary
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig, jwtConfig],
    }),
    // Initialize relational data tier connections asynchronously utilizing isolated configuration schemas
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
      }),
    }),
    // Mount the modular authentication security subsystem subdomain
    AuthModule,
    TenantsModule,
  ],
  providers: [
    RedisBlacklistService,
    // Register the Guard globally using NestJS dependency token inversion mechanics.
    // This systematically shields all downstream route handlers across all controllers by default.
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}