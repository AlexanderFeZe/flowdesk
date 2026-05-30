import { SetMetadata } from '@nestjs/common';
import { GlobalRole, TenantRole } from '@flowdesk/shared';

export const ROLES_KEY = 'roles';

/**
 * Metadata configuration anchor to declare authorized operational roles on target route endpoints.
 */
export const Roles = (...roles: (GlobalRole | TenantRole)[]) => SetMetadata(ROLES_KEY, roles);