const router = require('express').Router({ mergeParams: true });
const pool = require('../../config/db');
const authenticate = require('../../middleware/authenticate');
const upload = require('../../config/multer');

// GET /api/orders/:orderId/messages
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.*, u.name AS sender_name, u.role AS sender_role
       FROM messages m JOIN users u ON u.id=m.sender_id
       WHERE m.order_id=$1 ORDER BY m.sent_at ASC`,
      [req.params.orderId]
    );
    // Mark as read
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
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
