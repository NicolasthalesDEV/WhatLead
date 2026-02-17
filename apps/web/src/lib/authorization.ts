import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, Claims } from './auth';
import { Permission, hasPermission, canAccessResource, Role } from './permissions';
import { prisma } from '@wacrm/db';

export interface AuthorizedRequest {
  claims: Claims;
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    companyId: string;
  };
}

/**
 * Authorization middleware that verifies authentication and permissions
 * Returns user data if authorized, otherwise returns error response
 */
export async function authorize(
  req: NextRequest,
  requiredPermissions?: Permission | Permission[]
): Promise<{ authorized: true; data: AuthorizedRequest } | { authorized: false; response: NextResponse }> {
  // Verify authentication
  const claims = await verifyAuth(req);
  
  if (!claims) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }),
    };
  }

  // Fetch full user data (uid in claims maps to id in database)
  const user = await prisma.user.findUnique({
    where: { id: claims.uid },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      companyId: true,
    },
  });

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 }),
    };
  }

  // Check permissions if required
  if (requiredPermissions) {
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    const hasAllPermissions = permissions.every(permission => hasPermission(user.role, permission));

    if (!hasAllPermissions) {
      // Log unauthorized access attempt
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          companyId: user.companyId,
          action: 'UNAUTHORIZED_ACCESS',
          resource: req.nextUrl.pathname,
          metadata: {
            method: req.method,
            requiredPermissions: permissions,
            userRole: user.role,
          },
        },
      }).catch(err => console.error('Failed to log unauthorized access:', err));

      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Permissão negada', requiredPermissions: permissions },
          { status: 403 }
        ),
      };
    }
  }

  return {
    authorized: true,
    data: {
      claims,
      user,
    },
  };
}

/**
 * Resource-level authorization
 * Checks if user can access a specific resource considering ownership and permissions
 */
export async function authorizeResource(
  req: NextRequest,
  resourceId: string,
  resourceType: 'order' | 'quote' | 'customer',
  permission: Permission
): Promise<{ authorized: true; data: AuthorizedRequest } | { authorized: false; response: NextResponse }> {
  // First check general authorization
  const result = await authorize(req, permission);
  
  if (!result.authorized) {
    return result;
  }

  const { user } = result.data;

  // Fetch resource to check company ownership
  let resource: { companyId: string } | null = null;

  try {
    switch (resourceType) {
      case 'order':
        resource = await prisma.order.findUnique({
          where: { id: resourceId },
          select: { companyId: true },
        });
        break;
      case 'quote':
        resource = await prisma.quote.findUnique({
          where: { id: resourceId },
          select: { companyId: true },
        });
        break;
      case 'customer':
        resource = await prisma.customer.findUnique({
          where: { id: resourceId },
          select: { companyId: true },
        });
        break;
    }
  } catch (error) {
    console.error(`Error fetching ${resourceType}:`, error);
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Erro ao verificar permissões' }, { status: 500 }),
    };
  }

  if (!resource) {
    return {
      authorized: false,
      response: NextResponse.json({ error: `${resourceType} não encontrado` }, { status: 404 }),
    };
  }

  // Check if resource belongs to user's company
  if (resource.companyId !== user.companyId) {
    // Log unauthorized resource access attempt
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        action: 'UNAUTHORIZED_RESOURCE_ACCESS',
        resource: `${resourceType}:${resourceId}`,
        metadata: {
          method: req.method,
          permission,
          userRole: user.role,
        },
      },
    }).catch(err => console.error('Failed to log unauthorized resource access:', err));

    return {
      authorized: false,
      response: NextResponse.json({ error: 'Acesso negado a este recurso' }, { status: 403 }),
    };
  }

  return {
    authorized: true,
    data: result.data,
  };
}

/**
 * Helper to require specific role(s)
 */
export async function requireRole(
  req: NextRequest,
  allowedRoles: Role | Role[]
): Promise<{ authorized: true; data: AuthorizedRequest } | { authorized: false; response: NextResponse }> {
  const result = await authorize(req);
  
  if (!result.authorized) {
    return result;
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const { user } = result.data;

  if (!roles.includes(user.role)) {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        action: 'UNAUTHORIZED_ROLE_ACCESS',
        resource: req.nextUrl.pathname,
        metadata: {
          method: req.method,
          requiredRoles: roles,
          userRole: user.role,
        },
      },
    }).catch(err => console.error('Failed to log unauthorized role access:', err));

    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Função não autorizada', requiredRoles: roles },
        { status: 403 }
      ),
    };
  }

  return result;
}
