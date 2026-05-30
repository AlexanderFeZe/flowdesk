import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { GlobalRole, TenantRole } from '@flowdesk/shared';

@Entity('users')
@Index('idx_user_email_tenant_unique', ['email', 'tenantId'], { 
  unique: true, 
  where: 'deleted_at IS NULL' 
})
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ name: 'first_name', type: 'varchar', length: 50 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 50 })
  lastName: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 30 })
  role: GlobalRole | TenantRole;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  @Index('idx_user_tenant_id')
  tenantId: string | null;

  @ManyToOne(() => Tenant, (tenant) => tenant.users, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant | null;
}