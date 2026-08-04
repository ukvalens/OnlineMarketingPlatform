const router = require('express').Router();
const { body } = require('express-validator');
const pool = require('../../config/db');
const sendEmail = require('../../config/email');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const optionalAuth = require('../../middleware/optionalAuth');
const validate = require('../../middleware/validate');

// POST /api/contact — public
router.post(
  '/',
  optionalAuth,
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('message').trim().notEmpty(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, phone, subject, message, service } = req.body;
      await pool.query(
        'INSERT INTO contact_submissions (name, email, phone, subject, message, service) VALUES ($1,$2,$3,$4,$5,$6)',
        [name, email, phone, subject, message, service || null]
      );
      // Notify admin
      await sendEmail({
        to: process.env.SMTP_USER,
        subject: `New Contact: ${subject || 'General Inquiry'}`,
        html: `<p><b>From:</b> ${name} (${email})</p><p>${message}</p>`,
      }).catch(() => {});
      res.json({ message: 'Message received. We will get back to you shortly.' });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/contact — admin reads submissions
router.get('/', authenticate, authorize('admin', 'staff'), async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM contact_submissions ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/contact/testimonials — public; admin/editor sees all
router.get('/testimonials', optionalAuth, async (req, res, next) => {
  try {
    const role = req.user?.role;
    const isEditor = role === 'editor' || role === 'admin';
    const { rows } = await pool.query(
      isEditor
        ? 'SELECT * FROM testimonials ORDER BY created_at DESC'
        : 'SELECT * FROM testimonials WHERE is_published=TRUE ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/testimonials — admin/editor
router.post('/testimonials', authenticate, authorize('admin', 'editor'), async (req, res, next) => {
  try {
    const { client_name, company, content, rating, is_published } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO testimonials (client_name, company, content, rating, is_published) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [client_name, company, content, rating, is_published ?? false]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/testimonials/:id — admin/editor
router.put('/testimonials/:id', authenticate, authorize('admin', 'editor'), async (req, res, next) => {
  try {
    const { client_name, company, content, rating, is_published } = req.body;
    const { rows } = await pool.query(
      `UPDATE testimonials SET client_name=COALESCE($1,client_name), company=COALESCE($2,company),
       content=COALESCE($3,content), rating=COALESCE($4,rating), is_published=COALESCE($5,is_published)
       WHERE id=$6 RETURNING *`,
      [client_name, company, content, rating, is_published, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/testimonials/:id — admin/editor
router.delete('/testimonials/:id', authenticate, authorize('admin', 'editor'), async (req, res, next) => {
  try {
    await pool.query('DELETE FROM testimonials WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
