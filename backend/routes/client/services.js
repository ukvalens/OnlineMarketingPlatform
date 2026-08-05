const router = require('express').Router();
const { body } = require('express-validator');
const pool = require('../../config/db');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const optionalAuth = require('../../middleware/optionalAuth');
const validate = require('../../middleware/validate');
const upload = require('../../config/multer');

// GET /api/services — public; admins/editors see all (including inactive)
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const isAdmin = req.user && ['admin', 'editor'].includes(req.user.role);
    const { rows } = await pool.query(`
      SELECT s.*, json_agg(
        json_build_object('id', sp.id, 'tier', sp.tier, 'price', sp.price, 'features', sp.features, 'delivery_days', sp.delivery_days)
        ORDER BY sp.tier
      ) AS packages
      FROM services s
      LEFT JOIN service_packages sp ON sp.service_id = s.id
      ${isAdmin ? '' : 'WHERE s.is_active = TRUE'}
      GROUP BY s.id
      ORDER BY s.name
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/services/:id — public
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, json_agg(
        json_build_object('id', sp.id, 'tier', sp.tier, 'price', sp.price, 'features', sp.features, 'delivery_days', sp.delivery_days)
      ) AS packages
      FROM services s
      LEFT JOIN service_packages sp ON sp.service_id = s.id
      WHERE s.id=$1 GROUP BY s.id`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Service not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/services — admin/editor
router.post(
  '/',
  authenticate,
  authorize('admin', 'editor'),
  upload.single('image'),
  [body('name').trim().notEmpty(), body('category').trim().notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { name, description, category } = req.body;
      const image_url = req.file ? `/uploads/${req.file.filename}` : null;
      const { rows } = await pool.query(
        'INSERT INTO services (name, description, category, image_url) VALUES ($1,$2,$3,$4) RETURNING *',
        [name, description, category, image_url]
      );
      res.status(201).json(rows[0]);
    } catch (err) { next(err); }
  }
);

// PUT /api/services/:id — admin/editor
router.put('/:id', authenticate, authorize('admin', 'editor'), upload.single('image'), async (req, res, next) => {
  try {
    const { name, description, category, is_active } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : undefined;
    const { rows } = await pool.query(
      `UPDATE services SET name=COALESCE($1,name), description=COALESCE($2,description),
       category=COALESCE($3,category), is_active=COALESCE($4,is_active),
       image_url=COALESCE($5,image_url)
       WHERE id=$6 RETURNING *`,
      [name, description, category, is_active, image_url, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Service not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// POST /api/services/:id/packages — admin/editor (upsert by tier)
router.post(
  '/:id/packages',
  authenticate,
  authorize('admin', 'editor'),
  [body('tier').isIn(['basic', 'standard', 'premium']), body('price').isNumeric()],
  validate,
  async (req, res, next) => {
    try {
      const { tier, price, features, delivery_days } = req.body;
      const { rows } = await pool.query(
        `INSERT INTO service_packages (service_id, tier, price, features, delivery_days)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (service_id, tier) DO UPDATE SET price=$3, features=$4, delivery_days=$5
         RETURNING *`,
        [req.params.id, tier, price, features, delivery_days]
      );
      res.status(201).json(rows[0]);
    } catch (err) { next(err); }
  }
);

// PUT /api/services/:id/packages/:pkgId — admin/editor
router.put('/:id/packages/:pkgId', authenticate, authorize('admin', 'editor'), async (req, res, next) => {
  try {
    const { tier, price, features, delivery_days } = req.body;
    const { rows } = await pool.query(
      `UPDATE service_packages SET tier=COALESCE($1,tier), price=COALESCE($2,price),
       features=COALESCE($3,features), delivery_days=COALESCE($4,delivery_days)
       WHERE id=$5 AND service_id=$6 RETURNING *`,
      [tier, price, features, delivery_days, req.params.pkgId, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Package not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
