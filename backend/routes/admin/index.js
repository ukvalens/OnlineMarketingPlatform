const router = require('express').Router();
const pool = require('../../config/db');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { Parser } = require('json2csv');

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, phone, role, company_name, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
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

// GET /api/admin/export/clients
router.get('/export/clients', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, phone, company_name, industry, created_at FROM users WHERE role=\'client\''
    );
    const csv = new Parser().parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('clients.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/export/orders
router.get('/export/orders', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.reference, u.name AS client, s.name AS service, o.status, o.quote_amount, o.created_at
       FROM orders o JOIN users u ON u.id=o.client_id JOIN services s ON s.id=o.service_id`
    );
    const csv = new Parser().parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('orders.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/export/payments
router.get('/export/payments', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.transaction_ref, p.method, p.amount, p.status, p.paid_at, i.id AS invoice_id, o.reference
       FROM payments p JOIN invoices i ON i.id=p.invoice_id JOIN orders o ON o.id=i.order_id`
    );
    const csv = new Parser().parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('payments.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
