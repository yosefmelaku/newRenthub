import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_renthub_key_2026_jwt_token_auth_sign_flow!';

/**
 * POST /api/auth/login
 * Email + password login for all roles (owner, superadmin, tenant).
 * Uses bcrypt.compare — never plain-text comparison.
 * Returns the user's DB role and a secure signed JWT token.
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

    // Verify password with bcrypt
    const passwordOk = user.password_hash
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    if (!passwordOk) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    // Record the session in the DB
    const session = await prisma.userSession.create({ data: { user_id: user.id } });

    // Generate JWT access token with 24 hours validity
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, sessionId: session.id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      token,
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
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'No active session found.' });
  }

  try {
    const userDb = await prisma.user.findUnique({
      where:  { id: user.id },
      select: { id: true, full_name: true, email: true, role: true, phone: true, is_active: true },
    });

    if (!userDb)          return res.status(404).json({ error: 'Not found' });
    if (!userDb.is_active) return res.status(403).json({ error: 'Account deactivated.' });

    return res.status(200).json({
      user: {
        id:    userDb.id,
        name:  userDb.full_name,
        email: userDb.email,
        role:  userDb.role,
        phone: userDb.phone,
      },
    });
  } catch (err) {
    console.error('[whoami]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/auth/logout
 * Terminates the active session in the database.
 */
export const logout = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (user.sessionId) {
      await prisma.userSession.update({
        where: { id: user.sessionId },
        data: { status: 'LOGGED_OUT' },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (err) {
    console.error('[logout]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

