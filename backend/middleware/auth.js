import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { asyncHandler } from './asyncHandler.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Iniciá sesión para continuar.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'La sesión venció. Volvé a ingresar.' });
  }

  const [users] = await pool.execute(
    'SELECT id, nombre, email, rol, creado_en FROM usuarios WHERE id = ?',
    [payload.sub]
  );
  if (!users.length) return res.status(401).json({ error: 'La sesión ya no es válida.' });
  req.user = users[0];
  next();
});

export function requireAdmin(req, res, next) {
  if (req.user?.rol !== 'admin') {
    return res.status(403).json({ error: 'Esta función es solo para administradores.' });
  }
  next();
}
