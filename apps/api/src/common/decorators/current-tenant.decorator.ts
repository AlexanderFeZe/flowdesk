import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Parameter decorator to extract the active corporate tenant execution context boundary.
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user?.tenantId || null; // Safely returns null when invoked by a system Superadmin
  },
);