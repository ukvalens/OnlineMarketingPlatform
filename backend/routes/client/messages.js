const router = require('express').Router({ mergeParams: true });
const pool = require('../../config/db');
const authenticate = require('../../middleware/authenticate');
const upload = require('../../config/multer');
const sendEmail = require('../../config/email');
const sendSms = require('../../config/sms');

// GET /api/orders/:orderId/messages
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.*, u.name AS sender_name, u.role AS sender_role
       FROM messages m JOIN users u ON u.id=m.sender_id
       WHERE m.order_id=$1 ORDER BY m.sent_at ASC`,
      [req.params.orderId]
    );
    await pool.query(
      'UPDATE messages SET is_read=TRUE WHERE order_id=$1 AND sender_id != $2',
      [req.params.orderId, req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:orderId/messages
router.post('/', authenticate, upload.single('attachment'), async (req, res, next) => {
  try {
    const { content } = req.body;
    const attachment_url = req.file ? `/uploads/${req.file.filename}` : null;
    if (!content && !attachment_url) return res.status(400).json({ message: 'Message or attachment required' });

    const { rows } = await pool.query(
      `INSERT INTO messages (order_id, sender_id, content, attachment_url)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.orderId, req.user.id, content, attachment_url]
    );

    // Notify the other party
    const { rows: orderRows } = await pool.query(
      `SELECT o.reference,
              c.email AS client_email, c.name AS client_name, c.phone AS client_phone,
              s.email AS staff_email,  s.name AS staff_name,  s.phone AS staff_phone
       FROM orders o
       JOIN users c ON c.id = o.client_id
       LEFT JOIN users s ON s.id = o.assigned_staff_id
       WHERE o.id=$1`,
      [req.params.orderId]
    );
    if (orderRows.length) {
      const o = orderRows[0];
      const isClient = req.user.role === 'client';
      const toEmail = isClient ? o.staff_email  : o.client_email;
      const toName  = isClient ? o.staff_name   : o.client_name;
      const toPhone = isClient ? o.staff_phone  : o.client_phone;
      const preview = content ? content.slice(0, 120) : '(attachment)';
      if (toEmail) {
        await sendEmail({
          to: toEmail,
          subject: `New message on order ${o.reference}`,
          html: `<p>Hi ${toName},</p><p>You have a new message on order <strong>${o.reference}</strong>:</p><blockquote>${preview}</blockquote><p>Log in to reply.</p>`,
        }).catch(() => {});
      }
      await sendSms({ to: toPhone, body: `New message on order ${o.reference}: ${preview}` }).catch(() => {});
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:orderId/messages/unread-count
router.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT COUNT(*) FROM messages WHERE order_id=$1 AND sender_id != $2 AND is_read=FALSE',
      [req.params.orderId, req.user.id]
    );
    res.json({ count: parseInt(rows[0].count) });
  } catch (err) { next(err); }
});

module.exports = router;
