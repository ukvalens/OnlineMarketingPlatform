const jwt = require('jsonwebtoken');

/**
 * Attaches req.user if a valid JWT is present.
 * Falls back to { role: 'visitor' } for unauthenticated requests.
 * Use this on routes that serve both public visitors and logged-in users.
 */
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    req.user = { role: 'visitor' };
    return next();
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    req.user = { role: 'visitor' };
  }
  next();
};

module.exports = optionalAuth;
