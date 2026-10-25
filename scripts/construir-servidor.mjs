// Empaqueta el servidor online (servidor/index.ts y el motor compartido) en un único archivo para Node.
import { build } from 'esbuild';

await build({
  entryPoints: ['servidor/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'dist-servidor/servidor.mjs',
  external: ['bufferutil', 'utf-8-validate'],
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  logLevel: 'info',
});
