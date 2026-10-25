// Partidas IA contra IA para medir el equilibrio de los mazos.
// Uso: npm run simular -- [--n 100] [--nivel normal] [--mazos rojo,azul] [--contra azar]
import { MAZOS_INICIALES } from '../src/datos/mazos-iniciales';
import { MAZOS_TEMATICOS } from '../src/datos/mazos-tematicos';
import { decidirIA, type Nivel } from '../src/ia/bot';
import { respuestaAzar } from '../src/ia/azar';
import type { DefMazo } from '../src/motor/mazo';
import { crearPartida, responder } from '../src/motor/motor';
import { vistaPara } from '../src/motor/vista';
import type { Jug } from '../src/motor/tipos';

const arg = (k: string, def: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? process.argv[i + 1] : def;
};
const N = Number(arg('n', '40'));
const nivel = arg('nivel', 'normal') as Nivel;
const contra = arg('contra', '');
const todos: Record<string, DefMazo> = Object.fromEntries([...MAZOS_INICIALES, ...MAZOS_TEMATICOS].map((m) => [m.id, m]));
const ids = arg('mazos', MAZOS_INICIALES.map((m) => m.id).join(',')).split(',');

export function jugar(a: DefMazo, b: DefMazo, semilla: number, niveles: [Nivel | 'azar', Nivel | 'azar']) {
  const e = crearPartida(semilla, [{ nombre: 'A', cartas: a.cartas, tipos: a.tipos }, { nombre: 'B', cartas: b.cartas, tipos: b.tipos }]);
  const rng = { rng: semilla * 31 + 7 };
  let pasos = 0;
  while (!e.ganador && pasos++ < 4000) {
    const j = e.pendiente!.jugador as Jug;
    const nv = niveles[j];
    const r = nv === 'azar' ? respuestaAzar(e.pendiente!, rng) : decidirIA(vistaPara(e, j), nv, semilla * 1000 + pasos);
    responder(e, r);
  }
  return e;
}

const t0 = Date.now();
const res: string[] = [];
const total: Record<string, [number, number]> = {};
const sumar = (m: string, g: boolean) => { const t = (total[m] ??= [0, 0]); t[1]++; if (g) t[0]++; };
let primero = 0, totales = 0, turnos = 0;
const motivos: Record<string, number> = {};
for (const ia of ids) {
  for (const ib of ids) {
    if (ia >= ib && !contra) continue;
    if (contra && ia !== ib) continue;
    let ga = 0, gb = 0, emp = 0;
    for (let s = 1; s <= N; s++) {
      // se alternan los asientos para que la ventaja de empezar no sesgue el resultado
      const cambia = s % 2 === 0;
      const [A, B] = cambia ? [todos[ib], todos[ia]] : [todos[ia], todos[ib]];
      const niveles: [Nivel | 'azar', Nivel | 'azar'] = contra ? (cambia ? [contra as Nivel, nivel] : [nivel, contra as Nivel]) : [nivel, nivel];
      const e = jugar(A, B, s * 7919 + ia.length * 13 + ib.length, niveles);
      totales++;
      turnos += e.turno;
      const m = e.ganador?.motivo.split(':')[0].replace(/^[AB] /, '') ?? 'sin terminar';
      motivos[m] = (motivos[m] ?? 0) + 1;
      if (!e.ganador || e.ganador.jug === null) { emp++; continue; }
      if (e.ganador.jug === e.primero) primero++;
      const ganaA = (e.ganador.jug === 0) !== cambia;
      if (ganaA) ga++; else gb++;
      sumar(ia, ganaA);
      sumar(ib, !ganaA);
    }
    res.push(`${(contra ? `${ia}(${nivel}) vs ${ia}(${contra})` : `${ia} vs ${ib}`).padEnd(34)} ${String(ga).padStart(4)} - ${String(gb).padEnd(4)} (${((100 * ga) / Math.max(1, ga + gb)).toFixed(0)} %)  empates ${emp}`);
  }
}
console.log(res.join('\n'));
if (Object.keys(total).length > 2) {
  console.log('\nVictorias por mazo:');
  for (const [m, [g, t]] of Object.entries(total).sort((a, b) => b[1][0] / b[1][1] - a[1][0] / a[1][1])) console.log(`  ${m.padEnd(16)} ${((100 * g) / t).toFixed(0).padStart(3)} %  (${g}/${t})`);
}
console.log(`\nGana quien empieza: ${((100 * primero) / totales).toFixed(0)} % · turnos medios ${(turnos / totales).toFixed(1)} · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
console.log(motivos);
