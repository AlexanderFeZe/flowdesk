import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Task } from '../../tasks/entities/task.entity';
import { User } from '../../users/entities/user.entity';

@Entity('time_entries')
@Index('idx_time_entry_user_date', ['userId', 'startTime'])
export class TimeEntry extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'start_time', type: 'timestamp with time zone' })
  startTime: Date;

  // If 'endTime' is NULL, it means that the timer (Live Timer) is actively running
  @Column({ name: 'end_time', type: 'timestamp with time zone', nullable: true })
  endTime: Date | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  hours: number | null;

  @Column({ name: 'task_id', type: 'uuid' })
  @Index('idx_time_entry_task_id')
  taskId: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index('idx_time_entry_tenant_id')
  tenantId: string;
}