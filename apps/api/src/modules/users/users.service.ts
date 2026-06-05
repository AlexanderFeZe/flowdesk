import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Provisions a new user account within the isolated boundaries of a specific tenant.
   * Assigns a standard temporary password for immediate structural access.
   */
  async invite(tenantId: string, dto: InviteUserDto): Promise<Omit<User, 'passwordHash'>> {
    const existingUser = await this.userRepo.findOne({
      where: { email: dto.email, tenantId },
    });

    if (existingUser) {
      throw new ConflictException(`User with email ${dto.email} already exists in this workspace`);
    }

    // Standard fallback credential mapping for Option A onboarding
    const defaultPassword = 'Welcome123!';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const user = this.userRepo.create({
      ...dto,
      passwordHash,
      tenantId,
      isActive: true,
    });

    const savedUser = await this.userRepo.save(user);
    const { passwordHash: _, ...sanitizedUser } = savedUser;
    
    return sanitizedUser as Omit<User, 'passwordHash'>;
  }

  /**
   * Retrieves all active personnel registered to the active tenant execution context.
   */
  async findAll(tenantId: string): Promise<User[]> {
    return await this.userRepo.find({
      where: { tenantId },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Locates a specific user ensuring cross-tenant data leakage is strictly prevented.
   */
  async findOne(id: string, tenantId: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id, tenantId },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('User profile could not be located in your workspace');
    }

    return user;
  }

  /**
   * Safely patches user profile metadata.
   */
  async updateProfile(id: string, tenantId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findOne(id, tenantId);
    const updatedUser = this.userRepo.merge(user, dto);
    return await this.userRepo.save(updatedUser);
  }

  /**
   * Elevates or restricts user operational privileges.
   */
  async updateRole(id: string, tenantId: string, dto: UpdateRoleDto): Promise<User> {
    const user = await this.findOne(id, tenantId);
    user.role = dto.role;
    return await this.userRepo.save(user);
  }

  /**
   * Executes a structural soft delete to preserve historical integrity (e.g., ticket assignment history).
   */
  async remove(id: string, tenantId: string): Promise<void> {
    const user = await this.findOne(id, tenantId);
    // Standard TypeORM soft delete populates the deletedAt column automatically
    await this.userRepo.softRemove(user);
  }
}