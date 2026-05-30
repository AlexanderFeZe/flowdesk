/**
 * Global system infrastructure roles.
 */
export const GlobalRole = {
  SUPERADMIN: 'superadmin',
} as const;

/**
 * Compile-time type inference derived from the GlobalRole bounds.
 */
export type GlobalRole = typeof GlobalRole[keyof typeof GlobalRole];

/**
 * Tenant-scoped workspace roles.
 */
export const TenantRole = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  MEMBER: 'member',
  SUPPORT_AGENT: 'support_agent',
  CLIENT: 'client',
} as const;

/**
 * Compile-time type inference derived from the TenantRole bounds.
 */
export type TenantRole = typeof TenantRole[keyof typeof TenantRole];

/**
 * Core cryptographic authentication token token structure.
 */
export interface JwtPayload {
  sub: string;        // userId
  email: string;
  tenantId: string | null; // null value reserved strictly for system-wide superadmins
  role: GlobalRole | TenantRole;
}

/**
 * Inter-service signaling and event streaming identifiers.
 */
export const NotificationEvent = {
  TASK_ASSIGNED: 'task.assigned',
  TASK_COMMENTED: 'task.commented',
  TICKET_UPDATED: 'ticket.updated',
  TICKET_REPLIED: 'ticket.replied',
  USER_MENTIONED: 'user.mentioned',
} as const;

/**
 * Compile-time type inference derived from the NotificationEvent bounds.
 */
export type NotificationEvent = typeof NotificationEvent[keyof typeof NotificationEvent];

/**
 * Data payload contract for downstream asynchronous notifications transmission.
 */
export interface NotificationPayload {
  event: NotificationEvent;
  userId: string;
  tenantId: string;
  data: Record<string, unknown>;
}

/**
 * Reusable layout wrapper for structured data-grid query arrays.
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Standard processing envelope layout for all HTTP service actions.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}