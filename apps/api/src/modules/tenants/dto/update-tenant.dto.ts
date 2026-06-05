import { PartialType } from '@nestjs/swagger';
import { CreateTenantDto } from './create-tenant.dto';

/**
 * Data transfer object for partial updates to existing tenant bounds.
 */
export class UpdateTenantDto extends PartialType(CreateTenantDto) {}