// Servidor provisional (el modo online llega en el hito 4): sirve el cliente y /salud.
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const PUERTO = Number(process.env.PORT ?? 8080);
const RAIZ = join(process.cwd(), 'dist');
createServer((req, res) => {
  if (req.url === '/salud') { res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"ok":true}'); return; }
  const f = join(RAIZ, 'index.html');
  if (!existsSync(f)) { res.writeHead(503); res.end('Compila primero el cliente'); return; }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(readFileSync(f));
}).listen(PUERTO, () => console.log(`176 TCG en http://localhost:${PUERTO}`));
