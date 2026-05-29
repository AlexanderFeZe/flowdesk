// Roles del sistema
export enum GlobalRole {
  SUPERADMIN = 'superadmin',
}

export enum TenantRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member',
  SUPPORT_AGENT = 'support_agent',
  CLIENT = 'client',
}

// Payload del JWT
export interface JwtPayload {
  sub: string;        // userId
  email: string;
  tenantId: string | null;
  role: GlobalRole | TenantRole;
}

// Eventos de notificaciones (los usa api y notifications)
export enum NotificationEvent {
  TASK_ASSIGNED = 'task.assigned',
  TASK_COMMENTED = 'task.commented',
  TICKET_UPDATED = 'ticket.updated',
  TICKET_REPLIED = 'ticket.replied',
  USER_MENTIONED = 'user.mentioned',
}

export interface NotificationPayload {
  event: NotificationEvent;
  userId: string;
  tenantId: string;
  data: Record<string, unknown>;
}

// Respuesta paginada estándar
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Respuesta estándar de la API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}