const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const pool = require('../../config/db');
const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');

// GET /api/profile
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, phone, role, company_name, industry, created_at FROM users WHERE id=$1',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/profile
router.put(
  '/',
  authenticate,
  [body('email').optional().isEmail().normalizeEmail()],
  validate,
  async (req, res, next) => {
    try {
      const { name, phone, company_name, industry, email } = req.body;
      const { rows } = await pool.query(
        `UPDATE users SET
          name=COALESCE($1,name), phone=COALESCE($2,phone),
          company_name=COALESCE($3,company_name), industry=COALESCE($4,industry),
          email=COALESCE($5,email), updated_at=NOW()
         WHERE id=$6 RETURNING id, name, email, phone, company_name, industry`,
        [name, phone, company_name, industry, email, req.user.id]
      );
      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/profile/password
router.put(
  '/password',
  authenticate,
  [body('current_password').notEmpty(), body('new_password').isLength({ min: 8 })],
  validate,
  async (req, res, next) => {
    try {
      const { current_password, new_password } = req.body;
      const { rows } = await pool.query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
      const valid = await bcrypt.compare(current_password, rows[0].password_hash);
      if (!valid) return res.status(400).json({ message: 'Current password is incorrect' });

      const password_hash = await bcrypt.hash(new_password, 12);
      await pool.query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [password_hash, req.user.id]);
      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
