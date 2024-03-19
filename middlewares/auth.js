const jwt = require('jsonwebtoken');
// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {

    // Store the original URL in session or cookie
    req.session.returnTo = req.originalUrl;
    
    // No token provided, redirect to login
    return res.redirect('/connection');
  }

  try {
    const decoded = jwt.verify(token, process.env.secretKey);
    req.userId = decoded.userId;
    req.role=decoded.role
    next();
  } catch (err) {
    // Invalid token, redirect to login
    res.redirect('/connection');
  }
};

module.exports = authenticate;