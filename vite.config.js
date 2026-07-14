import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// El proxy manda /api al backend Express (server/index.js) tanto en dev como
// en `vite preview`, así apiUrl() funciona sin CORS ni configuración extra.
const apiProxy = { '/api': 'http://localhost:3001' };

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/AUTOCELLS/' : '/',
  plugins: [react(), tailwindcss()],
  server: { proxy: apiProxy },
  preview: { proxy: { '/AUTOCELLS/api': 'http://localhost:3001' } },
}));
