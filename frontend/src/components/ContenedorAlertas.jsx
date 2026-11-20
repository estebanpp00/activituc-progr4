import { useNotificaciones } from '../store.js';

const iconos = {
  success: <path d="m5 12 4 4L19 6" />,
  danger: <path d="M12 8v4m0 4h.01M10.3 3.9 1.8 18.1A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0Z" />,
  warning: <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18.1A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0Z" />,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></>
};

export default function ContenedorAlertas() {
  const notificaciones = useNotificaciones((state) => state.notificaciones);
  const cerrar = useNotificaciones((state) => state.cerrar);

  return (
    <div className="toast-container-global" aria-live="polite" aria-atomic="false">
      {notificaciones.map((item) => (
        <article
          className={`toast-global toast-${item.tipo}${item.cerrando ? ' toast-saliendo' : ''}`}
          key={item.id}
          role={item.tipo === 'danger' ? 'alert' : 'status'}
        >
          <span className="toast-icono" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              {iconos[item.tipo] || iconos.info}
            </svg>
          </span>
          <div className="toast-contenido">
            {item.titulo && <strong>{item.titulo}</strong>}
            <p>{item.mensaje}</p>
          </div>
          <button type="button" className="toast-cerrar" aria-label="Cerrar notificación" onClick={() => cerrar(item.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round"><path d="m18 6-12 12M6 6l12 12" /></svg>
          </button>
          {!item.cerrando && <span className="toast-progreso" />}
        </article>
      ))}
    </div>
  );
}
