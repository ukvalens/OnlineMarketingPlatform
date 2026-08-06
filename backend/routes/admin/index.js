/**
 * backend/routes/admin/index.js
 *
 * Changes:
 * - DELETE /admin/users/:id: hard-deletes a user (admin only), blocks self-deletion,
 *   logs to audit_logs.
 * - DELETE /admin/orders/:id: new — hard-deletes an order with audit log.
 * - DELETE /admin/invoices/:id: new — hard-deletes an invoice with audit log.
 * - DELETE /admin/payments/:id: new — hard-deletes a payment record with audit log.
 */
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

// PATCH /api/admin/users/:id — update profile fields, role, or active status
router.patch('/users/:id', async (req, res, next) => {
  try {
    const { role, is_active, name, email, phone, company_name } = req.body;
    const { rows } = await pool.query(
      `UPDATE users
       SET role         = COALESCE($1, role),
           is_active    = COALESCE($2, is_active),
           name         = COALESCE($3, name),
           email        = COALESCE($4, email),
           phone        = COALESCE($5, phone),
           company_name = COALESCE($6, company_name),
           updated_at   = NOW()
       WHERE id=$7
       RETURNING id, name, email, phone, company_name, role, is_active`,
      [role ?? null, is_active ?? null, name ?? null, email ?? null, phone ?? null, company_name ?? null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id, meta) VALUES ($1,$2,$3,$4,$5)',
      [req.user.id, 'UPDATE_USER', 'users', req.params.id, JSON.stringify({ role, is_active, name, email })]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/admin/users/:id — hard delete (admin only)
router.delete('/users/:id', authorize('admin'), async (req, res, next) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ message: 'You cannot delete your own account.' });

    const { rows } = await pool.query('SELECT name, email FROM users WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });

    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id, meta) VALUES ($1,$2,$3,$4,$5)',
      [req.user.id, 'DELETE_USER', 'users', req.params.id, JSON.stringify({ name: rows[0].name, email: rows[0].email })]
    );
    res.json({ message: 'User deleted.' });
  } catch (err) { next(err); }
});

// DELETE /api/admin/orders/:id
router.delete('/orders/:id', authorize('admin'), async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT reference FROM orders WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Order not found' });
    await pool.query('DELETE FROM orders WHERE id=$1', [req.params.id]);
    await pool.query('INSERT INTO audit_logs (user_id, action, entity, entity_id, meta) VALUES ($1,$2,$3,$4,$5)',
      [req.user.id, 'DELETE_ORDER', 'orders', req.params.id, JSON.stringify({ reference: rows[0].reference })]);
    res.json({ message: 'Order deleted.' });
  } catch (err) { next(err); }
});

// DELETE /api/admin/invoices/:id
router.delete('/invoices/:id', authorize('admin'), async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id FROM invoices WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Invoice not found' });
    await pool.query('DELETE FROM invoices WHERE id=$1', [req.params.id]);
    await pool.query('INSERT INTO audit_logs (user_id, action, entity, entity_id) VALUES ($1,$2,$3,$4)',
      [req.user.id, 'DELETE_INVOICE', 'invoices', req.params.id]);
    res.json({ message: 'Invoice deleted.' });
  } catch (err) { next(err); }
});

// DELETE /api/admin/payments/:id
router.delete('/payments/:id', authorize('admin'), async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id FROM payments WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Payment not found' });
    await pool.query('DELETE FROM payments WHERE id=$1', [req.params.id]);
    await pool.query('INSERT INTO audit_logs (user_id, action, entity, entity_id) VALUES ($1,$2,$3,$4)',
      [req.user.id, 'DELETE_PAYMENT', 'payments', req.params.id]);
    res.json({ message: 'Payment deleted.' });
  } catch (err) { next(err); }
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

// GET /api/admin/messages — all orders with unread counts for staff inbox
router.get('/messages', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.reference, o.status,
              u.name AS client_name,
              su.name AS staff_name,
              COUNT(m.id) FILTER (WHERE m.is_read=FALSE AND m.sender_id != $1) AS unread,
              MAX(m.sent_at) AS last_message_at
       FROM orders o
       JOIN users u ON u.id = o.client_id
       LEFT JOIN users su ON su.id = o.assigned_staff_id
       LEFT JOIN messages m ON m.order_id = o.id
       GROUP BY o.id, u.name, su.name
       HAVING COUNT(m.id) > 0
       ORDER BY last_message_at DESC NULLS LAST`,
      [req.user.id]
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

// GET /api/admin/contacts
router.get('/contacts', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, phone, message, is_read, created_at FROM contact_submissions ORDER BY created_at DESC LIMIT 200`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// PATCH /api/admin/contacts/:id/read — mark as read
router.patch('/contacts/:id/read', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE contact_submissions SET is_read=TRUE WHERE id=$1 RETURNING id, name, email, is_read`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Contact not found' });
    await pool.query('INSERT INTO audit_logs (user_id, action, entity, entity_id) VALUES ($1,$2,$3,$4)',
      [req.user.id, 'MARK_CONTACT_READ', 'contact_submissions', req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
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

// GET /api/admin/finance/summary
router.get('/finance/summary', authorize('admin', 'finance'), async (req, res, next) => {
  try {
    const [kpi, monthly, topClients, byMethod, pending] = await Promise.all([
      pool.query(`
        SELECT
          COALESCE(SUM(amount) FILTER (WHERE status='paid'), 0)    AS total_revenue,
          COALESCE(SUM(amount) FILTER (WHERE status='pending'), 0) AS outstanding,
          COUNT(*) FILTER (WHERE status='paid')                    AS paid_count,
          COUNT(*) FILTER (WHERE status='pending')                 AS pending_count,
          COUNT(*) FILTER (WHERE status='partial')                 AS partial_count,
          COUNT(*) FILTER (WHERE status='failed')                  AS failed_count,
          COUNT(*)                                                 AS total_invoices
        FROM invoices`),
      pool.query(`
        SELECT TO_CHAR(DATE_TRUNC('month', p.paid_at), 'Mon YYYY') AS month,
               DATE_TRUNC('month', p.paid_at) AS month_date,
               COALESCE(SUM(p.amount), 0) AS revenue
        FROM payments p
        WHERE p.status='paid' AND p.paid_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', p.paid_at)
        ORDER BY month_date ASC`),
      pool.query(`
        SELECT u.name, u.company_name, u.email,
               COALESCE(SUM(i.amount) FILTER (WHERE i.status='paid'), 0) AS total_paid,
               COUNT(DISTINCT o.id) AS order_count
        FROM users u
        JOIN orders o ON o.client_id = u.id
        JOIN invoices i ON i.order_id = o.id
        WHERE u.role = 'client'
        GROUP BY u.id
        ORDER BY total_paid DESC LIMIT 5`),
      pool.query(`
        SELECT p.method, COUNT(*) AS count, COALESCE(SUM(p.amount), 0) AS total
        FROM payments p WHERE p.status='paid'
        GROUP BY p.method`),
      pool.query(`
        SELECT i.id, i.amount, i.due_date, i.created_at, i.status,
               o.reference, u.name AS client_name
        FROM invoices i
        JOIN orders o ON o.id = i.order_id
        JOIN users u ON u.id = o.client_id
        WHERE i.status IN ('pending','partial')
        ORDER BY i.due_date ASC NULLS LAST LIMIT 10`),
    ]);
    res.json({
      kpi: kpi.rows[0],
      monthly_revenue: monthly.rows,
      top_clients: topClients.rows,
      by_method: byMethod.rows,
      pending_invoices: pending.rows,
    });
  } catch (err) { next(err); }
});

// PATCH /api/admin/finance/payments/:id/confirm
router.patch('/finance/payments/:id/confirm', authorize('admin', 'finance'), async (req, res, next) => {
  try {
    const { transaction_ref } = req.body;
    const { rows: payRows } = await pool.query('SELECT * FROM payments WHERE id=$1', [req.params.id]);
    if (!payRows.length) return res.status(404).json({ message: 'Payment not found' });
    const pay = payRows[0];
    if (pay.status === 'paid') return res.status(400).json({ message: 'Already confirmed' });

    const { rows } = await pool.query(
      `UPDATE payments SET status='paid', paid_at=NOW(), transaction_ref=COALESCE($1, transaction_ref)
       WHERE id=$2 RETURNING *`,
      [transaction_ref || null, req.params.id]
    );
    await pool.query(`UPDATE invoices SET status='paid' WHERE id=$1`, [pay.invoice_id]);
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id, meta) VALUES ($1,$2,$3,$4,$5)',
      [req.user.id, 'CONFIRM_PAYMENT', 'payments', req.params.id, JSON.stringify({ invoice_id: pay.invoice_id })]
    );
    res.json(rows[0]);
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
