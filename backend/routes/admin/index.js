const router = require('express').Router();
const pool = require('../../config/db');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { Parser } = require('json2csv');

// All admin routes require authentication + at least staff role
router.use(authenticate, authorize('admin', 'finance', 'staff'));

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.company_name, u.industry,
        u.is_active, u.created_at,
        COUNT(DISTINCT o.id) AS order_count,
        COALESCE(SUM(i.amount) FILTER (WHERE i.status='paid'), 0) AS total_paid
       FROM users u
       LEFT JOIN orders o ON o.client_id = u.id
       LEFT JOIN invoices i ON i.order_id = o.id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/users — create user
router.post('/users', async (req, res, next) => {
  try {
    const bcrypt = require('bcryptjs');
    const { name, email, password, phone, role, company_name } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'name, email and password are required' });
    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rows.length) return res.status(409).json({ message: 'Email already registered' });
    const password_hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role, company_name)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, email, phone, role, company_name, is_active, created_at`,
      [name, email, phone || null, password_hash, role || 'client', company_name || null]
    );
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id, meta) VALUES ($1,$2,$3,$4,$5)',
      [req.user.id, 'CREATE_USER', 'users', rows[0].id, JSON.stringify({ role: rows[0].role })]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// GET /api/admin/users/:id/audit
router.get('/users/:id/audit', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, u.name AS actor FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id
       WHERE a.entity_id=$1 ORDER BY a.created_at DESC LIMIT 50`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id — update role or active status
router.patch('/users/:id', async (req, res, next) => {
  try {
    const { role, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE users SET role=COALESCE($1,role), is_active=COALESCE($2,is_active), updated_at=NOW()
       WHERE id=$3 RETURNING id, name, email, role, is_active`,
      [role, is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });

    // Audit log
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id, meta) VALUES ($1,$2,$3,$4,$5)',
      [req.user.id, 'UPDATE_USER', 'users', req.params.id, JSON.stringify({ role, is_active })]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res, next) => {
  try {
    await pool.query('UPDATE users SET is_active=FALSE WHERE id=$1', [req.params.id]);
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id) VALUES ($1,$2,$3,$4)',
      [req.user.id, 'DEACTIVATE_USER', 'users', req.params.id]
    );
    res.json({ message: 'User deactivated' });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/analytics
router.get('/analytics', async (req, res, next) => {
  try {
    const [users, orders, revenue, contacts] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users WHERE role=\'client\''),
      pool.query(`SELECT status, COUNT(*) FROM orders GROUP BY status`),
      pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM invoices WHERE status='paid'`),
      pool.query('SELECT COUNT(*) FROM contact_submissions WHERE is_read=FALSE'),
    ]);

    res.json({
      total_clients: parseInt(users.rows[0].count),
      orders_by_status: orders.rows,
      total_revenue_rwf: parseFloat(revenue.rows[0].total),
      unread_contacts: parseInt(contacts.rows[0].count),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/clients — clients with order + payment summary
router.get('/clients', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         u.id, u.name, u.email, u.phone, u.company_name, u.industry,
         u.is_active, u.created_at,
         COUNT(DISTINCT o.id)                                          AS order_count,
         COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'completed')   AS completed_orders,
         COUNT(DISTINCT o.id) FILTER (WHERE o.status IN ('confirmed','in_progress','in_review')) AS active_orders,
         COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'paid'), 0)  AS total_paid,
         MAX(o.created_at)                                             AS last_order_at
       FROM users u
       LEFT JOIN orders  o ON o.client_id = u.id
       LEFT JOIN invoices i ON i.order_id  = o.id
       WHERE u.role = 'client'
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/admin/clients/:id/orders
router.get('/clients/:id/orders', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.*, s.name AS service_name,
         COALESCE(i.amount, 0) AS invoice_amount, i.status AS invoice_status
       FROM orders o
       JOIN services s ON s.id = o.service_id
       LEFT JOIN invoices i ON i.order_id = o.id
       WHERE o.client_id = $1
       ORDER BY o.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, u.name AS actor FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 200`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

const EXPORT_FIELDS = {
  clients:  ['id','name','email','phone','company_name','industry','created_at'],
  orders:   ['reference','client','service','status','quote_amount','created_at'],
  payments: ['transaction_ref','method','amount','status','paid_at','invoice_id','reference'],
};

// GET /api/admin/export/clients
router.get('/export/clients', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, phone, company_name, industry, created_at FROM users WHERE role=\'client\''
    );
    const csv = new Parser({ fields: EXPORT_FIELDS.clients }).parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('clients.csv');
    res.send(csv);
  } catch (err) { next(err); }
});

// GET /api/admin/export/orders
router.get('/export/orders', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.reference, u.name AS client, s.name AS service, o.status, o.quote_amount, o.created_at
       FROM orders o JOIN users u ON u.id=o.client_id JOIN services s ON s.id=o.service_id`
    );
    const csv = new Parser({ fields: EXPORT_FIELDS.orders }).parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('orders.csv');
    res.send(csv);
  } catch (err) { next(err); }
});

// GET /api/admin/export/payments
router.get('/export/payments', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.transaction_ref, p.method, p.amount, p.status, p.paid_at, i.id AS invoice_id, o.reference
       FROM payments p JOIN invoices i ON i.id=p.invoice_id JOIN orders o ON o.id=i.order_id`
    );
    const csv = new Parser({ fields: EXPORT_FIELDS.payments }).parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('payments.csv');
    res.send(csv);
  } catch (err) { next(err); }
});

module.exports = router;
