import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Las ilustraciones opcionales (src/assets/web, preparadas por scripts/preparar-ilustraciones.mjs) van como archivos aparte
// para que el HTML siga siendo ligero; todo lo demás (JS, CSS, el trabajador de la IA) va dentro de un único index.html.
const ILUSTRACION = /[\\/]assets[\\/]web[\\/]/;

export default defineConfig({
  plugins: [react(), viteSingleFile({ useRecommendedBuildConfig: false })],
  base: './',
  server: { proxy: { '/ws': { target: 'ws://localhost:8080', ws: true } } },
  worker: { format: 'es' },
  build: {
    outDir: 'dist',
    assetsDir: '',
    assetsInlineLimit: (archivo: string) => !ILUSTRACION.test(archivo),
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: { output: { inlineDynamicImports: true, assetFileNames: 'ilustraciones/[name]-[hash][extname]' } },
  },
  test: { globals: true, environment: 'node', include: ['tests/**/*.test.ts'], testTimeout: 120000 },
});
