import { useEffect, useState } from 'react';
import { api } from '../api.js';
import ImagenActividad from '../components/ImagenActividad.jsx';
import { useNotificaciones, useSesion } from '../store.js';

export default function Inicio() {
  const usuario = useSesion((state) => state.usuario);
  const notificar = useNotificaciones((state) => state.notificar);
  const [actividades, setActividades] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
  const [etiqueta, setEtiqueta] = useState('');
  const [etiquetaCargada, setEtiquetaCargada] = useState(null);
  const [inscripciones, setInscripciones] = useState(() => new Set());
  const [inscripcionesUsuarioCargadas, setInscripcionesUsuarioCargadas] = useState(null);
  const [error, setError] = useState('');
  const cargando = etiquetaCargada !== etiqueta;
  const usuarioId = usuario?.id;
  const usuarioRol = usuario?.rol;
  const cargandoInscripciones = Boolean(usuarioId) && inscripcionesUsuarioCargadas !== usuarioId;

  useEffect(() => {
    api('/etiquetas').then(setEtiquetas).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    let vigente = true;
    api(`/actividades${etiqueta ? `?etiqueta=${encodeURIComponent(etiqueta)}` : ''}`)
      .then((items) => {
        if (!vigente) return;
        setActividades(items);
        setError('');
      })
      .catch((e) => {
        if (vigente) setError(e.message);
      })
      .finally(() => {
        if (vigente) setEtiquetaCargada(etiqueta);
      });
    return () => { vigente = false; };
  }, [etiqueta]);

  useEffect(() => {
    let vigente = true;
    if (!usuarioId) {
      return () => { vigente = false; };
    }

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
        if (vigente) setInscripcionesUsuarioCargadas(usuarioId);
      });

    return () => { vigente = false; };
  }, [usuarioId, usuarioRol]);

  const inscribirse = async (actividadId) => {
    setError('');
    try {
      await api(`/actividades/${actividadId}/inscripcion`, { method: 'POST' });
      setInscripciones((actuales) => new Set(actuales).add(Number(actividadId)));
      notificar({ tipo: 'success', titulo: '¡Inscripción confirmada!', mensaje: 'Podés verla en Mi cuenta.' });
    } catch (e) {
      setError(e.message);
      notificar({ tipo: 'danger', titulo: 'No se pudo completar la inscripción', mensaje: e.message });
    }
  };

  return (
    <section>
      <header className="catalog-hero mb-4">
        <div>
          <span className="hero-eyebrow">SAN MIGUEL DE TUCUMÁN</span>
          <h1>Encontrá actividades para disfrutar</h1>
          <p>Descubrí actividades deportivas, culturales y recreativas en el Jardín de la República.</p>
        </div>
        <label className="catalog-filter">
          <span>Filtrar por categoría</span>
          <select className="form-select activity-filter" value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)}>
          <option value="">Todas las etiquetas</option>
          {etiquetas.map((item) => <option key={item.id} value={item.nombre}>{item.nombre}</option>)}
          </select>
        </label>
      </header>
      {error && <div className="alert alert-danger">{error}</div>}
      {cargando ? <p>Cargando...</p> : (
        <div className="row g-3">
          {actividades.map((actividad) => (
            <article className="col-md-6 col-lg-4" key={actividad.id}>
              <div className="card actividad-card h-100">
                <div className="actividad-imagen-contenedor">
                  <ImagenActividad
                    className="card-img-top actividad-imagen-card"
                    src={actividad.imagen_url || actividad.imagen}
                    alt={`Imagen de ${actividad.nombre}`}
                  />
                  <span className="actividad-etiqueta">{actividad.etiqueta}</span>
                </div>
                <div className="card-body">
                  <h2 className="h5">{actividad.nombre}</h2>
                  <p>{actividad.descripcion}</p>
                  <p className="actividad-horario mb-3">{actividad.horario}</p>
                  <div className="actividad-precios-catalogo">
                    <span><small>Mensual</small><strong>${Number(actividad.precio_mensual).toLocaleString('es-AR')}</strong></span>
                    <span><small>Semanal</small><strong>${Number(actividad.precio_semanal).toLocaleString('es-AR')}</strong></span>
                  </div>
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
