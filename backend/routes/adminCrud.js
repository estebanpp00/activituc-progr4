import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
const roles = ['admin', 'organizador', 'usuario'];

function errorHttp(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function idValido(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw errorHttp(400, 'El ID debe ser un entero positivo.');
  return id;
}

function texto(value, label, max, { optional = false } = {}) {
  const valueTrimmed = typeof value === 'string' ? value.trim() : '';
  if (!valueTrimmed && optional) return null;
  if (!valueTrimmed || valueTrimmed.length > max) {
    throw errorHttp(400, `${label} es obligatorio y no puede superar ${max} caracteres.`);
  }
  return valueTrimmed;
}

function numero(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw errorHttp(400, `${label} debe ser un número entre ${min} y ${max}.`);
  }
  return parsed;
}

function entero(value, label) {
  const parsed = numero(value, label, { min: 1 });
  if (!Number.isSafeInteger(parsed)) throw errorHttp(400, `${label} debe ser un entero positivo.`);
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

function booleano(value, label) {
  if ([true, 1, '1'].includes(value)) return 1;
  if ([false, 0, '0'].includes(value)) return 0;
  throw errorHttp(400, `${label} debe ser verdadero o falso.`);
}

function estadoActividad(value, { permitirPendiente = true } = {}) {
  const permitidos = permitirPendiente
    ? ['pendiente', 'aprobada', 'rechazada']
    : ['aprobada', 'rechazada'];
  if (!permitidos.includes(value)) {
    const opciones = permitirPendiente ? 'pendiente, aprobada o rechazada' : 'aprobada o rechazada';
    throw errorHttp(400, `El estado debe ser ${opciones}.`);
  }
  return value;
}

const recursos = {
  usuarios: {
    listado: `SELECT id, nombre, email, rol, creado_en FROM usuarios ORDER BY id`,
    uno: `SELECT id, nombre, email, rol, creado_en FROM usuarios WHERE id = ?`,
    crear: async (body) => {
      const nombre = texto(body.nombre, 'El nombre', 100);
      const email = texto(body.email, 'El email', 150).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw errorHttp(400, 'Ingresá un email válido.');
      const password = typeof body.password === 'string' ? body.password : '';
      if (password.length < 6 || password.length > 72) {
        throw errorHttp(400, 'La contraseña debe tener entre 6 y 72 caracteres.');
      }
      const rol = body.rol || 'usuario';
      if (!roles.includes(rol)) throw errorHttp(400, 'El rol seleccionado no es válido.');
      const hash = await bcrypt.hash(password, 10);
      return {
        sql: 'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
        valores: [nombre, email, hash, rol]
      };
    },
    actualizar: async (body) => {
      const nombre = texto(body.nombre, 'El nombre', 100);
      const email = texto(body.email, 'El email', 150).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw errorHttp(400, 'Ingresá un email válido.');
      const rol = body.rol;
      if (!roles.includes(rol)) throw errorHttp(400, 'El rol seleccionado no es válido.');
      if (body.password) {
        const password = typeof body.password === 'string' ? body.password : '';
        if (password.length < 6 || password.length > 72) {
          throw errorHttp(400, 'La contraseña debe tener entre 6 y 72 caracteres.');
        }
        return {
          sql: 'UPDATE usuarios SET nombre = ?, email = ?, password_hash = ?, rol = ? WHERE id = ?',
          valores: [nombre, email, await bcrypt.hash(password, 10), rol]
        };
      }
      return {
        sql: 'UPDATE usuarios SET nombre = ?, email = ?, rol = ? WHERE id = ?',
        valores: [nombre, email, rol]
      };
    },
    eliminar: 'DELETE FROM usuarios WHERE id = ?'
  },
  etiquetas: {
    listado: 'SELECT id, nombre FROM etiquetas ORDER BY id',
    uno: 'SELECT id, nombre FROM etiquetas WHERE id = ?',
    crear: async (body) => ({
      sql: 'INSERT INTO etiquetas (nombre) VALUES (?)',
      valores: [texto(body.nombre, 'El nombre de la etiqueta', 50)]
    }),
    actualizar: async (body) => ({
      sql: 'UPDATE etiquetas SET nombre = ? WHERE id = ?',
      valores: [texto(body.nombre, 'El nombre de la etiqueta', 50)]
    }),
    eliminar: 'DELETE FROM etiquetas WHERE id = ?'
  },
  actividades: {
    listado: `SELECT a.id, a.nombre, a.descripcion, a.horario, a.precio_mensual,
                    a.precio_semanal, a.imagen_url, a.etiqueta_id, e.nombre AS etiqueta,
                    a.organizador_id, u.nombre AS organizador, a.estado, a.creado_en
             FROM actividades a
             JOIN etiquetas e ON e.id = a.etiqueta_id
             JOIN usuarios u ON u.id = a.organizador_id
             ORDER BY a.id`,
    uno: `SELECT a.id, a.nombre, a.descripcion, a.horario, a.precio_mensual,
                 a.precio_semanal, a.imagen_url, a.etiqueta_id, e.nombre AS etiqueta,
                 a.organizador_id, u.nombre AS organizador, a.estado, a.creado_en
          FROM actividades a
          JOIN etiquetas e ON e.id = a.etiqueta_id
          JOIN usuarios u ON u.id = a.organizador_id
          WHERE a.id = ?`,
    crear: async (body) => ({
      sql: `INSERT INTO actividades
            (nombre, descripcion, horario, precio_mensual, precio_semanal, imagen_url,
             etiqueta_id, organizador_id, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      valores: [
        texto(body.nombre, 'El nombre', 150),
        texto(body.descripcion, 'La descripción', 1000),
        texto(body.horario, 'El horario', 100),
        numero(body.precio_mensual, 'El precio mensual', { max: 99999999.99 }),
        numero(body.precio_semanal, 'El precio semanal', { max: 99999999.99 }),
        urlImagen(body.imagen_url),
        entero(body.etiqueta_id, 'La etiqueta'),
        entero(body.organizador_id, 'El organizador'),
        estadoActividad(body.estado || 'aprobada')
      ]
    }),
    actualizar: async (body) => ({
      sql: `UPDATE actividades SET nombre = ?, descripcion = ?, horario = ?, precio_mensual = ?,
            precio_semanal = ?, imagen_url = ?, etiqueta_id = ?, organizador_id = ?, estado = ? WHERE id = ?`,
      valores: [
        texto(body.nombre, 'El nombre', 150),
        texto(body.descripcion, 'La descripción', 1000),
        texto(body.horario, 'El horario', 100),
        numero(body.precio_mensual, 'El precio mensual', { max: 99999999.99 }),
        numero(body.precio_semanal, 'El precio semanal', { max: 99999999.99 }),
        urlImagen(body.imagen_url),
        entero(body.etiqueta_id, 'La etiqueta'),
        entero(body.organizador_id, 'El organizador'),
        estadoActividad(body.estado)
      ]
    }),
    eliminar: 'DELETE FROM actividades WHERE id = ?'
  },
  inscripciones: {
    listado: `SELECT i.id, i.usuario_id, u.nombre AS usuario, i.actividad_id,
                    a.nombre AS actividad, i.asistio, i.creado_en
             FROM inscripciones i
             JOIN usuarios u ON u.id = i.usuario_id
             JOIN actividades a ON a.id = i.actividad_id
             ORDER BY i.id`,
    uno: `SELECT i.id, i.usuario_id, u.nombre AS usuario, i.actividad_id,
                 a.nombre AS actividad, i.asistio, i.creado_en
          FROM inscripciones i
          JOIN usuarios u ON u.id = i.usuario_id
          JOIN actividades a ON a.id = i.actividad_id
          WHERE i.id = ?`,
    crear: async (body) => ({
      sql: 'INSERT INTO inscripciones (usuario_id, actividad_id, asistio) VALUES (?, ?, ?)',
      valores: [
        entero(body.usuario_id, 'El usuario'),
        entero(body.actividad_id, 'La actividad'),
        booleano(body.asistio ?? false, 'La asistencia')
      ]
    }),
    actualizar: async (body) => ({
      sql: 'UPDATE inscripciones SET usuario_id = ?, actividad_id = ?, asistio = ? WHERE id = ?',
      valores: [
        entero(body.usuario_id, 'El usuario'),
        entero(body.actividad_id, 'La actividad'),
        booleano(body.asistio, 'La asistencia')
      ]
    }),
    eliminar: 'DELETE FROM inscripciones WHERE id = ?'
  },
  resenas: {
    listado: `SELECT r.id, r.usuario_id, u.nombre AS usuario, r.actividad_id,
                    a.nombre AS actividad, r.estrellas, r.comentario, r.creado_en
             FROM resenas r
             JOIN usuarios u ON u.id = r.usuario_id
             JOIN actividades a ON a.id = r.actividad_id
             ORDER BY r.id`,
    uno: `SELECT r.id, r.usuario_id, u.nombre AS usuario, r.actividad_id,
                 a.nombre AS actividad, r.estrellas, r.comentario, r.creado_en
          FROM resenas r
          JOIN usuarios u ON u.id = r.usuario_id
          JOIN actividades a ON a.id = r.actividad_id
          WHERE r.id = ?`,
    crear: async (body) => ({
      sql: 'INSERT INTO resenas (usuario_id, actividad_id, estrellas, comentario) VALUES (?, ?, ?, ?)',
      valores: [
        entero(body.usuario_id, 'El usuario'),
        entero(body.actividad_id, 'La actividad'),
        calificacion(body.estrellas),
        texto(body.comentario, 'El comentario', 500, { optional: true })
      ]
    }),
    actualizar: async (body) => ({
      sql: 'UPDATE resenas SET usuario_id = ?, actividad_id = ?, estrellas = ?, comentario = ? WHERE id = ?',
      valores: [
        entero(body.usuario_id, 'El usuario'),
        entero(body.actividad_id, 'La actividad'),
        calificacion(body.estrellas),
        texto(body.comentario, 'El comentario', 500, { optional: true })
      ]
    }),
    eliminar: 'DELETE FROM resenas WHERE id = ?'
  }
};

function calificacion(value) {
  const parsed = numero(value, 'La calificación', { min: 1, max: 5 });
  if (!Number.isInteger(parsed)) throw errorHttp(400, 'La calificación debe ser un entero de 1 a 5.');
  return parsed;
}

async function obtener(resource, id) {
  const [rows] = await pool.execute(resource.uno, [id]);
  return rows[0] || null;
}

router.get('/resumen', asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM usuarios) AS usuarios,
      (SELECT COUNT(*) FROM etiquetas) AS etiquetas,
      (SELECT COUNT(*) FROM actividades) AS actividades,
      (SELECT COUNT(*) FROM inscripciones) AS inscripciones,
      (SELECT COUNT(*) FROM resenas) AS resenas`
  );
  res.json(rows[0]);
}));

router.get('/metricas', asyncHandler(async (_req, res) => {
  const [categorias] = await pool.query(
    `SELECT e.id, e.nombre AS etiqueta,
            COUNT(DISTINCT a.id) AS actividades,
            COUNT(DISTINCT i.id) AS inscripciones
     FROM etiquetas e
     LEFT JOIN actividades a ON a.etiqueta_id = e.id
     LEFT JOIN inscripciones i ON i.actividad_id = a.id
     GROUP BY e.id, e.nombre
     ORDER BY e.id`
  );
  const [rows] = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM usuarios) AS usuarios,
      (SELECT COUNT(*) FROM actividades) AS actividades,
      (SELECT COUNT(*) FROM inscripciones) AS inscripciones,
      (SELECT COUNT(*) FROM resenas) AS resenas`
  );
  res.json({ categorias, totales: rows[0] });
}));

router.patch('/actividades/:id/estado', asyncHandler(async (req, res) => {
  const id = idValido(req.params.id);
  const estado = estadoActividad(req.body?.estado, { permitirPendiente: false });
  const [result] = await pool.execute(
    'UPDATE actividades SET estado = ? WHERE id = ?',
    [estado, id]
  );
  if (!result.affectedRows) {
    const [rows] = await pool.execute('SELECT id FROM actividades WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'No existe la actividad.' });
  }
  res.json({ id, estado });
}));

router.param('resource', (req, res, next, name) => {
  req.resource = recursos[name];
  if (!req.resource) return res.status(404).json({ error: 'Entidad no encontrada.' });
  next();
});

router.get('/:resource', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute(req.resource.listado);
  res.json(rows);
}));

router.get('/:resource/:id', asyncHandler(async (req, res) => {
  const row = await obtener(req.resource, idValido(req.params.id));
  if (!row) return res.status(404).json({ error: 'No existe el registro.' });
  res.json(row);
}));

router.post('/:resource', asyncHandler(async (req, res) => {
  const { sql, valores } = await req.resource.crear(req.body || {});
  const [result] = await pool.execute(sql, valores);
  const row = await obtener(req.resource, result.insertId);
  res.status(201).json(row);
}));

router.put('/:resource/:id', asyncHandler(async (req, res) => {
  const id = idValido(req.params.id);
  if (!(await obtener(req.resource, id))) return res.status(404).json({ error: 'No existe el registro.' });
  const { sql, valores } = await req.resource.actualizar(req.body || {});
  await pool.execute(sql, [...valores, id]);
  res.json(await obtener(req.resource, id));
}));

router.delete('/:resource/:id', asyncHandler(async (req, res) => {
  const id = idValido(req.params.id);
  const [result] = await pool.execute(req.resource.eliminar, [id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'No existe el registro.' });
  res.status(204).end();
}));

export default router;
