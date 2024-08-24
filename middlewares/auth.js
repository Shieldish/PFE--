const jwt = require('jsonwebtoken');
const authenticate = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    // Store the original URL in session before redirecting to login
    const ignorePaths = ['/favicon.ico', '/sidebar'];
    
    // Check if the original URL should be ignored
    if (!ignorePaths.includes(req.originalUrl)) {
      // Store the original URL in session only if it's not in the ignore list
      req.session.returnTo = req.originalUrl;
    }

    
    return res.redirect('/connection/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.secretKey);
    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (err) {
    res.redirect('/connection/login');
  }
};

module.exports = authenticate; 

