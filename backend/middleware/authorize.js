const authorize = (...roles) => (req, res, next) => {
  // If visitor role is explicitly allowed, unauthenticated requests pass through
  const userRole = req.user?.role ?? 'visitor';
  if (!roles.includes(userRole)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

module.exports = authorize;
