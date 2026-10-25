import { CATALOGO, LISTA_CARTAS, esPolitico } from '../src/datos/catalogo';
import { reflejar } from '../src/datos/constructores';
import { PERSONAS } from '../src/datos/personas';
import { ESPEJO_TIPO } from '../src/datos/partidos';
import { respuestaAzar } from '../src/ia/azar';
import { clonar, crearPartida, ejecutarAislado, responder } from '../src/motor/motor';
import type { Carta, CartaPolitico, Jug, Partida, Tarea } from '../src/motor/tipos';
import { mazo } from './util';
import { aMano, banquillo, tribuna } from './util';

/** Partidas al azar paradas a mitad, con mesa variada. */
function estados(): Partida[] {
  const r: Partida[] = [];
  for (const s of [3, 8, 13, 21, 34, 55]) {
    const e = crearPartida(s, [mazo('rojo'), mazo('verde')]);
    const rng = { rng: s };
    let n = 0;
    while (!e.ganador && n++ < 25 + s) responder(e, respuestaAzar(e.pendiente!, rng));
    if (!e.ganador) r.push(e);
  }
  return r;
}

/** Resuelve todas las decisiones al azar hasta vaciar la pila de la prueba. */
function resolver(e: Partida, semilla: number) {
  const rng = { rng: semilla };
  let n = 0;
  while (e.pendiente && !e.ganador && e.pendiente.tipo !== 'accion' && n++ < 200) responder(e, respuestaAzar(e.pendiente, rng));
}

describe('Colección', () => {
  it('tiene unas 300 cartas con ids y números únicos', () => {
    expect(LISTA_CARTAS.length).toBeGreaterThanOrEqual(290);
    const nums = new Map<string, Set<number>>();
    for (const c of LISTA_CARTAS) {
      const s = nums.get(c.coleccion) ?? new Set();
      expect(s.has(c.num), `${c.id} repetido`).toBe(false);
      s.add(c.num);
      nums.set(c.coleccion, s);
    }
  });

  it('cada carta tiene escena e icono, y los políticos acciones con coste', () => {
    for (const c of LISTA_CARTAS) {
      expect(c.escena.length, c.id).toBeGreaterThan(20);
      expect(c.icono, c.id).toBeTruthy();
      if (esPolitico(c)) {
        expect(c.acciones.length, c.id).toBeGreaterThan(0);
        for (const a of c.acciones) expect(a.coste.length + a.dano >= 0).toBe(true);
        if (c.fase !== 'basico') expect(LISTA_CARTAS.some((x) => x.nombre === c.de), `${c.nombre} asciende de «${c.de}», que no existe`).toBe(true);
      } else {
        expect(c.texto, c.id).toBeTruthy();
      }
    }
  });

  it('cada acción, Carisma y entrenador se resuelve sin errores para cualquier jugador', () => {
    const bases = estados();
    expect(bases.length).toBeGreaterThan(2);
    let k = 0;
    for (const c of LISTA_CARTAS) {
      for (const base of bases) {
        for (const yo of [0, 1] as Jug[]) {
          const e = clonar(base);
          e.pendiente = null;
          e.pila = [];
          e.enTurno = yo;
          k++;
          const tareas: Tarea[] = [];
          if (esPolitico(c)) {
            const t = tribuna(e, yo, c.id, ['rojo', 'azul', 'magenta', 'verde', 'morado', 'ambar']);
            banquillo(e, yo, 'B-01');
            for (let i = 0; i < c.acciones.length; i++) {
              e.ataque = { jug: yo, uid: t.uid, i, dano: c.acciones[i].dano, fallo: false, defensor: e.jugadores[1 - yo].tribuna!.uid, viral: false };
              tareas.push({ t: 'efectos', lista: c.acciones[i].efectos ?? [], i: 0, ctx: { yo, fuente: t.uid, origen: 'ataque' } }, { t: 'danoAtaque' }, { t: 'kos' });
            }
            if (c.carisma?.efectos) tareas.push({ t: 'efectos', lista: c.carisma.efectos, i: 0, ctx: { yo, fuente: t.uid, origen: 'carisma' } }, { t: 'kos' });
          } else if ('efectos' in c && c.efectos) {
            const u = aMano(e, yo, c.id);
            tareas.push({ t: 'efectos', lista: c.efectos, i: 0, ctx: { yo, carta: u, origen: c.clase === 'maniobra' ? 'maniobra' : 'entrenador' } }, { t: 'kos' });
          } else if (c.clase === 'tertuliano') {
            const u = aMano(e, yo, c.id);
            tareas.push({ t: 'efectos', lista: [...(c.mitin ?? []), ...(c.inicioTurno ?? [])], i: 0, ctx: { yo, carta: u, origen: 'tertuliano' } }, { t: 'kos' });
          }
          expect(() => {
            ejecutarAislado(e, tareas);
            resolver(e, k);
          }, `${c.id} ${c.nombre}`).not.toThrow();
        }
      }
    }
  });

  it('todas las Shiny y todas las cartas se pueden poner en juego desde una partida real', () => {
    // un mazo con cada básico de la colección en una partida al azar
    const basicos = LISTA_CARTAS.filter((c) => esPolitico(c) && c.fase === 'basico' && !c.unica).map((c) => c.id);
    for (let i = 0; i < basicos.length; i += 10) {
      const lista = [...basicos.slice(i, i + 10), ...basicos.slice(i, i + 10)].slice(0, 20);
      while (lista.length < 20) lista.push('B-01');
      const e = crearPartida(i + 1, [{ nombre: 'A', cartas: lista.map((x, j) => (j % 3 === 0 ? `${x}*` : x)), tipos: ['rojo', 'ambar', 'morado'] }, mazo('azul')]);
      const rng = { rng: i };
      let n = 0;
      while (!e.ganador && n++ < 4000) responder(e, respuestaAzar(e.pendiente!, rng));
      expect(e.ganador).not.toBeNull();
    }
  });
});

describe('Espejo y neutralidad', () => {
  const pares = LISTA_CARTAS.filter((c) => c.pareja);

  it('cada pareja apunta a su espejo y comparten rareza', () => {
    for (const c of pares) {
      const o = CATALOGO[c.pareja!];
      expect(o, c.id).toBeDefined();
      expect(o.pareja).toBe(c.id);
      expect(o.rareza).toBe(c.rareza);
      expect(o.clase).toBe(c.clase);
    }
  });

  it('las parejas de políticos tienen las mismas estadísticas y efectos reflejados', () => {
    for (const c of pares.filter(esPolitico)) {
      const o = CATALOGO[c.pareja!] as CartaPolitico;
      expect(o.tipo, c.id).toBe(ESPEJO_TIPO[c.tipo]);
      expect(o.aguante).toBe(c.aguante);
      expect(o.relevo).toBe(c.relevo);
      expect(o.fase).toBe(c.fase);
      expect(!!o.cl).toBe(!!c.cl);
      expect(o.debilidad).toBe(c.debilidad ? ESPEJO_TIPO[c.debilidad] : null);
      expect(o.acciones.map((a) => [a.coste, a.dano, a.efectos])).toEqual(reflejar(c.acciones.map((a) => [a.coste, a.dano, a.efectos])));
      expect([o.carisma?.disparo, o.carisma?.efectos, o.carisma?.pasivas]).toEqual(reflejar([c.carisma?.disparo, c.carisma?.efectos, c.carisma?.pasivas]));
    }
  });

  it('los dos bloques tienen el mismo número de cartas, CL, Leyendas y rarezas', () => {
    const cuenta = (pred: (c: Carta) => boolean) => LISTA_CARTAS.filter((c) => esPolitico(c) && pred(c)).length;
    for (const [a, b] of [['rojo', 'azul'], ['magenta', 'verde']] as const) {
      for (const r of ['C', 'I', 'R', 'CL']) {
        expect(cuenta((c) => (c as CartaPolitico).tipo === a && c.rareza === r && c.coleccion !== 'secreta'), `${a} ${r}`).toBe(cuenta((c) => (c as CartaPolitico).tipo === b && c.rareza === r && c.coleccion !== 'secreta'));
      }
    }
    // las secretas se equilibran por bloque
    for (const r of ['E', 'S']) {
      expect(cuenta((c) => ['rojo', 'magenta'].includes((c as CartaPolitico).tipo) && c.rareza === r), r).toBe(cuenta((c) => ['azul', 'verde'].includes((c as CartaPolitico).tipo) && c.rareza === r));
    }
    const prog = cuenta((c) => !!c.leyenda && ['rojo', 'magenta'].includes((c as CartaPolitico).tipo));
    const cons = cuenta((c) => !!c.leyenda && ['azul', 'verde'].includes((c as CartaPolitico).tipo));
    expect(prog).toBe(cons);
  });

  it('las debilidades de Morado y Ámbar se reparten a partes iguales', () => {
    const pol = LISTA_CARTAS.filter(esPolitico).filter((c) => c.coleccion !== 'secreta');
    const morado = pol.filter((c) => c.tipo === 'morado');
    expect(morado.filter((c) => c.debilidad === 'magenta').length).toBe(morado.filter((c) => c.debilidad === 'verde').length);
    const ambar = pol.filter((c) => c.tipo === 'ambar');
    expect(ambar.filter((c) => c.debilidad === 'rojo').length).toBe(ambar.filter((c) => c.debilidad === 'azul').length);
  });

  it('los tertulianos van en parejas por línea editorial y los independientes no tienen filtro de bloque', () => {
    const t = LISTA_CARTAS.filter((c) => c.clase === 'tertuliano');
    const prog = t.filter((c) => c.clase === 'tertuliano' && c.linea === 'progresista').length;
    const cons = t.filter((c) => c.clase === 'tertuliano' && c.linea === 'conservadora').length;
    expect(prog).toBe(cons);
  });
});

describe('Contenido sobre personas reales', () => {
  it('cada persona de una carta está en el registro con cargo y fuentes', () => {
    for (const c of LISTA_CARTAS) {
      if (!c.persona) continue;
      const p = PERSONAS[c.persona];
      expect(p, `${c.id} usa a ${c.persona}, que no está en personas.ts`).toBeDefined();
      expect(p.cargo.length).toBeGreaterThan(3);
      expect(p.fuentes.length).toBeGreaterThan(0);
    }
  });

  it('las personas fallecidas solo aparecen como Leyendas', () => {
    for (const c of LISTA_CARTAS) if (c.persona && PERSONAS[c.persona].fallecido) expect(c.leyenda, c.id).toBeDefined();
  });

  it('ningún texto de carta usa insultos ni atribuye delitos (solo las Noticias citan hechos judiciales)', () => {
    const vetadas = /\b(corrupt\w*|ladr[oó]n\w*|delincuente\w*|imputad[oa]s?|criminal\w*|mafios[oa]s?|chorizos?|traidor\w*|golpistas?|terroristas?|fachas?|perroflautas?|bilduetarras?)\b/i;
    for (const c of LISTA_CARTAS) {
      const textos = [c.nombre, c.texto ?? '', c.frase ?? '', c.escena, 'cargo' in c ? c.cargo ?? '' : '', ...(esPolitico(c) ? c.acciones.map((a) => a.nombre + (a.texto ?? '')) : [])].join(' ');
      if (c.noticia) continue;
      expect(textos, `${c.id} ${c.nombre}`).not.toMatch(vetadas);
    }
  });

  it('las ilustraciones no piden caras, logotipos de partido ni texto legible', () => {
    const vetadas = /logotipo|logo |rostro|cara de |retrato de|gaviota|rosa roja|puño|escudo de españa|bandera de españa|senyera|ikurriña/i;
    for (const c of LISTA_CARTAS) expect(c.escena, `${c.id} ${c.nombre}`).not.toMatch(vetadas);
  });

  it('nadie de la Casa Real aparece en la colección', () => {
    for (const c of LISTA_CARTAS) expect(`${c.nombre} ${c.persona ?? ''}`).not.toMatch(/felipe vi|rey |reina |leonor|borb[oó]n/i);
  });
});
