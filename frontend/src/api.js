import { useSesion } from './store.js';

export async function api(ruta, { method = 'GET', body } = {}) {
  const token = useSesion.getState().token;
  const response = await fetch(`/api${ruta}`, {
    method,
    headers: {
      ...(body && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && token) useSesion.getState().salir();
    throw new Error(data.error || 'No se pudo completar la solicitud.');
  }
  return data;
}
