const IMAGEN_RESPALDO = '/actividad-sin-imagen.svg';

export default function ImagenActividad({ src, alt, className = '' }) {
  const usarRespaldo = (event) => {
    if (event.currentTarget.dataset.respaldo) return;
    event.currentTarget.dataset.respaldo = 'true';
    event.currentTarget.src = IMAGEN_RESPALDO;
  };

  return (
    <img
      className={className}
      src={src || IMAGEN_RESPALDO}
      alt={alt}
      onError={usarRespaldo}
    />
  );
}
