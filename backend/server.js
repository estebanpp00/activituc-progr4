import express from 'express';
import { pool } from './db.js';
import { requireAuth, requireAdmin } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import adminCrudRoutes from './routes/adminCrud.js';
import organizadorRoutes from './routes/organizador.js';

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (_req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, database: process.env.DB_NAME });
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api', publicRoutes);
app.use('/api/organizador', organizadorRoutes);
app.use('/api/admin', requireAuth, requireAdmin, adminCrudRoutes);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

app.use((error, _req, res, _next) => {
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Ya existe un registro con esos datos.' });
  }
  if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(409).json({ error: 'No se puede completar la operación por sus relaciones con otros registros.' });
  }
  if (error.status) return res.status(error.status).json({ error: error.message });
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'El cuerpo JSON no es válido.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'La solicitud supera el tamaño permitido.' });
  console.error(error);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`API lista en http://localhost:${port}`));
