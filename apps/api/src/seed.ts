import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { Tenant, TenantStatus } from './modules/tenants/entities/tenant.entity';
import { User } from './modules/users/entities/user.entity';
import { GlobalRole, TenantRole } from '@flowdesk/shared';
import * as bcrypt from 'bcryptjs';

async function runSeed() {
  console.log('🌱 Starting database seeding process...');
  
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const dataSource = app.get(DataSource);
  
  const tenantRepo = dataSource.getRepository(Tenant);
  const userRepo = dataSource.getRepository(User);

  try {
    console.log('🧹 Cleaning old data...');
    await dataSource.query('TRUNCATE TABLE tenants, users CASCADE;');

    const passwordHash = await bcrypt.hash('password123', 10);

    console.log('👑 Seeding Superadmin...');
    const superadmin = userRepo.create({
      email: 'superadmin@flowdesk.com',
      passwordHash,
      firstName: 'Alexander',
      lastName: 'Super',
      role: GlobalRole.SUPERADMIN,
      tenantId: null,
      isActive: true,
    });
    await userRepo.save(superadmin);

    console.log('🏢 Seeding Tenants...');
    const tenantsData = [
      { name: 'Empresa Alfa', slug: 'alfa', maxUsers: 10, maxProjects: 20 },
      { name: 'Empresa Beta', slug: 'beta', maxUsers: 5, maxProjects: 10 },
    ];

    for (const tData of tenantsData) {
      const tenant = tenantRepo.create({
        name: tData.name,
        slug: tData.slug,
        status: TenantStatus.ACTIVE,
        maxUsers: tData.maxUsers,
        maxProjects: tData.maxProjects,
      });
      const savedTenant = await tenantRepo.save(tenant);

      console.log(`👥 Seeding users for tenant: ${tData.name}...`);
      const usersToSeed = [
        { email: `admin@${tData.slug}.com`, first: 'Juan Carlos', last: 'Admin', role: TenantRole.ADMIN },
        { email: `manager@${tData.slug}.com`, first: 'Evelyn', last: 'Manager', role: TenantRole.MANAGER },
        { email: `member@${tData.slug}.com`, first: 'Dev', last: 'Remote', role: TenantRole.MEMBER },
        { email: `client@${tData.slug}.com`, first: 'Client', last: 'Corporation', role: TenantRole.CLIENT },
      ];

      for (const uData of usersToSeed) {
        const user = userRepo.create({
          email: uData.email,
          passwordHash,
          firstName: uData.first,
          lastName: uData.last,
          role: uData.role,
          tenantId: savedTenant.id,
          isActive: true,
        });
        await userRepo.save(user);
      }
    }

    console.log('✅ Database successfully seeded with professional core data!');
  } catch (error) {
    console.error('❌ Error executing database seeding:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

runSeed();