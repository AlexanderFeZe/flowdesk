import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse as SwaggerResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ApiResponse } from '../../common/interfaces/api-response.interface';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantRole } from '@flowdesk/shared';

@ApiTags('Tenant Members')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('invite')
  @Roles(TenantRole.ADMIN)
  @ApiOperation({ summary: 'Provision a new member account within the current workspace' })
  @SwaggerResponse({ status: 201, description: 'Member provisioned successfully' })
  async invite(
    @Body() dto: InviteUserDto,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    const user = await this.usersService.invite(tenantId, dto);
    return ApiResponse.success(user, 'Member account provisioned successfully');
  }

  @Get()
  @ApiOperation({ summary: 'List all operational members within the workspace' })
  @SwaggerResponse({ status: 200, description: 'Workspace personnel array returned' })
  async findAll(@CurrentTenant() tenantId: string): Promise<ApiResponse> {
    const users = await this.usersService.findAll(tenantId);
    return ApiResponse.success(users, 'Workspace personnel retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve specific member profile metadata' })
  @SwaggerResponse({ status: 200, description: 'Member profile located' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    const user = await this.usersService.findOne(id, tenantId);
    return ApiResponse.success(user, 'Member profile retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update member profile information' })
  @SwaggerResponse({ status: 200, description: 'Profile information updated' })
  async updateProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProfileDto,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    const user = await this.usersService.updateProfile(id, tenantId, dto);
    return ApiResponse.success(user, 'Member profile updated successfully');
  }

  @Patch(':id/role')
  @Roles(TenantRole.ADMIN)
  @ApiOperation({ summary: 'Modify member operational authorization level' })
  @SwaggerResponse({ status: 200, description: 'Member authorization role updated' })
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    const user = await this.usersService.updateRole(id, tenantId, dto);
    return ApiResponse.success(user, 'Member operational role updated successfully');
  }

  @Delete(':id')
  @Roles(TenantRole.ADMIN)
  @ApiOperation({ summary: 'Execute structural soft delete on a member account' })
  @SwaggerResponse({ status: 200, description: 'Member account deactivated safely' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ): Promise<ApiResponse> {
    await this.usersService.remove(id, tenantId);
    return ApiResponse.success(null, 'Member account has been safely deactivated');
  }
}