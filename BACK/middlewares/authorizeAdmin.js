function autorizarAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403).json({ error: 'Sem permissão' });
}

module.exports = autorizarAdmin;
