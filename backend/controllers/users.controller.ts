import { Request, Response } from 'express';
import pool from '../database/db';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, address, role, created_at FROM users ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, address, role FROM users WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/users/signup
 * Registers a new user. Enforces uniqueness on phone number.
 * Hashes the password with bcrypt before storing.
 */
export const signupUser = async (req: Request, res: Response) => {
  const { name, phone, password, role, address } = req.body;

  if (!name?.trim())     return res.status(400).json({ error: 'name is required.' });
  if (!phone?.trim())    return res.status(400).json({ error: 'phone is required.' });
  if (!password)         return res.status(400).json({ error: 'password is required.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  const allowedRoles = ['renter', 'owner'];
  const userRole = allowedRoles.includes(role) ? role : 'renter';

  try {
    // Enforce unique phone number
    const existing = await pool.query(
      'SELECT id FROM users WHERE phone = $1',
      [phone.trim()]
    );
    if ((existing.rowCount ?? 0) > 0) {
      return res.status(409).json({
        error: 'account_exists',
        message: 'An account with this phone number already exists. Please sign in instead.',
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (name, phone, password_hash, role, address, email)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, phone, role, address, email`,
      [
        name.trim(),
        phone.trim(),
        passwordHash,
        userRole,
        address?.trim() ?? '',
        // derive a placeholder email if none provided
        `${phone.trim().replace(/[^0-9]/g, '')}@phone.user`,
      ]
    );

    const user = result.rows[0];
    return res.status(201).json({
      message: 'Account created successfully.',
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
      },
    });
  } catch (error) {
    console.error('[signupUser] error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/users/login
 * Authenticates an existing user by phone + password.
 * Returns 404 if the account does not exist (forces signup).
 * Returns 401 if the password is wrong.
 */
export const loginUser = async (req: Request, res: Response) => {
  const { phone, password } = req.body;

  if (!phone?.trim())  return res.status(400).json({ error: 'phone is required.' });
  if (!password)       return res.status(400).json({ error: 'password is required.' });

  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, address, role, password_hash FROM users WHERE phone = $1',
      [phone.trim()]
    );

    // No account found — tell the frontend to redirect to signup
    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'no_account',
        message: 'No account found with this phone number. Please sign up first.',
      });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        error: 'wrong_password',
        message: 'Incorrect password. Please try again.',
      });
    }

    return res.status(200).json({
      message: 'Login successful.',
      user: {
        name: user.name,
        email: user.email ?? `${user.phone.replace(/[^0-9]/g, '')}@phone.user`,
        phone: user.phone,
        role: user.role,
        address: user.address,
      },
    });
  } catch (error) {
    console.error('[loginUser] error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Keep the old createUser for backward compat with seeding scripts
export const createUser = async (req: Request, res: Response) => {
  const { name, email, role } = req.body;
  try {
    const query = `INSERT INTO users (name, email, role) VALUES ($1, $2, $3) RETURNING *`;
    const result = await pool.query(query, [name, email, role || 'renter']);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
