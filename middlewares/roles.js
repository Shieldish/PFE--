const checkRole = (roles) => {
    return (req, res, next) => {
      const userRole = req.role  // Assuming user's role is stored in req.user.role
  
      console.log('User role:', userRole);
      console.log('Allowed roles:', roles);
      console.log('Requested path:', req.path);

      console.log('req.cookies.token :',req.cookies.token)
      console.log('req.session.user :',req.session.user)
      console.log('req.cookies.user :',req.cookies.user)
  
      if (!userRole) {
        console.log('No user role found');
        req.flash('error', 'You must be logged in to access this page');
        return res.redirect('/connection/login');
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