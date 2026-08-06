/**
 * backend/routes/auth/index.js
 *
 * Changes:
 * - POST /auth/register: now creates unverified user and emails a 6-digit OTP
 *   instead of a verification link.
 * - POST /auth/verify-otp: new — validates registration OTP, marks email_verified=TRUE,
 *   returns JWT.
 * - POST /auth/resend-otp: new — regenerates and resends registration OTP.
 * - POST /auth/login: after correct password, sends a login OTP to the user's email
 *   for ALL roles (not just clients). Returns { requiresOtp: true, email } instead
 *   of a JWT directly.
 * - POST /auth/login-otp: new — validates login OTP and returns JWT.
 */
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
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

      await pool.query(
        `INSERT INTO users (name, email, phone, password_hash, company_name, industry, email_verified, email_verify_token, email_verify_expires)
         VALUES ($1,$2,$3,$4,$5,$6, FALSE, $7, $8)`,
        [name, email, phone, password_hash, company_name, industry, otp, otpExpires]
      );

      await sendEmail({
        to: email,
        subject: 'Your verification code – DigitalMarkRW',
        html: `<p>Hi ${name},</p>
               <p>Your email verification code is:</p>
               <h2 style="letter-spacing:8px;font-size:36px;color:#2563eb;">${otp}</h2>
               <p>Enter this code on the verification page. It expires in <strong>15 minutes</strong>.</p>
               <p>If you did not register, ignore this email.</p>`,
      });

      res.status(201).json({ message: 'Registration successful. Please check your email for your 6-digit OTP.' });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/verify-otp
router.post('/verify-otp', [body('email').isEmail().normalizeEmail(), body('otp').isLength({ min: 6, max: 6 })], validate, async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const { rows } = await pool.query(
      'SELECT id, name, email, role FROM users WHERE email=$1 AND email_verify_token=$2 AND email_verified=FALSE AND email_verify_expires > NOW()',
      [email, otp]
    );
    if (!rows.length) return res.status(400).json({ message: 'Invalid or expired OTP.' });

    await pool.query(
      'UPDATE users SET email_verified=TRUE, email_verify_token=NULL, email_verify_expires=NULL WHERE id=$1',
      [rows[0].id]
    );

    const user = rows[0];
    res.json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', [body('email').isEmail().normalizeEmail()], validate, async (req, res, next) => {
  try {
    const { email } = req.body;
    const { rows } = await pool.query('SELECT id, name FROM users WHERE email=$1 AND email_verified=FALSE', [email]);
    if (!rows.length) return res.status(400).json({ message: 'Account not found or already verified.' });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query('UPDATE users SET email_verify_token=$1, email_verify_expires=$2 WHERE id=$3', [otp, otpExpires, rows[0].id]);

    await sendEmail({
      to: email,
      subject: 'Your new verification code – DigitalMarkRW',
      html: `<p>Hi ${rows[0].name},</p>
             <p>Your new verification code is:</p>
             <h2 style="letter-spacing:8px;font-size:36px;color:#2563eb;">${otp}</h2>
             <p>It expires in <strong>15 minutes</strong>.</p>`,
    });

    res.json({ message: 'A new OTP has been sent to your email.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const { rows } = await pool.query(
        'SELECT id, name, email, role, password_hash, is_active, email_verified FROM users WHERE email=$1',
        [email]
      );
      const user = rows[0];
      if (!user || !user.is_active) return res.status(401).json({ message: 'Invalid credentials' });
      if (user.role === 'visitor') return res.status(403).json({ message: 'Visitors cannot log in. Please register for an account.' });

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
      await pool.query(
        'UPDATE users SET email_verify_token=$1, email_verify_expires=$2 WHERE id=$3',
        [otp, otpExpires, user.id]
      );
      await sendEmail({
        to: email,
        subject: 'Your login code – DigitalMarkRW',
        html: `<p>Hi ${user.name},</p>
               <p>Your login verification code is:</p>
               <h2 style="letter-spacing:8px;font-size:36px;color:#2563eb;">${otp}</h2>
               <p>It expires in <strong>10 minutes</strong>. If you did not attempt to log in, secure your account immediately.</p>`,
      });
      return res.json({ requiresOtp: true, email });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login-otp
router.post('/login-otp', [body('email').isEmail().normalizeEmail(), body('otp').isLength({ min: 6, max: 6 })], validate, async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const { rows } = await pool.query(
      'SELECT id, name, email, role FROM users WHERE email=$1 AND email_verify_token=$2 AND email_verify_expires > NOW()',
      [email, otp]
    );
    if (!rows.length) return res.status(400).json({ message: 'Invalid or expired OTP.' });

    await pool.query(
      'UPDATE users SET email_verify_token=NULL, email_verify_expires=NULL WHERE id=$1',
      [rows[0].id]
    );

    const user = rows[0];
    res.json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
});

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
