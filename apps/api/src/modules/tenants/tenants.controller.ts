import { Body, Controller, Get, Param, Patch, Post, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse as SwaggerResponse, ApiTags } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ApiResponse } from '../../common/interfaces/api-response.interface';
import { Roles } from '../../common/decorators/roles.decorator';
import { GlobalRole } from '@flowdesk/shared';

@ApiTags('Tenants Administration')
@ApiBearerAuth()
// This decorator ensures that only system-level administrators can access any route within this controller.
@Roles(GlobalRole.SUPERADMIN)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Provision a new corporate tenant workspace' })
  @SwaggerResponse({ status: 201, description: 'Tenant workspace successfully created' })
  @SwaggerResponse({ status: 409, description: 'Slug collision detected' })
  async create(@Body() createTenantDto: CreateTenantDto): Promise<ApiResponse> {
    const tenant = await this.tenantsService.create(createTenantDto);
    return ApiResponse.success(tenant, 'Corporate workspace provisioned successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all corporate workspaces (Superadmin oversight)' })
  @SwaggerResponse({ status: 200, description: 'List of all platform tenants' })
  async findAll(): Promise<ApiResponse> {
    const tenants = await this.tenantsService.findAll();
    return ApiResponse.success(tenants, 'Platform workspaces retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve structural details of a specific corporate workspace' })
  @SwaggerResponse({ status: 200, description: 'Tenant details located' })
  @SwaggerResponse({ status: 404, description: 'Tenant identifier not found in registry' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse> {
    const tenant = await this.tenantsService.findOne(id);
    return ApiResponse.success(tenant, 'Workspace details retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update structural parameters of a corporate workspace' })
  @SwaggerResponse({ status: 200, description: 'Workspace parameters updated' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ): Promise<ApiResponse> {
    const tenant = await this.tenantsService.update(id, updateTenantDto);
    return ApiResponse.success(tenant, 'Workspace metadata updated successfully');
  }

  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Toggle operational suspension state of a corporate workspace' })
  @SwaggerResponse({ status: 200, description: 'Workspace operational state successfully toggled' })
  async suspend(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse> {
    const tenant = await this.tenantsService.suspend(id);
    const action = tenant.status === 'suspended' ? 'suspended' : 'reactivated';
    return ApiResponse.success(
      tenant,
      `Corporate workspace has been successfully ${action}`,
    );
  }
}