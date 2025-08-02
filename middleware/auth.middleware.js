const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Access token expired' }); // ✅ triggers refresh
      }
      return res.status(403).json({ message: 'Invalid token' }); // Invalid signature, etc.
    }

    req.userId = decoded.userId;
    next();
  });
};
