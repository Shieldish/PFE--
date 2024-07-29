const checkRole = (roles) => {
    return (req, res, next) => {
      const userRole = req.role ; // Assuming user's role is stored in req.user
  
      if (roles.includes(userRole)) {
        next(); // User has one of the allowed roles, proceed to the next middleware
      } else {
        req.flash('error', `error(403) : Access denied `);
        return res.render('AccessDenied',{ messages: req.flash()}) 
      }
    };
  };
  module.exports =checkRole