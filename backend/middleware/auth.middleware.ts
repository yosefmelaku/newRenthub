import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

/**
 * loadUserFromHeader
 * Reads Authorization: Bearer <email> (or x-user-email header),
 * looks up the user in PostgreSQL via Prisma, and attaches to req.user.
 * Rejects inactive accounts with 403.
 */
export const loadUserFromHeader = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const header = (req.headers['x-user-email'] as string) || '';
    const auth   = (req.headers['authorization']  as string) || '';
    const email  = header || (auth.startsWith('Bearer ') ? auth.slice(7) : '');

    if (!email) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing auth header.' });
    }

    const user = await prisma.user.findUnique({
      where:  { email },
      select: { id: true, full_name: true, email: true, role: true, phone: true, is_active: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found.' });
    }

    // Blocked / deactivated accounts cannot use the API
    if (!user.is_active) {
      return res.status(403).json({ error: 'Forbidden', message: 'Account is deactivated.' });
    }

    (req as any).user = {
      id:    user.id,
      name:  user.full_name,
      email: user.email,
      role:  user.role,   // Prisma enum value e.g. "SUPERADMIN", "OWNER", "TENANT"
      phone: user.phone,
    };

    return next();
  } catch (err) {
    console.error('[loadUserFromHeader]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * requireSuperadmin
 * Must run after loadUserFromHeader.
 * Prisma UserRole enum maps to the string "superadmin" in the DB via @map("superadmin"),
 * but TypeScript accesses it as the enum key "SUPERADMIN".
 */
export const requireSuperadmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // Prisma enum value coming from the DB is the @map value: "superadmin"
  // Compare against both to be safe regardless of Prisma version behaviour
  const role: string = String(user.role).toLowerCase();
  if (role !== 'superadmin') {
    return res.status(403).json({ error: 'Forbidden', message: 'Super Admin access required.' });
  }
  return next();
};

export const requireOwnerOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const role = String(user.role).toLowerCase();
  if (role !== 'owner' && role !== 'superadmin') {
    return res.status(403).json({ error: 'Forbidden', message: 'Owner or Admin access required.' });
  }
  return next();
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  return next();
};
