import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from './api.js';

export const useSesion = create(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      entrar: async (ruta, datos) => {
        const respuesta = await api(ruta, { method: 'POST', body: datos });
        set({ token: respuesta.token, usuario: respuesta.usuario });
      },
      refrescar: async () => {
        set({ usuario: await api('/auth/me') });
      },
      salir: () => set({ token: null, usuario: null })
    }),
    {
      name: 'activituc-sesion',
      partialize: ({ token, usuario }) => ({ token, usuario })
    }
  )
);

let siguienteNotificacion = 0;
const temporizadores = new Map();

export const useNotificaciones = create((set, get) => ({
  notificaciones: [],
  notificar: ({ tipo = 'info', titulo, mensaje }) => {
    const id = ++siguienteNotificacion;
    set((state) => ({
      notificaciones: [...state.notificaciones, { id, tipo, titulo, mensaje, cerrando: false }]
    }));
    temporizadores.set(id, setTimeout(() => get().cerrar(id), 3500));
    return id;
  },
  cerrar: (id) => {
    const notificacion = get().notificaciones.find((item) => item.id === id);
    if (!notificacion || notificacion.cerrando) return;
    if (temporizadores.has(id)) {
      clearTimeout(temporizadores.get(id));
      temporizadores.delete(id);
    }
    set((state) => ({
      notificaciones: state.notificaciones.map((item) => (
        item.id === id ? { ...item, cerrando: true } : item
      ))
    }));
    setTimeout(() => {
      set((state) => ({
        notificaciones: state.notificaciones.filter((item) => item.id !== id)
      }));
    }, 260);
  }
}));
