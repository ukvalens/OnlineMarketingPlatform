const router = require('express').Router();
const { body } = require('express-validator');
const pool = require('../../config/db');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const optionalAuth = require('../../middleware/optionalAuth');
const validate = require('../../middleware/validate');
const upload = require('../../config/multer');

const slugify = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// GET /api/blog — public (no auth needed)
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const { rows } = await pool.query(
      `SELECT b.id, b.title, b.slug, b.excerpt, b.cover_image, b.published_at, u.name AS author
       FROM blog_posts b JOIN users u ON u.id=b.author_id
       WHERE b.status='published' ORDER BY b.published_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/blog/admin/all — editor/admin sees all posts including drafts
router.get('/admin/all', authenticate, authorize('editor', 'admin'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.id, b.title, b.slug, b.excerpt, b.cover_image, b.status, b.published_at, b.created_at, b.updated_at, u.name AS author
       FROM blog_posts b JOIN users u ON u.id=b.author_id
       ORDER BY b.created_at DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/blog/:slug — public
router.get('/:slug', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, u.name AS author FROM blog_posts b JOIN users u ON u.id=b.author_id
       WHERE b.slug=$1 AND b.status='published'`,
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ message: 'Post not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/blog — editor/admin
router.post(
  '/',
  authenticate,
  authorize('editor', 'admin'),
  upload.single('cover_image'),
  [body('title').trim().notEmpty(), body('body').notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { title, body: postBody, excerpt, status = 'draft' } = req.body;
      const slug = slugify(title) + '-' + Date.now();
      const cover_image = req.file ? `/uploads/${req.file.filename}` : null;
      const published_at = status === 'published' ? new Date() : null;
      const { rows } = await pool.query(
        `INSERT INTO blog_posts (title, slug, body, excerpt, cover_image, author_id, status, published_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [title, slug, postBody, excerpt, cover_image, req.user.id, status, published_at]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/blog/:id — editor/admin
router.put('/:id', authenticate, authorize('editor', 'admin'), upload.single('cover_image'), async (req, res, next) => {
  try {
    const { title, body: postBody, excerpt, status } = req.body;
    const { rows } = await pool.query(
      `UPDATE blog_posts SET
        title=COALESCE($1,title), body=COALESCE($2,body), excerpt=COALESCE($3,excerpt),
        ${req.file ? 'cover_image=$4,' : ''}
        status=COALESCE($${req.file ? 5 : 4},status),
        published_at=CASE WHEN $${req.file ? 5 : 4}='published' AND status='draft' THEN NOW() ELSE published_at END,
        updated_at=NOW()
       WHERE id=$${req.file ? 6 : 5} RETURNING *`,
      req.file
        ? [title, postBody, excerpt, `/uploads/${req.file.filename}`, status, req.params.id]
        : [title, postBody, excerpt, status, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/blog/:id — editor/admin
router.delete('/:id', authenticate, authorize('editor', 'admin'), async (req, res, next) => {
  try {
    await pool.query('DELETE FROM blog_posts WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
