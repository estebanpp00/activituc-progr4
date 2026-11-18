import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

function usuarioPublico(user) {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    creado: user.creado_en
  };
}

function crearToken(user) {
  return jwt.sign({ sub: String(user.id) }, process.env.JWT_SECRET, { expiresIn: '8h' });
}

router.post('/registro', asyncHandler(async (req, res) => {
  const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!nombre || nombre.length > 100) {
    return res.status(400).json({ error: 'Ingresá un nombre de hasta 100 caracteres.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
    return res.status(400).json({ error: 'Ingresá un email válido.' });
  }
  if (password.length < 6 || password.length > 72) {
    return res.status(400).json({ error: 'La contraseña debe tener entre 6 y 72 caracteres.' });
  }

  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.execute(
    'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
    [nombre, email, hash, 'usuario']
  );
  const user = { id: result.insertId, nombre, email, rol: 'usuario', creado_en: new Date() };
  res.status(201).json({ token: crearToken(user), usuario: usuarioPublico(user) });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const [users] = await pool.execute(
    'SELECT id, nombre, email, password_hash, rol, creado_en FROM usuarios WHERE email = ?',
    [email]
  );

  if (!users.length || !(await bcrypt.compare(password, users[0].password_hash))) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
  }

  const user = usuarioPublico(users[0]);
  res.json({ token: crearToken(users[0]), usuario: user });
}));

router.get('/me', requireAuth, (req, res) => {
  res.json(usuarioPublico(req.user));
});

export default router;
