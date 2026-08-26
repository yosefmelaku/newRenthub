import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';

/**
 * POST /api/auth/login
 * Email + password login for all roles (owner, superadmin, tenant).
 * Uses bcrypt.compare — never plain-text comparison.
 * Returns the user's DB role exactly as stored so the frontend can route correctly.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where:  { email: email.trim().toLowerCase() },
      select: {
        id:            true,
        full_name:     true,
        email:         true,
        role:          true,
        phone:         true,
        is_active:     true,
        password_hash: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ error: 'Account deactivated. Contact support.' });
      return;
    }

    // Verify password with bcrypt — handles both hashed and legacy plain-text
    const passwordOk = user.password_hash
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    if (!passwordOk) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    // Record the session
    await prisma.userSession.create({ data: { user_id: user.id } });

    // role stored in DB as @map value e.g. "superadmin" | "owner" | "tenant"
    res.status(200).json({
      success: true,
      user: {
        id:    user.id,
        name:  user.full_name,
        email: user.email,
        role:  user.role,   // "superadmin" | "owner" | "tenant"
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user (resolved by loadUserFromHeader middleware).
 */
export const whoami = async (req: Request, res: Response) => {
  const header = (req.headers['x-user-email'] as string) || '';
  const auth   = (req.headers['authorization']  as string) || '';
  const email  = header || (auth.startsWith('Bearer ') ? auth.slice(7) : '');

  if (!email) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const user = await prisma.user.findUnique({
      where:  { email },
      select: { id: true, full_name: true, email: true, role: true, phone: true, is_active: true },
    });

    if (!user)          return res.status(404).json({ error: 'Not found' });
    if (!user.is_active) return res.status(403).json({ error: 'Account deactivated.' });

    return res.status(200).json({
      user: {
        id:    user.id,
        name:  user.full_name,
        email: user.email,
        role:  user.role,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error('[whoami]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
