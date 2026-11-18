import { useEffect, useState } from 'react';
import { api } from '../api.js';
import ImagenActividad from '../components/ImagenActividad.jsx';
import { useSesion } from '../store.js';

export default function Inicio() {
  const usuario = useSesion((state) => state.usuario);
  const [actividades, setActividades] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
  const [etiqueta, setEtiqueta] = useState('');
  const [cargando, setCargando] = useState(true);
  const [inscripciones, setInscripciones] = useState(() => new Set());
  const [cargandoInscripciones, setCargandoInscripciones] = useState(Boolean(usuario));
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    api('/etiquetas').then(setEtiquetas).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setCargando(true);
    api(`/actividades${etiqueta ? `?etiqueta=${encodeURIComponent(etiqueta)}` : ''}`)
      .then(setActividades)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [etiqueta]);

  useEffect(() => {
    let vigente = true;
    if (!usuario) {
      setInscripciones(new Set());
      setCargandoInscripciones(false);
      return () => { vigente = false; };
    }

    setCargandoInscripciones(true);
    api('/mi-cuenta')
      .then((cuenta) => {
        if (vigente) {
          setInscripciones(new Set(cuenta.inscripciones.map((item) => Number(item.actividad_id))));
        }
      })
      .catch((e) => {
        if (vigente) setError(e.message);
      })
      .finally(() => {
        if (vigente) setCargandoInscripciones(false);
      });

    return () => { vigente = false; };
  }, [usuario?.id, usuario?.rol]);

  const inscribirse = async (actividadId) => {
    setError('');
    setMensaje('');
    try {
      await api(`/actividades/${actividadId}/inscripcion`, { method: 'POST' });
      setInscripciones((actuales) => new Set(actuales).add(Number(actividadId)));
      setMensaje('Inscripción realizada. Podés verla en Mi cuenta.');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <section>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1>Actividades</h1>
          <p>Explorá las actividades disponibles.</p>
        </div>
        <select className="form-select w-auto activity-filter" value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)}>
          <option value="">Todas las etiquetas</option>
          {etiquetas.map((item) => <option key={item.id} value={item.nombre}>{item.nombre}</option>)}
        </select>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {mensaje && <div className="alert alert-success">{mensaje}</div>}
      {cargando ? <p>Cargando...</p> : (
        <div className="row g-3">
          {actividades.map((actividad) => (
            <article className="col-md-6 col-lg-4" key={actividad.id}>
              <div className="card actividad-card h-100">
                <ImagenActividad
                  className="card-img-top actividad-imagen-card"
                  src={actividad.imagen_url || actividad.imagen}
                  alt={`Imagen de ${actividad.nombre}`}
                />
                <div className="card-body">
                  <h2 className="h5">{actividad.nombre}</h2>
                  <p>{actividad.descripcion}</p>
                  <p className="mb-1">{actividad.etiqueta} · {actividad.horario}</p>
                  <small>
                    Mensual: ${actividad.precio_mensual.toLocaleString('es-AR')} ·
                    Semanal: ${actividad.precio_semanal.toLocaleString('es-AR')}
                  </small>
                  {usuario && (
                    <div className="mt-3">
                      {inscripciones.has(Number(actividad.id)) ? (
                        <span className="badge rounded-pill bg-success-subtle text-success-emphasis">
                          Ya estás inscripto a esta actividad
                        </span>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={cargandoInscripciones}
                          onClick={() => inscribirse(actividad.id)}
                        >
                          {cargandoInscripciones ? 'Verificando inscripción...' : 'Inscribirme'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
          {!error && actividades.length === 0 && <p>No hay actividades para mostrar.</p>}
        </div>
      )}
    </section>
  );
}
