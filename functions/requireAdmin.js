function requireAdmin(req, res, next) {
  const admin = process.env.ADMIN_EMAIL;
  if (!admin || req.session.user?.email !== admin) {
    return res.status(403).json({ error: 'Acesso restrito ao administrador.' });
  }
  next();
}

module.exports = { requireAdmin };