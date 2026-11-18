import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { api } from '../api.js';
import { recursos } from '../crudConfig.js';

export default function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [metricas, setMetricas] = useState(null);
  const [error, setError] = useState('');
  const [errorMetricas, setErrorMetricas] = useState('');

  useEffect(() => {
    api('/admin/resumen').then(setResumen).catch((e) => setError(e.message));
    api('/admin/metricas').then(setMetricas).catch((e) => setErrorMetricas(e.message));
  }, []);

  return (
    <section>
      <div className="no-print">
        <h1>Panel de administración</h1>
        <p>Administrá los registros de las cinco tablas de la base de datos.</p>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="row g-3 no-print">
        {Object.entries(recursos).map(([recurso, config]) => (
          <div className="col-sm-6 col-lg-4" key={recurso}>
            <Link className="card admin-resource-card text-decoration-none h-100" to={`/admin/${recurso}`}>
              <div className="card-body">
                <h2 className="h5">{config.nombre}</h2>
                {resumen && <p className="display-6 mb-0">{resumen[recurso]}</p>}
                <span>Ver y administrar →</span>
              </div>
            </Link>
          </div>
        ))}
      </div>
      <div className="d-flex justify-content-end mt-4 no-print">
        <button className="btn btn-primary" onClick={() => window.print()}>
          Imprimir reporte en PDF
        </button>
      </div>
      {errorMetricas && <div className="alert alert-danger mt-3">{errorMetricas}</div>}
      <section id="reporte-metricas" className="mt-4">
        <h2>Métricas generales</h2>
        {metricas ? (
          <>
            <div className="row g-3 mb-4">
              {[
                ['Usuarios', metricas.totales.usuarios],
                ['Actividades', metricas.totales.actividades],
                ['Inscripciones', metricas.totales.inscripciones],
                ['Reseñas', metricas.totales.resenas]
              ].map(([label, total]) => (
                <div className="col-6 col-lg-3" key={label}>
                  <div className="card metricas-card h-100">
                    <div className="card-body">
                      <h3 className="h6">{label}</h3>
                      <p className="display-6 mb-0">{total}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="card metricas-card">
              <div className="card-body">
                <h3 className="h5">Actividades e inscripciones por etiqueta</h3>
                <div
                  className="metricas-chart"
                  style={{ width: '100%', height: 340, minWidth: 0 }}
                >
                  <BarChart
                    data={metricas.categorias}
                    width={680}
                    height={320}
                    margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="etiqueta" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="actividades" name="Actividades" fill="#6f42c1" />
                    <Bar dataKey="inscripciones" name="Inscripciones" fill="#fd7e14" />
                  </BarChart>
                </div>
              </div>
            </div>
          </>
        ) : !errorMetricas ? (
          <p>Cargando métricas...</p>
        ) : null}
      </section>
    </section>
  );
}
