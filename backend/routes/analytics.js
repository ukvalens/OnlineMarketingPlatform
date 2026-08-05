const router = require('express').Router();
const pool = require('../config/db');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// POST /api/analytics/track — public, fire-and-forget
router.post('/track', async (req, res) => {
  const { path, referrer } = req.body;
  if (!path) return res.sendStatus(204);
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
  const ua = req.headers['user-agent'] || null;
  pool.query(
    'INSERT INTO page_views (path, referrer, user_agent, ip) VALUES ($1,$2,$3,$4)',
    [path.slice(0, 500), referrer?.slice(0, 500) || null, ua, ip]
  ).catch(() => {});
  res.sendStatus(204);
});

// GET /api/analytics/summary — admin only
router.get('/summary', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { range = '30' } = req.query; // days
    const days = Math.min(parseInt(range) || 30, 365);

    const [
      totalViews,
      uniqueIPs,
      viewsByDay,
      topPages,
      leads,
      activeOrders,
      revenue,
      newClients,
      leadsByDay,
      ordersByStatus,
    ] = await Promise.all([
      // total page views in range
      pool.query(
        `SELECT COUNT(*) FROM page_views WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL`,
        [days]
      ),
      // unique visitors (by IP) in range
      pool.query(
        `SELECT COUNT(DISTINCT ip) FROM page_views WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL`,
        [days]
      ),
      // views per day for sparkline
      pool.query(
        `SELECT DATE(created_at) AS day, COUNT(*) AS views
         FROM page_views
         WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
         GROUP BY day ORDER BY day`,
        [days]
      ),
      // top 10 pages
      pool.query(
        `SELECT path, COUNT(*) AS views
         FROM page_views
         WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
         GROUP BY path ORDER BY views DESC LIMIT 10`,
        [days]
      ),
      // total leads (contact submissions) in range
      pool.query(
        `SELECT COUNT(*) FROM contact_submissions WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL`,
        [days]
      ),
      // active orders right now
      pool.query(
        `SELECT COUNT(*) FROM orders WHERE status IN ('confirmed','in_progress','in_review')`
      ),
      // revenue in range
      pool.query(
        `SELECT COALESCE(SUM(amount),0) AS total FROM invoices
         WHERE status='paid' AND created_at >= NOW() - ($1 || ' days')::INTERVAL`,
        [days]
      ),
      // new clients in range
      pool.query(
        `SELECT COUNT(*) FROM users WHERE role='client' AND created_at >= NOW() - ($1 || ' days')::INTERVAL`,
        [days]
      ),
      // leads per day for sparkline
      pool.query(
        `SELECT DATE(created_at) AS day, COUNT(*) AS leads
         FROM contact_submissions
         WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
         GROUP BY day ORDER BY day`,
        [days]
      ),
      // orders by status
      pool.query(`SELECT status, COUNT(*) FROM orders GROUP BY status ORDER BY status`),
    ]);

    res.json({
      range: days,
      total_views:    parseInt(totalViews.rows[0].count),
      unique_visitors: parseInt(uniqueIPs.rows[0].count),
      total_leads:    parseInt(leads.rows[0].count),
      active_orders:  parseInt(activeOrders.rows[0].count),
      revenue_rwf:    parseFloat(revenue.rows[0].total),
      new_clients:    parseInt(newClients.rows[0].count),
      views_by_day:   viewsByDay.rows,
      leads_by_day:   leadsByDay.rows,
      top_pages:      topPages.rows,
      orders_by_status: ordersByStatus.rows,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
