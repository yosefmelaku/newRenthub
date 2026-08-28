/**
 * users.controller.ts
 *
 * Handles user registration (signup), phone-based login, and basic CRUD.
 *
 * ─── WHY PRISMA INSTEAD OF A CONNECTION POOL ────────────────────────────────
 * Old approach (raw SQL):
 *   import pool from '../database/db';
 *
 *   // Register
 *   await pool.query(
 *     'INSERT INTO public.users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
 *     [fullName, email, passwordHash, role]
 *   );
 *
 *   // Login
 *   const result = await pool.query(
 *     'SELECT * FROM public.users WHERE email = $1',
 *     [email]
 *   );
 *   const user = result.rows[0];
 *
 * New approach (Prisma Client):
 *   import prisma from '../lib/prisma';
 *
 *   // Register
 *   const user = await prisma.user.create({ data: { full_name, email, password_hash, role } });
 *
 *   // Login
 *   const user = await prisma.user.findUnique({ where: { email } });
 *
 * Benefits:
 *   • No manual $1, $2 parameter indexing — Prisma builds the query safely.
 *   • `select` on create limits what columns are sent back, no post-processing needed.
 *   • Duplicate-key violations surface as PrismaClientKnownRequestError (code P2002),
 *     which can be caught specifically rather than inspecting raw pg error codes.
 *   • bcrypt hashing is applied before prisma.user.create(), keeping concerns separated.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_renthub_key_2026_jwt_token_auth_sign_flow!';

/** bcrypt work factor — 12 rounds is a strong default for 2024+ hardware. */
const SALT_ROUNDS = 12;

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users
// Returns all users (superadmin general listing — no role filter here).
// ─────────────────────────────────────────────────────────────────────────────

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // prisma.user.findMany() replaces:
    //   SELECT id, full_name, email, phone, role, created_at
    //   FROM public.users ORDER BY id ASC
    const users = await prisma.user.findMany({
      select: {
        id:         true,
        full_name:  true,
        email:      true,
        phone:      true,
        role:       true,
        created_at: true,
      },
      orderBy: { id: 'asc' },
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/:id
// ─────────────────────────────────────────────────────────────────────────────

export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // prisma.user.findUnique() replaces:
    //   SELECT id, full_name, email, phone, role FROM public.users WHERE id = $1
    const user = await prisma.user.findUnique({
      where: { id: id as string },
      select: {
        id:        true,
        full_name: true,
        email:     true,
        phone:     true,
        role:      true,
      },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/signup
//
// Registers a new renter or owner via phone number.
// A synthetic email (phone@phone.user) is derived so the unique email
// constraint in the users table is honoured without requiring a real address.
//
// Old SQL equivalent:
//   -- duplicate check
//   SELECT id FROM public.users WHERE email = $1
//   -- insert
//   INSERT INTO public.users (full_name, email, password_hash, role)
//   VALUES ($1, $2, $3, $4)
//   RETURNING full_name, email, phone, role
//
// Replaced by:
//   prisma.user.findFirst({ where: { email: derivedEmail } })
//   prisma.user.create({ data: { ... }, select: { ... } })
// ─────────────────────────────────────────────────────────────────────────────

export const signupUser = async (req: Request, res: Response) => {
  const { name, phone, password, role } = req.body;

  if (!name?.trim())        return res.status(400).json({ error: 'name is required.' });
  if (!phone?.trim())       return res.status(400).json({ error: 'phone is required.' });
  if (!password)            return res.status(400).json({ error: 'password is required.' });
  if (password.length < 8)  return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  const allowedRoles = ['renter', 'owner'];
  const userRole     = allowedRoles.includes(role) ? role : 'renter';

  try {
    // Derive a stable, unique email from the phone number.
    const derivedEmail = `${phone.trim().replace(/[^0-9]/g, '')}@phone.user`;

    // Check for an existing account — replaces:
    //   SELECT id FROM public.users WHERE email = $1
    const existing = await prisma.user.findFirst({
      where: { email: derivedEmail },
    });
    if (existing) {
      return res.status(409).json({
        error:   'account_exists',
        message: 'An account with this phone number already exists. Please sign in instead.',
      });
    }

    // Hash the password before storing — never store plain text.
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // prisma.user.create() replaces:
    //   INSERT INTO public.users (full_name, email, password_hash, role)
    //   VALUES ($1, $2, $3, $4) RETURNING full_name, email, phone, role
    //
    // `select` on create means Prisma only returns the columns listed here,
    // equivalent to a RETURNING clause with explicit column names.
    const user = await prisma.user.create({
      data: {
        full_name:     name.trim(),
        email:         derivedEmail,
        password_hash: passwordHash,
        role:          userRole === 'owner' ? 'OWNER' : 'TENANT',
      },
      select: {
        id:        true,
        full_name: true,
        email:     true,
        phone:     true,
        role:      true,
      },
    });

    const session = await prisma.userSession.create({ data: { user_id: user.id } });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, sessionId: session.id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        id:    user.id,
        name:  user.full_name,
        email: user.email,
        phone: user.phone,
        role:  user.role,
      },
    });
  } catch (error) {
    console.error('[signupUser] error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login  (phone-based, for renters and owners)
//
// Looks up the user by derived email, then verifies the bcrypt hash.
//
// Old SQL equivalent:
//   SELECT * FROM public.users WHERE email = $1
//
// Replaced by:
//   prisma.user.findUnique({ where: { email: derivedEmail }, select: { ... } })
// ─────────────────────────────────────────────────────────────────────────────

export const loginUser = async (req: Request, res: Response) => {
  const { phone, password } = req.body;

  if (!phone?.trim()) return res.status(400).json({ error: 'phone is required.' });
  if (!password)      return res.status(400).json({ error: 'password is required.' });

  try {
    const derivedEmail = `${phone.trim().replace(/[^0-9]/g, '')}@phone.user`;

    // prisma.user.findUnique() replaces:
    //   SELECT * FROM public.users WHERE email = $1
    // `select` ensures password_hash is fetched for comparison but never
    // forwarded to the client in the success response below.
    const user = await prisma.user.findUnique({
      where:  { email: derivedEmail },
      select: {
        id:            true,
        full_name:     true,
        email:         true,
        phone:         true,
        role:          true,
        password_hash: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error:   'no_account',
        message: 'No account found with this phone number. Please sign up first.',
      });
    }

    // Constant-time bcrypt comparison — safe against timing attacks.
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        error:   'wrong_password',
        message: 'Incorrect password. Please try again.',
      });
    }

    const session = await prisma.userSession.create({ data: { user_id: user.id } });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, sessionId: session.id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Never return password_hash to the client.
    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id:    user.id,
        name:  user.full_name,
        email: user.email,
        phone: user.phone,
        role:  user.role,
      },
    });
  } catch (error) {
    console.error('[loginUser] error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users  (admin quick-create — no password)
// ─────────────────────────────────────────────────────────────────────────────

export const createUser = async (req: Request, res: Response) => {
  const { name, email, role } = req.body;
  try {
    // prisma.user.create() replaces:
    //   INSERT INTO public.users (full_name, email, password_hash, role) VALUES ($1, $2, '', $3)
    const user = await prisma.user.create({
      data: {
        full_name:     name,
        email,
        password_hash: '',
        role:          role === 'owner' ? 'OWNER' : 'TENANT',
      },
    });
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
