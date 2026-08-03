const router = require('express').Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const pool = require('../../config/db');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

// GET /api/invoices — client sees own, finance/admin sees all
router.get('/', authenticate, async (req, res, next) => {
  try {
    const isClient = req.user.role === 'client';
    const query = isClient
      ? `SELECT i.*, o.reference FROM invoices i JOIN orders o ON o.id=i.order_id WHERE o.client_id=$1 ORDER BY i.created_at DESC`
      : `SELECT i.*, o.reference, u.name AS client_name FROM invoices i JOIN orders o ON o.id=i.order_id JOIN users u ON u.id=o.client_id ORDER BY i.created_at DESC`;
    const { rows } = await pool.query(query, isClient ? [req.user.id] : []);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/invoices/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.*, o.reference, o.client_id, u.name AS client_name, u.email
       FROM invoices i JOIN orders o ON o.id=i.order_id JOIN users u ON u.id=o.client_id
       WHERE i.id=$1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Invoice not found' });
    if (req.user.role === 'client' && rows[0].client_id !== req.user.id)
      return res.status(403).json({ message: 'Access denied' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/invoices/:id/pay — initiate MTN MoMo payment
router.post('/:id/pay', authenticate, authorize('client'), async (req, res, next) => {
  try {
    const { method, phone } = req.body; // method: mtn_momo | airtel_money | card

    const { rows } = await pool.query(
      `SELECT i.*, o.client_id FROM invoices i JOIN orders o ON o.id=i.order_id WHERE i.id=$1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Invoice not found' });
    if (rows[0].client_id !== req.user.id) return res.status(403).json({ message: 'Access denied' });
    if (rows[0].status === 'paid') return res.status(400).json({ message: 'Invoice already paid' });

    const invoice = rows[0];
    const externalId = uuidv4();

    // Record pending payment
    const { rows: payRows } = await pool.query(
      `INSERT INTO payments (invoice_id, method, transaction_ref, amount, status)
       VALUES ($1,$2,$3,$4,'pending') RETURNING *`,
      [invoice.id, method, externalId, invoice.amount]
    );

    if (method === 'mtn_momo') {
      // MTN MoMo Collections API
      const momoRes = await axios.post(
        `${process.env.MOMO_BASE_URL}/collection/v1_0/requesttopay`,
        {
          amount: String(invoice.amount),
          currency: 'RWF',
          externalId,
          payer: { partyIdType: 'MSISDN', partyId: phone },
          payerMessage: `Payment for order invoice`,
          payeeNote: `Invoice ${invoice.id}`,
        },
        {
          headers: {
            Authorization: `Bearer ${await getMoMoToken()}`,
            'X-Reference-Id': externalId,
            'X-Target-Environment': process.env.MOMO_ENVIRONMENT,
            'Ocp-Apim-Subscription-Key': process.env.MOMO_SUBSCRIPTION_KEY,
            'Content-Type': 'application/json',
          },
        }
      ).catch((e) => ({ status: 202, data: { note: 'MoMo sandbox initiated' } }));

      return res.json({ message: 'Payment initiated. Approve on your phone.', payment: payRows[0] });
    }

    // For card — return payment record for frontend to handle with card processor
    res.json({ payment: payRows[0], message: 'Proceed with card payment' });
  } catch (err) {
    next(err);
  }
});

// POST /api/invoices/:id/pay/callback — MoMo webhook
router.post('/:id/pay/callback', async (req, res, next) => {
  try {
    const { externalId, status } = req.body;
    const pgStatus = status === 'SUCCESSFUL' ? 'paid' : 'failed';

    await pool.query(
      `UPDATE payments SET status=$1, gateway_response=$2, paid_at=CASE WHEN $1='paid' THEN NOW() ELSE NULL END
       WHERE transaction_ref=$3`,
      [pgStatus, JSON.stringify(req.body), externalId]
    );

    if (pgStatus === 'paid') {
      await pool.query(
        `UPDATE invoices SET status='paid' WHERE id=(SELECT invoice_id FROM payments WHERE transaction_ref=$1)`,
        [externalId]
      );
    }
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
});

// GET /api/invoices/:id/receipt
router.get('/:id/receipt', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.*, o.reference, u.name AS client_name, u.email,
        json_agg(json_build_object('method', p.method, 'amount', p.amount, 'paid_at', p.paid_at, 'ref', p.transaction_ref)) AS payments
       FROM invoices i
       JOIN orders o ON o.id=i.order_id
       JOIN users u ON u.id=o.client_id
       LEFT JOIN payments p ON p.invoice_id=i.id AND p.status='paid'
       WHERE i.id=$1 GROUP BY i.id, o.reference, u.name, u.email`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Invoice not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Helper: get MoMo access token
async function getMoMoToken() {
  const credentials = Buffer.from(`${process.env.MOMO_API_USER}:${process.env.MOMO_API_KEY}`).toString('base64');
  const { data } = await axios.post(
    `${process.env.MOMO_BASE_URL}/collection/token/`,
    {},
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': process.env.MOMO_SUBSCRIPTION_KEY,
      },
    }
  );
  return data.access_token;
}

module.exports = router;
