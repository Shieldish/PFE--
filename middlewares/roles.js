const checkRole = (roles) => {
    return (req, res, next) => {
      const userRole = req.role  // Assuming user's role is stored in req.user.role
  
      console.log('User role:', userRole);
      console.log('Allowed roles:', roles);
      console.log('Requested path:', req.path);
  
      if (!userRole) {
        console.log('No user role found');
        req.flash('error', 'You must be logged in to access this page');
        return res.redirect('/login');
      }
  
      if (roles.includes(userRole)) {
        console.log('Access granted');
        next(); // User has one of the allowed roles, proceed to the next middleware
      } else {
        console.log('Access denied');
        req.flash('error', 'error(403): Access denied');
        return res.render('AccessDenied', { messages: req.flash() });
      }
    };
  };
  
  module.exports = checkRole;