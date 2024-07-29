const roleAccess = (req, res, next) => {
    const userRole = req.role
    console.log("User role:", userRole);

    const accessRules = {
        ADMIN: ['all'],
        USER: ['/', '/etudiant', '/entreprise', '/encadrement', '/planification', '/settings', '/files'],
        DEPARTEMENT: ['/', '/etudiant', '/entreprise', '/encadrement', '/planification', '/settings', '/files'],
        ENTREPRISE: ['/', '/entreprise', '/encadrement', '/planification', '/settings', '/files']
    };

    const requestedPath = req.path;
    console.log("Requested path:", requestedPath);
    const allowedPaths = accessRules[userRole] || [];
    console.log("Allowed paths:", allowedPaths);

    const hasAccess = userRole === 'ADMIN' || 
                      allowedPaths.includes('all') || 
                      allowedPaths.includes('/') || 
                      allowedPaths.some(path => requestedPath.startsWith(path));

    console.log("Access granted:", hasAccess);

    if (hasAccess) {
        next();
    } else {
        console.log("Access denied");
        req.flash('error', `error(403) : Access denied`);
        return res.render('AccessDenied', { messages: req.flash() });
    }
};

module.exports = roleAccess;