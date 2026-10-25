import { accionesLegales, aguanteMax, clave, escanos } from '../src/motor/reglas';
import { calcularDano, clonar, crearPartida, ejecutarAislado, refrescarDecision, responder, respuestaValida } from '../src/motor/motor';
import { validarMazo } from '../src/motor/mazo';
import { MAZOS_INICIALES } from '../src/datos/mazos-iniciales';
import type { Jug, Partida } from '../src/motor/tipos';
import { OTRO } from '../src/motor/tipos';
import { aMano, banquillo, mazo, partidaLista, terminarAlAzar, tribuna } from './util';
import { respuestaAzar } from '../src/ia/azar';

const pasar = (e: Partida) => responder(e, { tipo: 'accion', accion: { a: 'pasar' } });
/** Responde una acción tras recalcular las legales (los tests tocan el estado a mano). */
const jugar = (e: Partida, a: Parameters<typeof clave>[0]) => { refrescarDecision(e); responder(e, { tipo: 'accion', accion: a }); };
/** Avanza hasta la fase principal del siguiente turno (resolviendo reemplazos al azar). */
function hastaPrincipal(e: Partida) {
  const rng = { rng: 9 };
  while (e.pendiente && e.pendiente.tipo !== 'accion' && !e.ganador) responder(e, respuestaAzar(e.pendiente, rng));
}

describe('Preparación y primer turno', () => {
  it('cada jugador coloca su tribuna y la partida empieza en el turno 1', () => {
    const e = partidaLista(5);
    expect(e.fase).toBe('juego');
    expect(e.turno).toBe(1);
    expect(e.jugadores[0].tribuna).not.toBeNull();
    expect(e.jugadores[1].tribuna).not.toBeNull();
    expect(e.pendiente?.tipo).toBe('accion');
    expect(e.pendiente?.jugador).toBe(e.primero);
  });

  it('la mano inicial siempre trae un Básico', () => {
    for (let s = 1; s <= 40; s++) {
      const e = crearPartida(s, [mazo('rojo'), mazo('verde')]);
      expect(e.jugadores[0].mano.length + (e.jugadores[0].tribuna ? 1 : 0) + e.jugadores[0].banquillo.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('quien empieza recibe voto pero no puede atacar en su primer turno', () => {
    const e = partidaLista(7);
    const j = e.enTurno;
    expect(e.jugadores[j].votoActual).not.toBeNull();
    const acc = accionesLegales(e, j);
    expect(acc.some((a) => a.a === 'atacar')).toBe(false);
  });

  it('nadie asciende en su primer turno ni con un político recién bajado', () => {
    const e = partidaLista(11);
    const j = e.enTurno;
    tribuna(e, j, 'B-01');
    aMano(e, j, 'B-03');
    expect(accionesLegales(e, j).some((a) => a.a === 'ascender')).toBe(false);
    pasar(e); hastaPrincipal(e); pasar(e); hastaPrincipal(e);
    expect(e.enTurno).toBe(j);
    expect(accionesLegales(e, j).some((a) => a.a === 'ascender')).toBe(true);
  });
});

describe('Combate', () => {
  it('la debilidad suma 20 (fuego amigo: rojo contra magenta)', () => {
    const e = partidaLista(3);
    const at = tribuna(e, 0, 'B-03'); // Sánchez, rojo
    const def = tribuna(e, 1, 'B-17'); // Colau, magenta (débil a rojo)
    expect(calcularDano(e, at.uid, def.uid, 40)).toBe(60);
    const def2 = tribuna(e, 1, 'B-18'); // Abascal, verde: sin debilidad a rojo
    expect(calcularDano(e, at.uid, def2.uid, 40)).toBe(40);
  });

  it('el Clima modifica el daño: Sereno −10, Guerra sucia +10', () => {
    const e = partidaLista(3);
    const at = tribuna(e, 0, 'B-03');
    const def = tribuna(e, 1, 'B-18');
    e.clima = 5;
    expect(calcularDano(e, at.uid, def.uid, 40)).toBe(30);
    e.clima = 2;
    expect(calcularDano(e, at.uid, def.uid, 40)).toBe(50);
  });

  it('un derribo da 1 punto (59 escaños) y obliga a reemplazar', () => {
    const e = partidaLista(13);
    const j = e.enTurno;
    pasar(e); hastaPrincipal(e);
    // ahora juega el segundo: le dejamos a tiro el defensor
    const yo = e.enTurno as Jug;
    tribuna(e, yo, 'B-03', ['rojo', 'magenta', 'azul']);
    const def = tribuna(e, OTRO(yo), 'B-02');
    banquillo(e, OTRO(yo), 'B-08');
    def.dano = aguanteMax(e, def) - 10;
    const acc = accionesLegales(e, yo).find((a) => a.a === 'atacar')!;
    jugar(e, acc);
    hastaPrincipal(e);
    expect(e.jugadores[yo].puntos).toBe(1);
    expect(escanos(e.jugadores[yo].puntos)).toBe(59);
    expect(e.jugadores[OTRO(yo)].tribuna?.uid).not.toBe(def.uid);
    void j;
  });

  it('quien se queda sin políticos pierde', () => {
    const e = partidaLista(17);
    pasar(e); hastaPrincipal(e);
    const yo = e.enTurno as Jug;
    tribuna(e, yo, 'B-03', ['rojo', 'rojo']);
    const def = tribuna(e, OTRO(yo), 'B-02');
    e.jugadores[OTRO(yo)].banquillo = [];
    def.dano = aguanteMax(e, def) - 5;
    jugar(e, accionesLegales(e, yo).find((a) => a.a === 'atacar')!);
    expect(e.ganador?.jug).toBe(yo);
  });

  it('con 3 puntos se gana por mayoría absoluta (176 escaños)', () => {
    const e = partidaLista(19);
    pasar(e); hastaPrincipal(e);
    const yo = e.enTurno as Jug;
    e.jugadores[yo].puntos = 2;
    tribuna(e, yo, 'B-03', ['rojo', 'rojo']);
    const def = tribuna(e, OTRO(yo), 'B-02');
    banquillo(e, OTRO(yo), 'B-08');
    def.dano = aguanteMax(e, def) - 5;
    jugar(e, accionesLegales(e, yo).find((a) => a.a === 'atacar')!);
    expect(e.ganador?.jug).toBe(yo);
    expect(escanos(3)).toBe(176);
  });
});

describe('Estados y recuento', () => {
  it('Bajo sospecha hace 10 entre turnos; Bloqueado impide atacar y caduca', () => {
    const e = partidaLista(23);
    const j = e.enTurno;
    const rv = OTRO(j);
    const t = tribuna(e, rv, 'B-04');
    ejecutarAislado(e, [{ t: 'efectos', lista: [{ e: 'estado', estado: 'sospecha', a: 'tribunaRival' }, { e: 'estado', estado: 'bloqueado', a: 'tribunaRival' }], i: 0, ctx: { yo: j, origen: 'carisma' } }]);
    expect(t.estados.sospecha).toBeDefined();
    pasar(e); hastaPrincipal(e);
    expect(t.dano).toBe(10);
    t.votos = ['azul', 'azul', 'azul'];
    expect(accionesLegales(e, rv).some((a) => a.a === 'atacar')).toBe(false);
    pasar(e); hastaPrincipal(e);
    expect(t.estados.bloqueado).toBeUndefined();
  });

  it('el relevo cura los estados del que baja al banquillo', () => {
    const e = partidaLista(29);
    const j = e.enTurno;
    const t = tribuna(e, j, 'B-01', ['rojo']);
    banquillo(e, j, 'B-07');
    t.estados.sospecha = 1;
    const r = accionesLegales(e, j).find((a) => a.a === 'relevo')!;
    jugar(e, r);
    expect(t.estados.sospecha).toBeUndefined();
    expect(e.jugadores[j].banquillo).toContain(t);
  });
});

describe('Mecánicas de campaña', () => {
  it('Ruptura: quien lleva el Clima a 1 entrega un punto al rival', () => {
    const e = partidaLista(31);
    const j = e.enTurno;
    e.clima = 2;
    ejecutarAislado(e, [{ t: 'efectos', lista: [{ e: 'clima', n: -1 }], i: 0, ctx: { yo: j, origen: 'carisma' } }]);
    expect(e.jugadores[OTRO(j)].puntos).toBe(1);
    expect(e.clima).toBe(3);
  });

  it('Sin fondos: sin mazo, la tribuna recibe 30 al empezar el turno', () => {
    const e = partidaLista(37);
    const rv = OTRO(e.enTurno);
    e.jugadores[rv].mazo = [];
    const t = tribuna(e, rv, 'B-04');
    pasar(e); hastaPrincipal(e);
    expect(t.dano).toBe(30);
  });

  it('Investidura: con 6 Apoyos de 4 partidos se gana', () => {
    const e = partidaLista(41);
    const j = e.enTurno;
    e.jugadores[j].apoyos = ['ERC', 'PNV', 'JUNTS', 'CC', 'BNG', 'PNV'];
    ejecutarAislado(e, [{ t: 'efectos', lista: [{ e: 'investidura' }], i: 0, ctx: { yo: j, origen: 'entrenador' } }]);
    expect(e.ganador?.jug).toBe(j);
  });

  it('sin Apoyos suficientes la investidura fracasa', () => {
    const e = partidaLista(43);
    const j = e.enTurno;
    e.jugadores[j].apoyos = ['ERC', 'ERC', 'ERC', 'ERC', 'ERC', 'ERC'];
    ejecutarAislado(e, [{ t: 'efectos', lista: [{ e: 'investidura' }], i: 0, ctx: { yo: j, origen: 'entrenador' } }]);
    expect(e.ganador).toBeNull();
  });

  it('el Asesor solo se juega una vez por turno', () => {
    const e = partidaLista(47);
    const j = e.enTurno;
    const a1 = aMano(e, j, 'B-36');
    const a2 = aMano(e, j, 'B-36');
    jugar(e, { a: 'entrenador', carta: a1 });
    expect(accionesLegales(e, j).some((a) => a.a === 'entrenador' && a.carta === a2)).toBe(false);
  });

  it('El dedazo asciende un Básico directamente a Fase 2', () => {
    const e = partidaLista(53);
    pasar(e); hastaPrincipal(e); pasar(e); hastaPrincipal(e);
    const j = e.enTurno;
    const t = tribuna(e, j, 'B-01');
    const basico = t.uid;
    const f2 = aMano(e, j, 'B-05');
    const d = aMano(e, j, 'B-32');
    jugar(e, { a: 'entrenador', carta: d });
    hastaPrincipal(e);
    expect(e.jugadores[j].tribuna?.uid).toBe(f2);
    expect(e.jugadores[j].tribuna?.debajo).toContain(basico);
  });
});

describe('Decisiones y determinismo', () => {
  it('rechaza acciones que no son legales', () => {
    const e = partidaLista(59);
    expect(respuestaValida(e, { tipo: 'accion', accion: { a: 'atacar', i: 0 } })).toBe(false);
    expect(respuestaValida(e, { tipo: 'accion', accion: { a: 'pasar' } })).toBe(true);
    expect(() => responder(e, { tipo: 'opcion', i: 0 })).toThrow();
  });

  it('la misma semilla y las mismas respuestas reproducen la partida', () => {
    const a = crearPartida(99, [mazo('azul'), mazo('verde')]);
    const b = crearPartida(99, [mazo('azul'), mazo('verde')]);
    const r1 = { rng: 5 }, r2 = { rng: 5 };
    let n = 0;
    while (!a.ganador && n++ < 3000) {
      const ra = respuestaAzar(a.pendiente!, r1);
      const rb = respuestaAzar(b.pendiente!, r2);
      expect(clave(ra.tipo === 'accion' ? ra.accion : { a: 'pasar' })).toBe(clave(rb.tipo === 'accion' ? rb.accion : { a: 'pasar' }));
      responder(a, ra);
      responder(b, rb);
    }
    expect(JSON.stringify(clonar(a))).toBe(JSON.stringify(clonar(b)));
  });

  it('300 partidas al azar terminan sin errores', () => {
    const ids = ['rojo', 'azul', 'magenta', 'verde'];
    for (let s = 1; s <= 300; s++) {
      const e = crearPartida(s, [mazo(ids[s % 4]), mazo(ids[(s * 3 + 1) % 4])]);
      terminarAlAzar(e, s);
      expect(e.ganador, `semilla ${s}`).not.toBeNull();
    }
  });
});

describe('Mazos', () => {
  it('los mazos iniciales son legales', () => {
    for (const m of MAZOS_INICIALES) expect(validarMazo(m), m.nombre).toEqual([]);
  });

  it('detecta mazos ilegales', () => {
    expect(validarMazo({ nombre: 'x', cartas: Array(20).fill('B-01'), tipos: ['rojo'] }).length).toBeGreaterThan(0);
    expect(validarMazo({ nombre: 'x', cartas: [...MAZOS_INICIALES[0].cartas.slice(0, 19)], tipos: ['rojo'] }).length).toBeGreaterThan(0);
    expect(validarMazo({ nombre: 'x', cartas: [...MAZOS_INICIALES[0].cartas], tipos: [] }).length).toBeGreaterThan(0);
    expect(validarMazo({ nombre: 'x', cartas: [...MAZOS_INICIALES[0].cartas.slice(0, 19), 'Z-99'], tipos: ['rojo'] }).length).toBeGreaterThan(0);
  });
});
