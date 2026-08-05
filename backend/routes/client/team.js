const router = require('express').Router();
const pool = require('../../config/db');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const upload = require('../../config/multer');

// GET /api/team — public
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM team_members WHERE is_published=TRUE ORDER BY display_order ASC, created_at ASC'
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/team/all — admin/editor sees all including unpublished
router.get('/all', authenticate, authorize('admin', 'editor'), async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM team_members ORDER BY display_order ASC, created_at ASC');
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/team — admin/editor
router.post('/', authenticate, authorize('admin', 'editor'), upload.single('photo'), async (req, res, next) => {
  try {
    const { name, role, bio, display_order, is_published } = req.body;
    const avatar_url = req.file ? `/uploads/${req.file.filename}` : null;
    const { rows } = await pool.query(
      `INSERT INTO team_members (name, role, bio, avatar_url, display_order, is_published)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, role, bio, avatar_url, display_order || 0, is_published ?? true]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/team/:id — admin/editor
router.put('/:id', authenticate, authorize('admin', 'editor'), upload.single('photo'), async (req, res, next) => {
  try {
    const { name, role, bio, display_order, is_published } = req.body;
    const avatar_url = req.file ? `/uploads/${req.file.filename}` : undefined;
    const { rows } = await pool.query(
      `UPDATE team_members SET
        name=COALESCE($1,name), role=COALESCE($2,role), bio=COALESCE($3,bio),
        avatar_url=COALESCE($4,avatar_url), display_order=COALESCE($5,display_order),
        is_published=COALESCE($6,is_published)
       WHERE id=$7 RETURNING *`,
      [name, role, bio, avatar_url, display_order, is_published, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/team/:id — admin/editor
router.delete('/:id', authenticate, authorize('admin', 'editor'), async (req, res, next) => {
  try {
    await pool.query('DELETE FROM team_members WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
