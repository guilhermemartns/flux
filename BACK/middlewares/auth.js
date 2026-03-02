const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
  // Aceita token via múltiplos canais (fallback para antivírus que interceptam headers)
  const headerToken = req.headers.authorization?.split(' ')[1];
  const customHeader = req.headers['x-auth-token'];
  const queryToken = req.query?.token;
  const bodyToken = req.body?.token;
  const token = headerToken || customHeader || queryToken || bodyToken;
  if (!token) return res.status(401).json({ error: 'Token ausente' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'seuSegredo');
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = autenticar;
