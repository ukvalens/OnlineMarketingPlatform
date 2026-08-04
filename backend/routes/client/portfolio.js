const router = require('express').Router();
const pool = require('../../config/db');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const optionalAuth = require('../../middleware/optionalAuth');
const upload = require('../../config/multer');

// GET /api/portfolio — public (no auth needed); admin/editor sees all including unpublished
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const role = req.user?.role;
    const isEditor = role === 'editor' || role === 'admin';
    const { category } = req.query;
    let query, params;
    if (isEditor) {
      query = category
        ? 'SELECT * FROM portfolio_items WHERE category=$1 ORDER BY created_at DESC'
        : 'SELECT * FROM portfolio_items ORDER BY created_at DESC';
      params = category ? [category] : [];
    } else {
      query = category
        ? 'SELECT * FROM portfolio_items WHERE is_published=TRUE AND category=$1 ORDER BY published_at DESC'
        : 'SELECT * FROM portfolio_items WHERE is_published=TRUE ORDER BY published_at DESC';
      params = category ? [category] : [];
    }
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/portfolio/:id — public
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM portfolio_items WHERE id=$1 AND is_published=TRUE', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/portfolio — editor/admin
router.post('/', authenticate, authorize('editor', 'admin'), upload.single('image'), async (req, res, next) => {
  try {
    const { title, description, client_name, category } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const { rows } = await pool.query(
      `INSERT INTO portfolio_items (title, description, image_url, client_name, category, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title, description, image_url, client_name, category, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/portfolio/:id — editor/admin
router.put('/:id', authenticate, authorize('editor', 'admin'), upload.single('image'), async (req, res, next) => {
  try {
    const { title, description, client_name, category, is_published } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : undefined;
    const { rows } = await pool.query(
      `UPDATE portfolio_items SET
        title=COALESCE($1,title), description=COALESCE($2,description),
        image_url=COALESCE($3,image_url), client_name=COALESCE($4,client_name),
        category=COALESCE($5,category),
        is_published=COALESCE($6,is_published),
        published_at=CASE WHEN $6=TRUE AND is_published=FALSE THEN NOW() ELSE published_at END
       WHERE id=$7 RETURNING *`,
      [title, description, image_url, client_name, category, is_published, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/portfolio/:id — editor/admin
router.delete('/:id', authenticate, authorize('editor', 'admin'), async (req, res, next) => {
  try {
    await pool.query('DELETE FROM portfolio_items WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
