const checkRole = (roles) => {
  return (req, res, next) => {
    const userRole = req.role; // Supposons que le rôle de l'utilisateur est stocké dans req.user.role
    
    console.log('Rôle de l’utilisateur :', userRole);
    console.log('Rôles autorisés :', roles);
    console.log('Chemin demandé :', req.path);



    if (!userRole) {
      console.log('Aucun rôle utilisateur trouvé');
      req.flash('error', 'Vous devez être connecté pour accéder à cette page');
      return res.redirect('/connection/login');
    }

    if (roles.includes(userRole)) {
      console.log('Accès autorisé');
      next(); // L'utilisateur a l'un des rôles autorisés, passe au middleware suivant
    } else {
      console.log('Accès refusé');
      req.flash('error', 'Erreur (403) : Accès refusé');
      return res.render('AccessDenied', { messages: req.flash() });
    }
  };
};

module.exports = checkRole;
