/**
 * Role-Based Access Control (RBAC) System
 * Defines permissions for each role and provides helper functions for authorization
 */

export type Role = 'OWNER' | 'ADMIN' | 'SELLER' | 'SUPPORT';

export type Permission =
  // User Management
  | 'users:create'
  | 'users:read'
  | 'users:update'
  | 'users:delete'
  | 'users:manage_roles'
  
  // Company Settings
  | 'company:read'
  | 'company:update'
  | 'company:delete'
  
  // Customers
  | 'customers:create'
  | 'customers:read'
  | 'customers:update'
  | 'customers:delete'
  | 'customers:read_all'  // Can read other users' customers
  
  // Products
  | 'products:create'
  | 'products:read'
  | 'products:update'
  | 'products:delete'
  
  // Orders
  | 'orders:create'
  | 'orders:read'
  | 'orders:update'
  | 'orders:delete'
  | 'orders:read_all'  // Can read other users' orders
  | 'orders:cancel'
  
  // Quotes
  | 'quotes:create'
  | 'quotes:read'
  | 'quotes:update'
  | 'quotes:delete'
  | 'quotes:read_all'  // Can read other users' quotes
  | 'quotes:approve'
  
  // WhatsApp
  | 'whatsapp:send'
  | 'whatsapp:read'
  | 'whatsapp:configure'
  
  // Chatbot
  | 'chatbot:create'
  | 'chatbot:read'
  | 'chatbot:update'
  | 'chatbot:delete'
  
  // Funnel
  | 'funnel:read'
  | 'funnel:update'
  | 'funnel:configure'
  
  // Reports
  | 'reports:read'
  | 'reports:export'
  
  // NPS
  | 'nps:create'
  | 'nps:read'
  | 'nps:update'
  | 'nps:delete'
  
  // Webhooks
  | 'webhooks:create'
  | 'webhooks:read'
  | 'webhooks:update'
  | 'webhooks:delete'
  
  // Tickets
  | 'tickets:create'
  | 'tickets:read'
  | 'tickets:update'
  | 'tickets:delete'
  | 'tickets:read_all'  // Can read all tickets (not just assigned)
  
  // Audit Logs
  | 'audit:read';

/**
 * Permission matrix defining what each role can do
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
    // Full access to everything
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'users:manage_roles',
    'company:read',
    'company:update',
    'company:delete',
    'customers:create',
    'customers:read',
    'customers:update',
    'customers:delete',
    'customers:read_all',
    'products:create',
    'products:read',
    'products:update',
    'products:delete',
    'orders:create',
    'orders:read',
    'orders:update',
    'orders:delete',
    'orders:read_all',
    'orders:cancel',
    'quotes:create',
    'quotes:read',
    'quotes:update',
    'quotes:delete',
    'quotes:read_all',
    'quotes:approve',
    'whatsapp:send',
    'whatsapp:read',
    'whatsapp:configure',
    'chatbot:create',
    'chatbot:read',
    'chatbot:update',
    'chatbot:delete',
    'funnel:read',
    'funnel:update',
    'funnel:configure',
    'reports:read',
    'reports:export',
    'nps:create',
    'nps:read',
    'nps:update',
    'nps:delete',
    'webhooks:create',
    'webhooks:read',
    'webhooks:update',
    'webhooks:delete',
    'tickets:create',
    'tickets:read',
    'tickets:update',
    'tickets:delete',
    'tickets:read_all',
    'audit:read',
  ],
  
  ADMIN: [
    // Can manage users but not change owner role
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'company:read',
    'company:update',
    'customers:create',
    'customers:read',
    'customers:update',
    'customers:delete',
    'customers:read_all',
    'products:create',
    'products:read',
    'products:update',
    'products:delete',
    'orders:create',
    'orders:read',
    'orders:update',
    'orders:delete',
    'orders:read_all',
    'orders:cancel',
    'quotes:create',
    'quotes:read',
    'quotes:update',
    'quotes:delete',
    'quotes:read_all',
    'quotes:approve',
    'whatsapp:send',
    'whatsapp:read',
    'whatsapp:configure',
    'chatbot:create',
    'chatbot:read',
    'chatbot:update',
    'chatbot:delete',
    'funnel:read',
    'funnel:update',
    'funnel:configure',
    'reports:read',
    'reports:export',
    'nps:create',
    'nps:read',
    'nps:update',
    'nps:delete',
    'webhooks:create',
    'webhooks:read',
    'webhooks:update',
    'webhooks:delete',
    'tickets:create',
    'tickets:read',
    'tickets:update',
    'tickets:delete',
    'tickets:read_all',
    'audit:read',
  ],
  
  SELLER: [
    // Can manage sales but not company settings
    'users:read',
    'company:read',
    'customers:create',
    'customers:read',
    'customers:update',
    'products:read',
    'orders:create',
    'orders:read',
    'orders:update',
    'quotes:create',
    'quotes:read',
    'quotes:update',
    'quotes:delete',
    'whatsapp:send',
    'whatsapp:read',
    'funnel:read',
    'funnel:update',
    'reports:read',
    'nps:read',
    'tickets:create',
    'tickets:read',
    'tickets:update',
  ],
  
  SUPPORT: [
    // Can view and communicate, limited modifications
    'users:read',
    'company:read',
    'customers:read',
    'customers:read_all',
    'products:read',
    'orders:read',
    'orders:read_all',
    'quotes:read',
    'quotes:read_all',
    'whatsapp:send',
    'whatsapp:read',
    'funnel:read',
    'reports:read',
    'nps:read',
    'tickets:read',
    'tickets:read_all',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Check if a role has ALL of the specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Check if a role has ANY of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if user owns a resource (for row-level security)
 */
export interface ResourceOwnership {
  userId: string;
  companyId: string;
  role: Role;
}

export function canAccessResource(
  user: ResourceOwnership,
  resource: { userId?: string; companyId: string },
  permission: Permission
): boolean {
  // Company isolation: must be from same company
  if (user.companyId !== resource.companyId) {
    return false;
  }

  // Check if user has permission
  if (!hasPermission(user.role, permission)) {
    return false;
  }

  // If permission includes "read_all", user can access any resource in their company
  const canReadAll = permission.includes(':read') && hasPermission(
    user.role,
    permission.replace(':read', ':read_all') as Permission
  );

  if (canReadAll) {
    return true;
  }

  // Otherwise, check ownership (user can only access their own resources)
  if (resource.userId && resource.userId !== user.userId) {
    return false;
  }

  return true;
}

/**
 * Role hierarchy for comparisons
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  SELLER: 2,
  SUPPORT: 1,
};

/**
 * Check if one role has higher or equal authority than another
 */
export function hasHigherOrEqualRole(roleA: Role, roleB: Role): boolean {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
}

/**
 * Check if one role has higher authority than another
 */
export function hasHigherRole(roleA: Role, roleB: Role): boolean {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
}
