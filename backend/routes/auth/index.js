const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body } = require('express-validator');
const pool = require('../../config/db');
const sendEmail = require('../../config/email');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('phone').optional().isMobilePhone(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password, phone, company_name, industry } = req.body;
      const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
      if (exists.rows.length) return res.status(409).json({ message: 'Email already registered' });

      const password_hash = await bcrypt.hash(password, 12);
      const { rows } = await pool.query(
        `INSERT INTO users (name, email, phone, password_hash, company_name, industry)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, email, role`,
        [name, email, phone, password_hash, company_name, industry]
      );
      const user = rows[0];
      res.status(201).json({ token: signToken(user), user });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const { rows } = await pool.query(
        'SELECT id, name, email, role, password_hash, is_active FROM users WHERE email=$1',
        [email]
      );
      const user = rows[0];
      if (!user || !user.is_active) return res.status(401).json({ message: 'Invalid credentials' });
      if (user.role === 'visitor') return res.status(403).json({ message: 'Visitors cannot log in. Please register for an account.' });

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

      const { password_hash, ...safeUser } = user;
      res.json({ token: signToken(user), user: safeUser });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/forgot-password
router.post('/forgot-password', [body('email').isEmail().normalizeEmail()], validate, async (req, res, next) => {
  try {
    const { email } = req.body;
    const { rows } = await pool.query('SELECT id, name FROM users WHERE email=$1', [email]);
    if (!rows.length) return res.json({ message: 'If that email exists, a reset link was sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour
    await pool.query('UPDATE users SET reset_token=$1, reset_token_expires=$2 WHERE email=$3', [token, expires, email]);

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: 'Password Reset – Digital Marketing Platform',
      html: `<p>Hi ${rows[0].name},</p><p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`,
    });
    res.json({ message: 'If that email exists, a reset link was sent.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [body('token').notEmpty(), body('password').isLength({ min: 8 })],
  validate,
  async (req, res, next) => {
    try {
      const { token, password } = req.body;
      const { rows } = await pool.query(
        'SELECT id FROM users WHERE reset_token=$1 AND reset_token_expires > NOW()',
        [token]
      );
      if (!rows.length) return res.status(400).json({ message: 'Invalid or expired token' });

      const password_hash = await bcrypt.hash(password, 12);
      await pool.query(
        'UPDATE users SET password_hash=$1, reset_token=NULL, reset_token_expires=NULL WHERE id=$2',
        [password_hash, rows[0].id]
      );
      res.json({ message: 'Password reset successful' });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, phone, role, company_name, industry, avatar_url, created_at FROM users WHERE id=$1',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
