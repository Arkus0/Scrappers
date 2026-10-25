// Prueba rápida: partidas al azar entre los mazos iniciales.
import { MAZOS_INICIALES } from '../src/datos/mazos-iniciales';
import { crearPartida, responder } from '../src/motor/motor';
import { respuestaAzar } from '../src/ia/azar';

const n = Number(process.argv[2] ?? 50);
let fin = 0;
const motivos: Record<string, number> = {};
let turnos = 0;
for (let s = 1; s <= n; s++) {
  const a = MAZOS_INICIALES[s % 4], b = MAZOS_INICIALES[(s + 1) % 4];
  const e = crearPartida(s, [{ nombre: 'A', cartas: a.cartas, tipos: a.tipos }, { nombre: 'B', cartas: b.cartas, tipos: b.tipos }]);
  const rng = { rng: s * 7 };
  let pasos = 0;
  while (!e.ganador && pasos++ < 5000) responder(e, respuestaAzar(e.pendiente!, rng));
  if (e.ganador) { fin++; motivos[e.ganador.motivo.split(':')[0]] = (motivos[e.ganador.motivo.split(':')[0]] ?? 0) + 1; turnos += e.turno; }
}
console.log({ fin, n, turnosMedios: turnos / fin, motivos });
