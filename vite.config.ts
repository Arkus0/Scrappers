import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Dos builds:
// · web (Vercel, `vite build --mode web`): multiarchivo con hash, las ilustraciones y el JS se cachean por separado.
// · archivo (por defecto): todo dentro de un único index.html jugable sin servidor; las ilustraciones opcionales
//   (src/assets/web, preparadas por scripts/preparar-ilustraciones.mjs) van como archivos aparte para que el HTML siga siendo ligero.
const ILUSTRACION = /[\\/]assets[\\/]web[\\/]/;

export default defineConfig(({ mode }) => {
  const web = mode === 'web';
  return {
    plugins: web ? [react()] : [react(), viteSingleFile({ useRecommendedBuildConfig: false })],
    base: web ? '/' : './',
    server: { proxy: { '/ws': { target: 'ws://localhost:8080', ws: true } } },
    worker: { format: 'es' },
    build: web
      ? {
        outDir: 'dist',
        assetsInlineLimit: (archivo: string) => (ILUSTRACION.test(archivo) ? false : undefined),
        chunkSizeWarningLimit: 2000,
      }
      : {
        outDir: 'dist',
        assetsDir: '',
        assetsInlineLimit: (archivo: string) => !ILUSTRACION.test(archivo),
        chunkSizeWarningLimit: 100000000,
        cssCodeSplit: false,
        rollupOptions: { output: { inlineDynamicImports: true, assetFileNames: 'ilustraciones/[name]-[hash][extname]' } },
      },
    test: { globals: true, environment: 'node', include: ['tests/**/*.test.ts'], testTimeout: 120000 },
  };
});
