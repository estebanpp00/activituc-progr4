import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { api } from '../api.js';
import { recursos } from '../crudConfig.js';

const coloresEstado = {
  aprobada: '#15803d',
  pendiente: '#eab308',
  rechazada: '#f43f5e'
};

const iconosKpi = {
  usuarios: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5.2a3 3 0 0 1 0 5.6M18 14a5 5 0 0 1 3 4.6V20" /></>,
  actividades: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  inscripciones: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></>,
  resenas: <><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" /></>
};

const nombresEstado = {
  aprobada: 'Aprobadas',
  pendiente: 'Pendientes',
  rechazada: 'Rechazadas'
};

function graficoNumerico(filas, campo) {
  return filas.map((fila) => ({ ...fila, [campo]: Number(fila[campo]) || 0 }));
}

export default function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [metricas, setMetricas] = useState(null);
  const [error, setError] = useState('');
  const [errorMetricas, setErrorMetricas] = useState('');

  useEffect(() => {
    api('/admin/resumen').then(setResumen).catch((e) => setError(e.message));
    api('/admin/metricas').then(setMetricas).catch((e) => setErrorMetricas(e.message));
  }, []);

  const estados = ['aprobada', 'pendiente', 'rechazada'].map((estado) => ({
    estado,
    nombre: nombresEstado[estado],
    cantidad: Number(metricas?.estadosActividades?.find((item) => item.estado === estado)?.cantidad) || 0
  }));
  const calificaciones = [1, 2, 3, 4, 5].map((estrellas) => ({
    estrellas: `${estrellas} ${estrellas === 1 ? 'estrella' : 'estrellas'}`,
    cantidad: Number(metricas?.calificaciones?.find((item) => Number(item.estrellas) === estrellas)?.cantidad) || 0
  }));
  const confirmadas = Number(metricas?.asistencias?.confirmadas) || 0;
  const pendientesAsistencia = Number(metricas?.asistencias?.pendientes) || 0;
  const totalAsistencia = confirmadas + pendientesAsistencia;
  const tasaAsistencia = totalAsistencia ? Math.round((confirmadas / totalAsistencia) * 100) : 0;
  const reseñasAsistencia = calificaciones.map((item) => ({ ...item, asistencia: tasaAsistencia }));
  const topActividades = graficoNumerico(metricas?.topActividades || [], 'inscriptos');

  return (
    <section>
      <header className="dashboard-heading no-print">
        <div>
          <span className="dashboard-eyebrow">CENTRO DE CONTROL</span>
          <h1>Panel de administración</h1>
          <p>Un resumen claro de la actividad de ActiviTuc.</p>
        </div>
      </header>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="row g-3 no-print">
        {Object.entries(recursos).map(([recurso, config]) => (
          <div className="col-sm-6 col-lg-4" key={recurso}>
            <Link className="card admin-resource-card text-decoration-none h-100" to={`/admin/${recurso}`}>
              <div className="card-body d-flex align-items-center gap-3">
                <span className="resource-icon" aria-hidden="true">{config.nombre.slice(0, 1)}</span>
                <div>
                  <h2 className="h5 mb-1">{config.nombre}</h2>
                  {resumen && <span className="resource-count">{resumen[recurso]} registros</span>}
                </div>
                <span className="resource-arrow ms-auto" aria-hidden="true">→</span>
              </div>
            </Link>
          </div>
        ))}
      </div>
      <div className="d-flex justify-content-end mt-4 no-print">
        <button className="btn btn-primary" onClick={() => window.print()}>Imprimir reporte en PDF</button>
      </div>
      {errorMetricas && <div className="alert alert-danger mt-3">{errorMetricas}</div>}
      <section id="reporte-metricas" className="mt-4">
        <div className="dashboard-heading">
          <div>
            <span className="dashboard-eyebrow">DATOS EN TIEMPO REAL</span>
            <h2>Métricas generales</h2>
          </div>
        </div>
        {metricas ? (
          <>
            <div className="row g-3 mb-4">
              {[
                ['usuarios', 'Usuarios', metricas.totales.usuarios, 'Comunidad'],
                ['actividades', 'Actividades', metricas.totales.actividades, 'Propuestas'],
                ['inscripciones', 'Inscripciones', metricas.totales.inscripciones, 'Participaciones'],
                ['resenas', 'Reseñas', metricas.totales.resenas, 'Opiniones']
              ].map(([icono, label, total, badge]) => (
                <div className="col-6 col-lg-3" key={label}>
                  <div className={`card metricas-card metricas-kpi kpi-${icono} h-100`}>
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start">
                        <span className="kpi-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                            strokeLinecap="round" strokeLinejoin="round">{iconosKpi[icono]}</svg>
                        </span>
                        <span className="badge rounded-pill">{badge}</span>
                      </div>
                      <p className="kpi-total mb-1">{Number(total) || 0}</p>
                      <h3 className="h6 mb-0">{label}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="row g-4">
              <div className="col-12">
                <ChartCard titulo="Actividades e inscripciones por etiqueta">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={metricas.categorias} margin={{ top: 12, right: 12, left: -16, bottom: 8 }}>
                      <CartesianGrid stroke="#e8e2d7" strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="etiqueta" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="actividades" name="Actividades" fill="#1e437a" radius={[6, 6, 0, 0]} isAnimationActive />
                      <Bar dataKey="inscripciones" name="Inscripciones" fill="#15803d" radius={[6, 6, 0, 0]} isAnimationActive />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
              <div className="col-12 col-xl-5">
                <ChartCard titulo="Distribución de actividades por estado">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={estados} dataKey="cantidad" nameKey="nombre" cx="50%" cy="48%"
                        innerRadius={68} outerRadius={105} paddingAngle={4} isAnimationActive>
                        {estados.map((item) => <Cell key={item.estado} fill={coloresEstado[item.estado]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={32} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
              <div className="col-12 col-xl-7">
                <ChartCard titulo="Top 5 actividades con más inscriptos">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topActividades} layout="vertical" margin={{ top: 8, right: 18, left: 12, bottom: 8 }}>
                      <CartesianGrid stroke="#e8e2d7" strokeDasharray="4 4" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="nombre" width={142} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="inscriptos" name="Inscriptos" fill="#1e437a" radius={[0, 6, 6, 0]} isAnimationActive />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
              <div className="col-12">
                <ChartCard titulo="Calificaciones y tasa de asistencia confirmada">
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={reseñasAsistencia} margin={{ top: 12, right: 12, left: -16, bottom: 8 }}>
                      <CartesianGrid stroke="#e8e2d7" strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="estrellas" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="reseñas" allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="asistencia" orientation="right" domain={[0, 100]} unit="%" hide />
                      <Tooltip />
                      <Legend />
                      <Area yAxisId="reseñas" dataKey="cantidad" name="Reseñas" type="monotone" stroke="#eab308"
                        fill="#f5b700" fillOpacity={0.25} isAnimationActive />
                      <Line yAxisId="asistencia" dataKey="asistencia" name={`Asistencia confirmada (${tasaAsistencia}%)`}
                        type="monotone" stroke="#15803d" strokeWidth={3} dot={{ r: 4 }} isAnimationActive />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div className="attendance-summary">
                    <span><i className="attendance-dot confirmed" />{confirmadas} asistencias confirmadas</span>
                    <span><i className="attendance-dot pending" />{pendientesAsistencia} pendientes</span>
                    <strong>{tasaAsistencia}% de asistencia</strong>
                  </div>
                </ChartCard>
              </div>
            </div>
          </>
        ) : !errorMetricas ? <p>Cargando métricas...</p> : null}
      </section>
    </section>
  );
}

function ChartCard({ titulo, children }) {
  return (
    <article className="card metricas-card chart-card h-100">
      <div className="card-body">
        <h3 className="h5 mb-3">{titulo}</h3>
        {children}
      </div>
    </article>
  );
}
