import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

function errorHttp(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function idValido(value, label = 'El ID') {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw errorHttp(400, `${label} debe ser un entero positivo.`);
  }
  return id;
}

function texto(value, label, max, { optional = false } = {}) {
  const parsed = typeof value === 'string' ? value.trim() : '';
  if (!parsed && optional) return null;
  if (!parsed || parsed.length > max) {
    throw errorHttp(400, `${label} es obligatorio y no puede superar ${max} caracteres.`);
  }
  return parsed;
}

function numero(value, label) {
  if (value === undefined || value === null || value === '') {
    throw errorHttp(400, `${label} debe ser un número válido.`);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 99999999.99) {
    throw errorHttp(400, `${label} debe ser un número entre 0 y 99999999.99.`);
  }
  return parsed;
}

function urlImagen(value) {
  const url = texto(value, 'La URL de imagen', 500, { optional: true });
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
  } catch {
    throw errorHttp(400, 'La imagen debe tener una URL http o https válida.');
  }
  return url;
}

function validarRol(req, res, next) {
  if (!['organizador', 'admin'].includes(req.user.rol)) {
    return res.status(403).json({ error: 'Esta función es solo para organizadores.' });
  }
  next();
}

function camposActividad(body) {
  return [
    texto(body.nombre, 'El nombre', 150),
    texto(body.descripcion, 'La descripción', 1000),
    texto(body.horario, 'El horario', 100),
    numero(body.precio_mensual, 'El precio mensual'),
    numero(body.precio_semanal, 'El precio semanal'),
    urlImagen(body.imagen_url),
    idValido(body.etiqueta_id, 'La etiqueta')
  ];
}

router.use(requireAuth, validarRol);

router.get('/actividades', asyncHandler(async (req, res) => {
  const filtroPropietario = req.user.rol === 'admin' ? '' : 'WHERE a.organizador_id = ?';
  const valores = req.user.rol === 'admin' ? [] : [req.user.id];
  const [rows] = await pool.execute(
    `SELECT a.id, a.nombre, a.descripcion, a.horario, a.precio_mensual,
            a.precio_semanal, a.imagen_url, a.etiqueta_id, e.nombre AS etiqueta,
            a.organizador_id, a.estado, a.creado_en
     FROM actividades a
     JOIN etiquetas e ON e.id = a.etiqueta_id
     ${filtroPropietario}
     ORDER BY a.id DESC`,
    valores
  );
  res.json(rows.map((row) => ({
    ...row,
    precio_mensual: Number(row.precio_mensual),
    precio_semanal: Number(row.precio_semanal)
  })));
}));

router.post('/actividades', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const valores = camposActividad(body);
  const [result] = await pool.execute(
    `INSERT INTO actividades
      (nombre, descripcion, horario, precio_mensual, precio_semanal, imagen_url,
       etiqueta_id, organizador_id, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
    [...valores, req.user.id]
  );
  const [rows] = await pool.execute(
    `SELECT a.id, a.nombre, a.descripcion, a.horario, a.precio_mensual,
            a.precio_semanal, a.imagen_url, a.etiqueta_id, e.nombre AS etiqueta,
            a.organizador_id, a.estado, a.creado_en
     FROM actividades a JOIN etiquetas e ON e.id = a.etiqueta_id
     WHERE a.id = ?`,
    [result.insertId]
  );
  res.status(201).json(rows[0]);
}));

router.put('/actividades/:id', asyncHandler(async (req, res) => {
  const id = idValido(req.params.id);
  const valores = camposActividad(req.body || {});
  const esAdmin = req.user.rol === 'admin';
  const filtroPropietario = esAdmin ? '' : ' AND organizador_id = ?';
  const [result] = await pool.execute(
    `UPDATE actividades SET nombre = ?, descripcion = ?, horario = ?, precio_mensual = ?,
       precio_semanal = ?, imagen_url = ?, etiqueta_id = ?, estado = 'pendiente'
     WHERE id = ?${filtroPropietario}`,
    esAdmin ? [...valores, id] : [...valores, id, req.user.id]
  );
  if (!result.affectedRows) {
    const [rows] = await pool.execute(
      `SELECT id FROM actividades WHERE id = ?${filtroPropietario}`,
      esAdmin ? [id] : [id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'No existe la actividad.' });
  }
  res.json({ id, estado: 'pendiente' });
}));

router.delete('/actividades/:id', asyncHandler(async (req, res) => {
  const id = idValido(req.params.id);
  const esAdmin = req.user.rol === 'admin';
  const filtroPropietario = esAdmin ? '' : ' AND organizador_id = ?';
  const [result] = await pool.execute(
    `DELETE FROM actividades WHERE id = ?${filtroPropietario}`,
    esAdmin ? [id] : [id, req.user.id]
  );
  if (!result.affectedRows) return res.status(404).json({ error: 'No existe la actividad.' });
  res.status(204).end();
}));

router.get('/inscripciones', asyncHandler(async (req, res) => {
  const filtroPropietario = req.user.rol === 'admin' ? '' : 'WHERE a.organizador_id = ?';
  const valores = req.user.rol === 'admin' ? [] : [req.user.id];
  const [rows] = await pool.execute(
    `SELECT i.id, i.usuario_id, u.nombre AS usuario, i.actividad_id,
            a.nombre AS actividad, i.asistio, i.creado_en
     FROM inscripciones i
     JOIN usuarios u ON u.id = i.usuario_id
     JOIN actividades a ON a.id = i.actividad_id
     ${filtroPropietario}
     ORDER BY i.creado_en DESC`,
    valores
  );
  res.json(rows);
}));

router.patch('/inscripciones/:id/asistencia', asyncHandler(async (req, res) => {
  const id = idValido(req.params.id);
  const asistio = req.body?.asistio;
  if (![true, false, 1, 0, '1', '0'].includes(asistio)) {
    throw errorHttp(400, 'La asistencia debe ser 1 o 0.');
  }
  const esAdmin = req.user.rol === 'admin';
  const filtroPropietario = esAdmin ? '' : ' AND a.organizador_id = ?';
  const [result] = await pool.execute(
    `UPDATE inscripciones i
     JOIN actividades a ON a.id = i.actividad_id
     SET i.asistio = ?
     WHERE i.id = ?${filtroPropietario}`,
    esAdmin ? [Number(asistio), id] : [Number(asistio), id, req.user.id]
  );
  if (!result.affectedRows) {
    const [rows] = await pool.execute(
      `SELECT i.id
       FROM inscripciones i
       JOIN actividades a ON a.id = i.actividad_id
       WHERE i.id = ?${filtroPropietario}`,
      esAdmin ? [id] : [id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'No existe la inscripción.' });
  }
  res.json({ id, asistio: Number(asistio) });
}));

export default router;
