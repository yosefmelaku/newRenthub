import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_renthub_key_2026_jwt_token_auth_sign_flow!';

/**
 * loadUserFromHeader
 * Verifies JWT token from Authorization header and attaches the user payload to req.user.
 * Rejects deactivated accounts or invalidated sessions.
 */
export const loadUserFromHeader = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const auth = (req.headers['authorization'] as string) || '';
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid authentication header.' });
    }

    const token = auth.slice(7).trim();
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Auth token is empty.' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Unauthorized', message: 'Session token has expired.' });
      }
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or malformed certificate token.' });
    }

    // Enforce active session check if sessionId is present (implements backend logout/revocation)
    if (decoded.sessionId) {
      const session = await prisma.userSession.findUnique({
        where: { id: decoded.sessionId }
      });
      if (!session || session.status !== 'ACTIVE') {
        return res.status(401).json({ error: 'Unauthorized', message: 'Session is logged out or terminated.' });
      }
    }

    const user = await prisma.user.findUnique({
      where:  { id: decoded.id },
      select: { id: true, full_name: true, email: true, role: true, phone: true, is_active: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Owner user not found.' });
    }

    // Blocked / deactivated accounts cannot use the API
    if (!user.is_active) {
      return res.status(403).json({ error: 'Forbidden', message: 'Account is deactivated.' });
    }

    (req as any).user = {
      id:        user.id,
      name:      user.full_name,
      email:     user.email,
      role:      user.role,   // Prisma enum value e.g. "SUPERADMIN", "OWNER", "TENANT"
      phone:     user.phone,
      sessionId: decoded.sessionId
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
 */
export const requireSuperadmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

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

