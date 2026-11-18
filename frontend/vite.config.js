import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Las llamadas a /api se redirigen al backend (ajustar el puerto si hace falta)
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3000' } }
});
