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
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TasksModule } from './modules/tasks/tasks.module';
import { TicketsModule } from './modules/tickets/tickets.module';

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
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
    }),
    // Mount the modular authentication security subsystem subdomain
    AuthModule,
    TenantsModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    TicketsModule,
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