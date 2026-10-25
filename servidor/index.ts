// Servidor de 176 TCG: sirve el cliente (dist/), el modo online por WebSocket en /ws y /salud para Railway.
import { createServer, type Server } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { PLAZOS_POR_DEFECTO, Salas, type Plazos } from './salas';

const TIPOS: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon',
};

export interface OpcionesServidor {
  puerto?: number;
  plazos?: Partial<Plazos>;
  /** carpeta del cliente compilado */
  raiz?: string;
}

export interface ServidorEnMarcha {
  url: string;
  puerto: number;
  salas: Salas;
  cerrar: () => Promise<void>;
}

export function crearServidor(op: OpcionesServidor = {}): Promise<ServidorEnMarcha> {
  const raiz = resolve(op.raiz ?? join(process.cwd(), 'dist'));
  const salas = new Salas({ ...PLAZOS_POR_DEFECTO, ...op.plazos });
  const http: Server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname === '/salud') {
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(JSON.stringify({ ok: true, salas: salas.numSalas, enCola: salas.enCola }));
      return;
    }
    let ruta = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    if (!ruta || ruta.endsWith('/')) ruta += 'index.html';
    const archivo = join(raiz, ruta);
    if (!archivo.startsWith(raiz) || !existsSync(archivo) || !statSync(archivo).isFile()) {
      const indice = join(raiz, 'index.html');
      if (existsSync(indice)) {
        res.writeHead(200, { 'content-type': TIPOS['.html'] });
        res.end(readFileSync(indice));
      } else {
        res.writeHead(404);
        res.end('No encontrado (¿has compilado el cliente con npm run build?)');
      }
      return;
    }
    const cache = ruta === 'index.html' ? 'no-cache' : 'public, max-age=604800, immutable';
    res.writeHead(200, { 'content-type': TIPOS[extname(archivo)] ?? 'application/octet-stream', 'cache-control': cache });
    res.end(readFileSync(archivo));
  });
  const wss = new WebSocketServer({ server: http, path: '/ws', maxPayload: 8 * 1024 });
  wss.on('connection', (ws) => salas.conectar(ws));
  // latido para cerrar conexiones muertas
  const vivos = new WeakSet<object>();
  wss.on('connection', (ws) => { vivos.add(ws); ws.on('pong', () => vivos.add(ws)); });
  const latido = setInterval(() => {
    for (const ws of wss.clients) {
      if (!vivos.has(ws)) { ws.terminate(); continue; }
      vivos.delete(ws);
      ws.ping();
    }
  }, 30_000);
  latido.unref();
  return new Promise((ok) => {
    http.listen(op.puerto ?? 8080, () => {
      const dir = http.address();
      const puerto = typeof dir === 'object' && dir ? dir.port : op.puerto ?? 8080;
      ok({
        url: `http://localhost:${puerto}`,
        puerto,
        salas,
        cerrar: () => new Promise<void>((fin) => {
          clearInterval(latido);
          salas.cerrar();
          for (const ws of wss.clients) ws.terminate();
          wss.close();
          http.close(() => fin());
        }),
      });
    });
  });
}

// arranque directo: node dist-servidor/servidor.mjs (o tsx servidor/index.ts)
const directo = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (directo || process.env.ARRANCAR_SERVIDOR) {
  crearServidor({ puerto: Number(process.env.PORT ?? 8080) }).then((s) => console.log(`176 TCG escuchando en ${s.url} (online en /ws)`));
}
