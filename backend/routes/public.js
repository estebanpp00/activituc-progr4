import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.get('/etiquetas', asyncHandler(async (_req, res) => {
  const [rows] = await pool.execute('SELECT id, nombre FROM etiquetas ORDER BY nombre');
  res.json(rows);
}));

router.get('/actividades', asyncHandler(async (req, res) => {
  const etiqueta = typeof req.query.etiqueta === 'string' ? req.query.etiqueta : null;
  const filtro = etiqueta ? 'AND e.nombre = ?' : '';
  const [rows] = await pool.execute(
    `SELECT a.id, a.nombre, a.descripcion, a.horario, a.precio_mensual,
            a.precio_semanal, a.imagen_url, e.id AS etiqueta_id, e.nombre AS etiqueta
     FROM actividades a
     JOIN etiquetas e ON e.id = a.etiqueta_id
     WHERE a.estado = 'aprobada' ${filtro}
     ORDER BY a.id DESC`,
    etiqueta ? [etiqueta] : []
  );
  res.json(rows.map((row) => ({
    ...row,
    precio_mensual: Number(row.precio_mensual),
    precio_semanal: Number(row.precio_semanal),
    imagen: row.imagen_url
  })));
}));

router.get('/mi-cuenta', requireAuth, asyncHandler(async (req, res) => {
  const [inscripciones] = await pool.execute(
    `SELECT i.id, i.actividad_id, a.nombre AS actividad, a.horario, i.asistio, i.creado_en,
            r.estrellas AS resena_estrellas, r.comentario AS resena_comentario
     FROM inscripciones i
     JOIN actividades a ON a.id = i.actividad_id
     LEFT JOIN resenas r ON r.usuario_id = i.usuario_id AND r.actividad_id = i.actividad_id
     WHERE i.usuario_id = ?
     ORDER BY i.creado_en DESC`,
    [req.user.id]
  );
  res.json({ usuario: req.user, inscripciones });
}));

router.post('/resenas', requireAuth, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const actividadId = Number(body.actividad_id);
  const estrellas = body.estrellas;
  if (!Number.isSafeInteger(actividadId) || actividadId < 1) {
    return res.status(400).json({ error: 'El ID de actividad no es válido.' });
  }
  if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
    return res.status(400).json({ error: 'La puntuación debe ser un entero entre 1 y 5.' });
  }
  if (body.comentario !== undefined && body.comentario !== null && typeof body.comentario !== 'string') {
    return res.status(400).json({ error: 'El comentario debe ser texto.' });
  }
  const comentario = typeof body.comentario === 'string' ? body.comentario.trim() : null;
  if (comentario && comentario.length > 500) {
    return res.status(400).json({ error: 'El comentario no puede superar los 500 caracteres.' });
  }

  const [inscripciones] = await pool.execute(
    'SELECT asistio FROM inscripciones WHERE usuario_id = ? AND actividad_id = ?',
    [req.user.id, actividadId]
  );
  if (!inscripciones.length || Number(inscripciones[0].asistio) !== 1) {
    return res.status(403).json({ error: 'Solo podés dejar una reseña si asististe a la actividad.' });
  }

  await pool.execute(
    `INSERT INTO resenas (usuario_id, actividad_id, estrellas, comentario)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE estrellas = VALUES(estrellas), comentario = VALUES(comentario)`,
    [req.user.id, actividadId, estrellas, comentario || null]
  );
  res.json({ resena: { actividad_id: actividadId, estrellas, comentario: comentario || null } });
}));

async function inscribir(req, res, actividadIdValor) {
  const actividadId = Number(actividadIdValor);
  if (!Number.isSafeInteger(actividadId) || actividadId < 1) {
    return res.status(400).json({ error: 'El ID de actividad no es válido.' });
  }
  const [activities] = await pool.execute('SELECT id, estado FROM actividades WHERE id = ?', [actividadId]);
  if (!activities.length) return res.status(404).json({ error: 'No existe la actividad.' });
  if (activities[0].estado !== 'aprobada') {
    return res.status(403).json({ error: 'Solo podés inscribirte a actividades aprobadas.' });
  }
  await pool.execute(
    'INSERT INTO inscripciones (usuario_id, actividad_id) VALUES (?, ?)',
    [req.user.id, actividadId]
  );
  res.status(201).json({ inscripto: true });
}

router.post('/actividades/:id/inscripcion', requireAuth, asyncHandler(async (req, res) => {
  await inscribir(req, res, req.params.id);
}));

router.post('/inscripciones', requireAuth, asyncHandler(async (req, res) => {
  await inscribir(req, res, req.body?.actividad_id);
}));

export default router;
