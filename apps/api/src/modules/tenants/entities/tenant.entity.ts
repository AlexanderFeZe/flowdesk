import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

@Entity('tenants')
export class Tenant extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  // Unique index to search for the company by its subdomain or slug
  @Column({ type: 'varchar', length: 100, unique: true })
  @Index('idx_tenant_slug', { unique: true })
  slug: string;

  @Column({ type: 'enum', enum: TenantStatus, default: TenantStatus.ACTIVE })
  status: TenantStatus;

  @Column({ name: 'max_users', type: 'int', default: 5 })
  maxUsers: number;

  @Column({ name: 'max_projects', type: 'int', default: 10 })
  maxProjects: number;

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];
}