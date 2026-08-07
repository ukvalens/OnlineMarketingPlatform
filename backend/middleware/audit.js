const pool = require('../config/db');

/**
 * Write an audit log entry.
 * @param {object} opts
 * @param {string}  opts.userId
 * @param {string}  opts.action   - e.g. 'LOGIN', 'ORDER_PLACED'
 * @param {string}  [opts.entity] - table name, e.g. 'orders'
 * @param {string}  [opts.entityId]
 * @param {object}  [opts.meta]
 * @param {object}  [opts.req]    - Express request (for ip + user-agent)
 */
async function audit({ userId, action, entity = null, entityId = null, meta = null, req = null }) {
  try {
    const ip = req
      ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null)
      : null;
    const ua = req ? (req.headers['user-agent'] || null) : null;

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, meta, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId || null, action, entity, entityId || null, meta ? JSON.stringify(meta) : null, ip, ua]
    );
  } catch (_) { /* never crash the request over a log failure */ }
}

module.exports = audit;
