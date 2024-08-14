const jwt = require('jsonwebtoken');
// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.cookies.token;
  const token2=req.session.user
  if (!token) {
    // Store the original URL in session or cookie
    req.session.returnTo = req.originalUrl;
    
    // No token provided, redirect to login
    return res.redirect('/connection/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.secretKey);
    req.userId = decoded.userId;
    req.role=decoded.role
    next();
  } catch (err) {
    // Invalid token, redirect to login
    res.redirect('/connection/login');
  }
};

module.exports = authenticate; 


/* const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.cookies.token;

  if (!req.session.user) {
    // Store the original URL in session
    req.session.returnTo = req.originalUrl;
    
    // No token provided, redirect to login
    return res.redirect('/connection');
  }

  try {
    const decoded = jwt.verify(token, process.env.secretKey);
    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (err) {
    // Invalid token, redirect to login
    res.redirect('/connection');
  }
};

module.exports = authenticate;
 */