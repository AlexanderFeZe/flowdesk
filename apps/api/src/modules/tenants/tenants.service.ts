import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  /**
   * Provisions a new corporate tenant workspace.
   */
  async create(dto: CreateTenantDto): Promise<Tenant> {
    const existingTenant = await this.tenantRepo.findOne({ where: { slug: dto.slug } });
    
    if (existingTenant) {
      throw new ConflictException(`A corporate workspace with the slug '${dto.slug}' already exists`);
    }

    const tenant = this.tenantRepo.create({
      name: dto.name,
      slug: dto.slug,
      maxUsers: dto.maxUsers ?? 5,
      maxProjects: dto.maxProjects ?? 10,
      status: TenantStatus.ACTIVE,
    });

    return await this.tenantRepo.save(tenant);
  }

  /**
   * Retrieves all corporate workspaces for global administration oversight.
   */
  async findAll(): Promise<Tenant[]> {
    return await this.tenantRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Locates a specific corporate workspace by its primary UUID.
   */
  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant workspace with ID '${id}' could not be located`);
    }
    return tenant;
  }

  /**
   * Modifies bounds or structural metadata for an existing workspace.
   */
  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);

    // Guard against slug collision during updates
    if (dto.slug && dto.slug !== tenant.slug) {
      const collision = await this.tenantRepo.findOne({ where: { slug: dto.slug } });
      if (collision) {
        throw new ConflictException(`The target slug '${dto.slug}' is already registered to another workspace`);
      }
    }

    const updatedTenant = this.tenantRepo.merge(tenant, dto);
    return await this.tenantRepo.save(updatedTenant);
  }

  /**
   * Enforces global account suspension, rendering all tenant user tokens invalid.
   */
  async suspend(id: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    
    // Toggle state to enforce strict authorization blocking at the login tier
    tenant.status = tenant.status === TenantStatus.ACTIVE ? TenantStatus.SUSPENDED : TenantStatus.ACTIVE;
    
    return await this.tenantRepo.save(tenant);
  }
}