const router = require('express').Router();
const { body } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const pool = require('../../config/db');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const sendEmail = require('../../config/email');
const upload = require('../../config/multer');

const generateRef = () => 'ORD-' + Date.now().toString(36).toUpperCase();

const notifyOrderUpdate = async (orderId, subject, message) => {
  const { rows } = await pool.query(
    `SELECT u.email, u.name FROM orders o JOIN users u ON u.id = o.client_id WHERE o.id=$1`,
    [orderId]
  );
  if (rows.length) {
    await sendEmail({ to: rows[0].email, subject, html: `<p>Hi ${rows[0].name},</p><p>${message}</p>` }).catch(() => {});
  }
};

// GET /api/orders — client sees own, staff/admin sees all
router.get('/', authenticate, async (req, res, next) => {
  try {
    const isClient = req.user.role === 'client';
    const query = isClient
      ? `SELECT o.*, s.name AS service_name FROM orders o JOIN services s ON s.id=o.service_id WHERE o.client_id=$1 ORDER BY o.created_at DESC`
      : `SELECT o.*, s.name AS service_name, u.name AS client_name FROM orders o JOIN services s ON s.id=o.service_id JOIN users u ON u.id=o.client_id ORDER BY o.created_at DESC`;
    const params = isClient ? [req.user.id] : [];
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.*, s.name AS service_name, u.name AS client_name,
        sp.tier, sp.price AS package_price
       FROM orders o
       JOIN services s ON s.id=o.service_id
       JOIN users u ON u.id=o.client_id
       LEFT JOIN service_packages sp ON sp.id=o.package_id
       WHERE o.id=$1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Order not found' });
    const order = rows[0];
    if (req.user.role === 'client' && order.client_id !== req.user.id)
      return res.status(403).json({ message: 'Access denied' });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// POST /api/orders — client requests quote or selects package
router.post(
  '/',
  authenticate,
  authorize('client'),
  [body('service_id').isUUID(), body('notes').optional().trim()],
  validate,
  async (req, res, next) => {
    try {
      const { service_id, package_id, notes } = req.body;
      const reference = generateRef();
      const { rows } = await pool.query(
        `INSERT INTO orders (reference, client_id, service_id, package_id, notes)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [reference, req.user.id, service_id, package_id || null, notes]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/orders/:id/quote — staff submits quote
router.patch(
  '/:id/quote',
  authenticate,
  authorize('staff', 'admin'),
  [body('quote_amount').isNumeric()],
  validate,
  async (req, res, next) => {
    try {
      const { quote_amount } = req.body;
      const { rows } = await pool.query(
        `UPDATE orders SET quote_amount=$1, status='quoted', updated_at=NOW()
         WHERE id=$2 AND status='requested' RETURNING *`,
        [quote_amount, req.params.id]
      );
      if (!rows.length) return res.status(404).json({ message: 'Order not found or already quoted' });
      await notifyOrderUpdate(rows[0].id, 'Your Quote is Ready', `Your quote of RWF ${quote_amount} is ready. Log in to accept.`);
      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/orders/:id/confirm — client accepts quote
router.patch('/:id/confirm', authenticate, authorize('client'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE orders SET status='confirmed', updated_at=NOW()
       WHERE id=$1 AND client_id=$2 AND status='quoted' RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Order not found or not in quoted state' });

    // Auto-generate invoice
    await pool.query(
      `INSERT INTO invoices (order_id, amount, due_date)
       SELECT id, quote_amount, NOW() + INTERVAL '7 days' FROM orders WHERE id=$1`,
      [rows[0].id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/status — staff/admin updates status
router.patch(
  '/:id/status',
  authenticate,
  authorize('staff', 'admin'),
  [body('status').isIn(['in_progress', 'in_review', 'completed', 'cancelled'])],
  validate,
  async (req, res, next) => {
    try {
      const { status, progress_percent } = req.body;
      const { rows } = await pool.query(
        `UPDATE orders SET status=$1, progress_percent=COALESCE($2, progress_percent), updated_at=NOW()
         WHERE id=$3 RETURNING *`,
        [status, progress_percent, req.params.id]
      );
      if (!rows.length) return res.status(404).json({ message: 'Order not found' });
      await notifyOrderUpdate(rows[0].id, `Order ${rows[0].reference} Updated`, `Your order status is now: ${status}.`);
      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/orders/:id/cancel — client or admin cancels
router.patch('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const isClient = req.user.role === 'client';
    const { rows } = await pool.query(
      `UPDATE orders SET status='cancelled', updated_at=NOW()
       WHERE id=$1 AND status IN ('requested','quoted','confirmed')
       ${isClient ? 'AND client_id=$2' : ''} RETURNING *`,
      isClient ? [req.params.id, req.user.id] : [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Cannot cancel this order' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/milestones — staff adds milestone
router.post('/:id/milestones', authenticate, authorize('staff', 'admin'), async (req, res, next) => {
  try {
    const { title } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO order_milestones (order_id, title) VALUES ($1,$2) RETURNING *',
      [req.params.id, title]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/milestones/:mid — mark complete
router.patch('/:id/milestones/:mid', authenticate, authorize('staff', 'admin'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE order_milestones SET is_completed=TRUE, completed_at=NOW()
       WHERE id=$1 AND order_id=$2 RETURNING *`,
      [req.params.mid, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/deliverables — staff uploads file
router.post('/:id/deliverables', authenticate, authorize('staff', 'admin'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const file_url = `/uploads/${req.file.filename}`;
    const { rows } = await pool.query(
      'INSERT INTO deliverables (order_id, uploaded_by, file_url, file_name) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.params.id, req.user.id, file_url, req.file.originalname]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/deliverables/:did — client approves or requests revision
router.patch('/:id/deliverables/:did', authenticate, authorize('client'), async (req, res, next) => {
  try {
    const { is_approved, revision_note } = req.body;
    const { rows } = await pool.query(
      `UPDATE deliverables SET is_approved=$1, revision_note=$2
       WHERE id=$3 AND order_id=$4 RETURNING *`,
      [is_approved, revision_note, req.params.did, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id/milestones
router.get('/:id/milestones', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM order_milestones WHERE order_id=$1 ORDER BY created_at', [req.params.id]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id/deliverables
router.get('/:id/deliverables', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM deliverables WHERE order_id=$1 ORDER BY created_at DESC', [req.params.id]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
