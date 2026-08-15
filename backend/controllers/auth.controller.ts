import { Request, Response } from 'express';
import pool from '../database/db';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    // 1. Query public.users to match email
    // Note: If using hashed passwords, compare here with a package like bcrypt instead of a direct string comparison.
    const userQuery = 'SELECT id, name, role, password FROM public.users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = userResult.rows[0];

    // 2. Verify password
    if (user.password !== password) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // 3. Insert active login session
    const insertLoginQuery = 'INSERT INTO public.active_logins (user_id, status) VALUES ($1, $2)';
    await pool.query(insertLoginQuery, [user.id, 'active']);

    // 4. Return user data for UI routing
    res.status(200).json({
      success: true,
      user: {
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};
