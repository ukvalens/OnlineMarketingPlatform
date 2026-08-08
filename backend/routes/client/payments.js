const router = require('express').Router();
const pool = require('../../config/db');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const audit = require('../../middleware/audit');

// GET /api/payments/my — client sees their own payment history
router.get('/my', authenticate, authorize('client'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, o.reference, s.name AS service_name
       FROM payments p
       JOIN invoices i ON i.id = p.invoice_id
       JOIN orders o ON o.id = i.order_id
       JOIN services s ON s.id = o.service_id
       WHERE o.client_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /api/payments — finance/admin sees all payments with order ref and client name
router.get('/', authenticate, authorize('admin', 'finance'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, o.reference, u.name AS client_name
       FROM payments p
       JOIN invoices i ON i.id = p.invoice_id
       JOIN orders o ON o.id = i.order_id
       JOIN users u ON u.id = o.client_id
       ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/payments — manually record a payment (finance/admin)
router.post('/', authenticate, authorize('admin', 'finance'), async (req, res, next) => {
  try {
    const { invoice_id, method, amount, transaction_ref } = req.body;
    if (!invoice_id || !method || !amount) {
      return res.status(400).json({ message: 'invoice_id, method and amount are required' });
    }

    const { rows: invRows } = await pool.query('SELECT * FROM invoices WHERE id=$1', [invoice_id]);
    if (!invRows.length) return res.status(404).json({ message: 'Invoice not found' });

    const { rows } = await pool.query(
      `INSERT INTO payments (invoice_id, method, transaction_ref, amount, status, paid_at)
       VALUES ($1,$2,$3,$4,'paid', NOW()) RETURNING *`,
      [invoice_id, method, transaction_ref || null, amount]
    );

    // Mark invoice as paid
    await pool.query(`UPDATE invoices SET status='paid' WHERE id=$1`, [invoice_id]);

    await audit({ userId: req.user.id, action: 'RECORD_PAYMENT', entity: 'payments', entityId: rows[0].id, meta: { invoice_id, method, amount }, req });

    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
