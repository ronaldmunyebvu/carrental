const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TOKEN_EXPIRY = '7d';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies && req.cookies.token;
  const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null) || cookieToken;

  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies && req.cookies.token;
  const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null) || cookieToken;

  if (token) {
    try { req.user = verifyToken(token); } catch { /* ignore */ }
  }
  next();
}

module.exports = { signToken, verifyToken, authMiddleware, optionalAuth };
