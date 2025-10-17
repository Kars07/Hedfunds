module.exports.protect = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Not authorized. Please log in." });
  }
  req.user = { id: req.session.userId, isAdmin: req.session.isAdmin || false, }; // Attach user info to the request object
  next();
};

exports.isAdmin = (req, res, next) => {
  if(!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
};