import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Project } from './project.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum ProjectRole {
  MANAGER = 'manager', // Can edit project and manage members
  MEMBER = 'member',   // Can only interact with tasks
  VIEWER = 'viewer',   // Read-only access
}

@Entity('project_members')
// Evita que un mismo usuario sea agregado dos veces al mismo proyecto
@Index('idx_project_member_unique', ['projectId', 'userId'], { unique: true, where: 'deleted_at IS NULL' })
@Index('idx_project_member_tenant', ['tenantId'])
export class ProjectMember extends BaseEntity {
  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ type: 'enum', enum: ProjectRole, default: ProjectRole.MEMBER })
  role: ProjectRole;

  // Si borras el proyecto, se borra esta asignación (borrado en cascada lógico)
  @ManyToOne(() => Project, (project) => project.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}