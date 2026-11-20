import { useEffect } from 'react';

export default function ModalConfirmacion({
  abierto,
  titulo = 'Confirmar acción',
  mensaje,
  textoConfirmar = 'Confirmar',
  cargando = false,
  onConfirmar,
  onCancelar
}) {
  useEffect(() => {
    if (!abierto) return undefined;
    const manejarTecla = (event) => {
      if (event.key === 'Escape' && !cargando) onCancelar();
    };
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [abierto, cargando, onCancelar]);

  if (!abierto) return null;

  return (
    <div className="confirmacion-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !cargando) onCancelar();
    }}>
      <section className="confirmacion-modal" role="dialog" aria-modal="true" aria-labelledby="confirmacion-titulo">
        <div className="confirmacion-icono" aria-hidden="true">!</div>
        <h2 id="confirmacion-titulo">{titulo}</h2>
        <p>{mensaje}</p>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" disabled={cargando} onClick={onCancelar}>
            Cancelar
          </button>
          <button type="button" className="btn btn-danger" disabled={cargando} onClick={onConfirmar}>
            {cargando ? 'Procesando...' : textoConfirmar}
          </button>
        </div>
      </section>
    </div>
  );
}
