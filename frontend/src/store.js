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
