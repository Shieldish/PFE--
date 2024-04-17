
const isAdmin = (req, res, next) => {
    if (req.role === 'ADMIN') {
      next();
    } else {
   
       req.flash('error', `error(403) : Access denied `);
       return res.render('AccessDenied',{ messages: req.flash()}) 
   /*   return res.status(403).json({ error: 'Access denied, Admin only' }); */

   
    }
  };
  
  const isUser = (req, res, next) => {
    if (req.role === 'USER' || req.role === 'ADMIN') {
      next();
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }
  };
  module.exports = { isAdmin, isUser };