// Perfil, sobres, papeletas, misiones, guardado y campaña.
import { describe, expect, it } from 'vitest';
import { CARTAS_JUGABLES, CATALOGO, LISTA_CARTAS } from '../src/datos/catalogo';
import { MAZOS_INICIALES } from '../src/datos/mazos-iniciales';
import { MAZOS_TEMATICOS } from '../src/datos/mazos-tematicos';
import { PROVINCIAS, TOTAL_ESCANOS } from '../src/datos/provincias';
import { validarMazo } from '../src/motor/mazo';
import { cargarPerfil, exportarPerfil, guardarPerfil, importarPerfil } from '../src/perfil/almacen';
import {
  ACTOS_POR_SEMANA, cerrarSemana, escanosDe, libres, mazoRival, MAYORIA, nuevaCampana, prepararActo, prepararJefe, prepararNegociacion, resolverActo, SEMANAS,
} from '../src/perfil/campana';
import { conseguirLogro, misionesDelDia, registrarPartida } from '../src/perfil/misiones';
import {
  cartasQueFaltan, comprarTematico, COSTE_FABRICAR, copias, copiasTotal, desbloquearBasica, elegirInicial, fabricar, FONDOS_INICIALES, guardarMazo,
  migrar, perfilNuevo, PRECIO_SOBRE, reciclarDuplicados, VALOR_PAPELETAS,
} from '../src/perfil/perfil';
import { abrirSobre, HUECO_4, HUECO_5, recargarGratis, SOBRES_GARANTIA } from '../src/perfil/sobres';
import { partidaLista, terminarAlAzar } from './util';

const T0 = Date.UTC(2026, 9, 25, 10);

describe('perfil', () => {
  it('empieza con fondos, sobres gratis y sin cartas', () => {
    const p = perfilNuevo(T0);
    expect(p.fondos).toBe(FONDOS_INICIALES);
    expect(p.sobres.gratis).toBe(2);
    expect(Object.keys(p.coleccion)).toHaveLength(0);
  });

  it('el mazo inicial da sus cartas y queda como mazo activo jugable', () => {
    for (const m of MAZOS_INICIALES) {
      const p = perfilNuevo(T0);
      elegirInicial(p, m.id);
      expect(p.mazoActivo).toBe(`inicial-${m.id}`);
      expect(cartasQueFaltan(p, m.cartas)).toEqual([]);
      expect(validarMazo(p.mazos[0])).toEqual([]);
    }
  });

  it('desbloquear la Básica da los cuatro mazos iniciales una sola vez', () => {
    const p = perfilNuevo(T0);
    elegirInicial(p, 'rojo');
    expect(desbloquearBasica(p)).toBe(true);
    expect(desbloquearBasica(p)).toBe(false);
    for (const m of MAZOS_INICIALES) expect(cartasQueFaltan(p, m.cartas)).toEqual([]);
    expect(p.mazos.filter((m) => m.id.startsWith('inicial-'))).toHaveLength(4);
  });

  it('reciclar convierte lo que pasa de 2 copias en papeletas y deja las Shiny', () => {
    const p = perfilNuevo(T0);
    const c = CARTAS_JUGABLES.find((x) => x.rareza === 'R' && !x.unica)!;
    p.coleccion[c.id] = 4;
    p.coleccion[`${c.id}*`] = 1;
    const ganadas = reciclarDuplicados(p);
    expect(ganadas).toBe(3 * VALOR_PAPELETAS.R);
    expect(copias(p, c.id)).toBe(1);
    expect(copias(p, `${c.id}*`)).toBe(1);
    expect(reciclarDuplicados(p)).toBe(0);
  });

  it('fabricar cuesta papeletas y respeta el máximo de copias', () => {
    const p = perfilNuevo(T0);
    const c = CARTAS_JUGABLES.find((x) => x.rareza === 'I' && !x.unica)!;
    expect(fabricar(p, c.id)).toBe(false);
    p.papeletas = COSTE_FABRICAR.I * 3;
    expect(fabricar(p, c.id)).toBe(true);
    expect(fabricar(p, c.id)).toBe(true);
    expect(fabricar(p, c.id)).toBe(false);
    expect(copiasTotal(p, c.id)).toBe(2);
    expect(p.papeletas).toBe(COSTE_FABRICAR.I);
  });

  it('no se guarda un mazo con cartas que no tienes', () => {
    const p = perfilNuevo(T0);
    elegirInicial(p, 'azul');
    const t = MAZOS_TEMATICOS[0];
    const errores = guardarMazo(p, { id: 'x', nombre: 'x', cartas: [...t.cartas], tipos: [...t.tipos] });
    expect(errores.some((e) => e.startsWith('Te faltan'))).toBe(true);
    p.fondos = 10_000;
    expect(comprarTematico(p, t.id)).toBe(true);
    expect(comprarTematico(p, t.id)).toBe(false);
    expect(guardarMazo(p, { id: 'x', nombre: 'x', cartas: [...t.cartas], tipos: [...t.tipos] })).toEqual([]);
  });

  it('migrar completa campos nuevos y quita cartas que ya no existen', () => {
    const viejo = { v: 0, nombre: 'Ana', coleccion: { 'B-01': 2, 'NO-EXISTE': 1 }, fondos: 50, stats: { partidas: 3 } } as never;
    const p = migrar(viejo);
    expect(p.nombre).toBe('Ana');
    expect(p.coleccion['NO-EXISTE']).toBeUndefined();
    expect(p.coleccion['B-01']).toBe(2);
    expect(p.stats.partidas).toBe(3);
    expect(p.stats.victorias).toBe(0);
    expect(p.ajustes.nivel).toBe('normal');
  });
});

describe('guardado', () => {
  it('guarda y carga (en memoria si no hay localStorage)', () => {
    const p = perfilNuevo(T0);
    p.nombre = 'Prueba';
    guardarPerfil(p);
    expect(cargarPerfil().nombre).toBe('Prueba');
  });

  it('el código de copia ida y vuelta, y detecta manipulaciones', () => {
    const p = perfilNuevo(T0);
    p.nombre = 'Ñandú · ¡tildes!';
    elegirInicial(p, 'verde');
    const codigo = exportarPerfil(p);
    const q = importarPerfil(codigo);
    expect(typeof q).toBe('object');
    expect((q as typeof p).nombre).toBe(p.nombre);
    expect((q as typeof p).coleccion).toEqual(p.coleccion);
    const roto = codigo.slice(0, -6) + (codigo.slice(-6, -5) === 'A' ? 'B' : 'A') + codigo.slice(-5);
    expect(typeof importarPerfil(roto)).toBe('string');
    expect(typeof importarPerfil('hola')).toBe('string');
  });
});

describe('sobres', () => {
  it('cobra, da 5 cartas sin repetir y nunca de la colección Básica', () => {
    const p = perfilNuevo(T0);
    const a = abrirSobre(p, 'gratis', T0)!;
    expect(a).toHaveLength(5);
    expect(new Set(a.map((c) => c.id)).size).toBe(5);
    expect(a.every((c) => CATALOGO[c.id].coleccion !== 'basica')).toBe(true);
    expect(p.sobres.gratis).toBe(1);
    abrirSobre(p, 'gratis', T0);
    expect(abrirSobre(p, 'gratis', T0)).toBeNull();
    expect(abrirSobre(p, 'fondos', T0)).not.toBeNull();
    expect(p.fondos).toBe(FONDOS_INICIALES - PRECIO_SOBRE);
  });

  it('los sobres gratis se recargan con el tiempo hasta 2', () => {
    const p = perfilNuevo(T0);
    abrirSobre(p, 'gratis', T0);
    abrirSobre(p, 'gratis', T0);
    recargarGratis(p, T0 + 11 * 3600_000);
    expect(p.sobres.gratis).toBe(0);
    recargarGratis(p, T0 + 12 * 3600_000 + 1);
    expect(p.sobres.gratis).toBe(1);
    recargarGratis(p, T0 + 100 * 3600_000);
    expect(p.sobres.gratis).toBe(2);
  });

  it('las rarezas de 100.000 sobres siguen las tablas (chi-cuadrado) y la garantía se cumple', () => {
    const p = perfilNuevo(T0);
    p.fondos = 1e9;
    const N = 100_000;
    const cuenta4: Record<string, number> = {};
    const cuenta5: Record<string, number> = {};
    let shiny = 0, personas = 0, racha = 0, peorRacha = 0;
    for (let i = 0; i < N; i++) {
      const s = abrirSobre(p, 'fondos', T0)!;
      const r = s.map((c) => CATALOGO[c.id].rareza);
      expect(r.slice(0, 3)).toEqual(['C', 'C', 'C']);
      cuenta4[r[3]] = (cuenta4[r[3]] ?? 0) + 1;
      cuenta5[r[4]] = (cuenta5[r[4]] ?? 0) + 1;
      for (const c of s) if (CATALOGO[c.id].persona) { personas++; if (c.shiny) shiny++; }
      racha = r.some((x) => x === 'CL' || x === 'E' || x === 'S') ? 0 : racha + 1;
      peorRacha = Math.max(peorRacha, racha);
    }
    expect(peorRacha).toBeLessThan(SOBRES_GARANTIA);
    // el hueco 4 nunca tiene garantía: debe seguir la tabla exacta
    let chi = 0;
    for (const [r, q] of HUECO_4) chi += ((cuenta4[r] ?? 0) - q * N) ** 2 / (q * N);
    expect(chi).toBeLessThan(16.27); // 3 grados de libertad, p = 0,001
    // el hueco 5 sube con la garantía: CL o mejor algo por encima de la tabla
    const altas5 = (cuenta5.CL ?? 0) + (cuenta5.E ?? 0) + (cuenta5.S ?? 0);
    const esperado = HUECO_5.filter(([r]) => r === 'CL' || r === 'E' || r === 'S').reduce((s, [, q]) => s + q, 0) * N;
    expect(altas5).toBeGreaterThan(esperado * 0.97);
    expect(altas5).toBeLessThan(esperado * 1.25);
    expect(shiny / personas).toBeGreaterThan(0.045);
    expect(shiny / personas).toBeLessThan(0.055);
  });

  it('la colección completa es alcanzable con los sobres (toda carta de la expansión puede salir)', () => {
    const p = perfilNuevo(T0);
    p.fondos = 1e9;
    for (let i = 0; i < 20_000; i++) abrirSobre(p, 'fondos', T0);
    const enSobres = CARTAS_JUGABLES.filter((c) => c.coleccion !== 'basica');
    const faltan = enSobres.filter((c) => !copiasTotal(p, c.id));
    expect(faltan.map((c) => c.id)).toEqual([]);
  });
});

describe('misiones y recompensas', () => {
  it('tres misiones distintas al día, las mismas durante todo el día', () => {
    const p = perfilNuevo(T0);
    misionesDelDia(p, T0);
    const ids = p.misiones.lista.map((m) => m.id);
    expect(new Set(ids).size).toBe(3);
    misionesDelDia(p, T0 + 3600_000);
    expect(p.misiones.lista.map((m) => m.id)).toEqual(ids);
  });

  it('registrar una partida paga, suma estadísticas y desbloquea la Básica a las 3 victorias', () => {
    const p = perfilNuevo(T0);
    elegirInicial(p, 'rojo');
    misionesDelDia(p, T0);
    let victorias = 0;
    for (let s = 1; victorias < 3 && s < 60; s++) {
      const e = terminarAlAzar(partidaLista(s), s);
      if (!e.ganador) continue;
      const antes = p.fondos;
      const yo = 0;
      const r = registrarPartida(p, { modo: 'ia', ganador: e.ganador.jug, yo, partida: e });
      expect(p.fondos).toBe(antes + r.reduce((x, y) => x + y.fondos, 0));
      if (e.ganador.jug === yo) victorias++;
    }
    expect(victorias).toBe(3);
    expect(p.logros.basica).toBeTruthy();
    expect(p.logros.primeraVictoria).toBeTruthy();
    for (const m of MAZOS_INICIALES) expect(cartasQueFaltan(p, m.cartas)).toEqual([]);
  });

  it('un logro solo se cobra una vez', () => {
    const p = perfilNuevo(T0);
    expect(conseguirLogro(p, 'leyenda')).toHaveLength(1);
    expect(conseguirLogro(p, 'leyenda')).toHaveLength(0);
  });
});

describe('campaña', () => {
  it('el mapa suma 350 escaños en 52 circunscripciones', () => {
    expect(PROVINCIAS).toHaveLength(52);
    expect(TOTAL_ESCANOS).toBe(350);
  });

  it('todos los rivales posibles son mazos legales', () => {
    for (const bloque of ['progresista', 'conservador'] as const) {
      const c = nuevaCampana(bloque, 'x', 7);
      for (const p of PROVINCIAS) {
        const a = prepararActo({ ...c, provincias: {} }, p.id)!;
        expect(validarMazo(mazoRival(a.rival))).toEqual([]);
      }
    }
  });

  it('ganarlo todo da la mayoría absoluta antes de la noche electoral', () => {
    const c = nuevaCampana('progresista', 'x', 11);
    for (let s = 0; s < SEMANAS && !c.terminada; s++) {
      for (let i = 0; i < ACTOS_POR_SEMANA && !c.terminada; i++) {
        const prov = libres(c).sort((a, b) => b.escanos - a.escanos)[0];
        prepararActo(c, prov.id);
        resolverActo(c, true);
      }
      if (prepararJefe(c)) resolverActo(c, true);
      cerrarSemana(c);
    }
    expect(c.terminada?.investidura).toBe(true);
    expect(escanosDe(c, 'yo')).toBeGreaterThanOrEqual(MAYORIA);
  });

  it('perderlo todo acaba en repetición electoral y nunca deja provincias sin dueño', () => {
    const c = nuevaCampana('conservador', 'x', 5);
    for (let s = 0; s < SEMANAS && !c.terminada; s++) {
      for (let i = 0; i < ACTOS_POR_SEMANA; i++) {
        const prov = libres(c)[0];
        prepararActo(c, prov.id);
        resolverActo(c, false);
      }
      if (prepararJefe(c)) resolverActo(c, false);
      cerrarSemana(c);
    }
    expect(c.terminada?.investidura).toBe(false);
    expect(libres(c)).toHaveLength(0);
    expect(escanosDe(c, 'yo') + escanosDe(c, 'rival')).toBe(350);
  });

  it('quedarse entre 160 y 175 lleva a la negociación', () => {
    let vistas = 0;
    for (let semilla = 1; semilla < 400 && vistas < 3; semilla++) {
      const c = nuevaCampana('progresista', 'x', semilla);
      let r = semilla;
      const azar = () => (r = (r * 48271) % 2147483647) / 2147483647;
      for (let s = 0; s < SEMANAS && !c.terminada; s++) {
        for (let i = 0; i < ACTOS_POR_SEMANA && !c.terminada; i++) {
          const l = libres(c).sort((a, b) => b.escanos - a.escanos);
          if (!l.length) break;
          prepararActo(c, l[0].id);
          resolverActo(c, azar() < 0.55);
        }
        if (!c.terminada && prepararJefe(c)) resolverActo(c, azar() < 0.55);
        if (!c.terminada) cerrarSemana(c);
      }
      if (c.negociacion === 'pendiente') {
        vistas++;
        const yo = escanosDe(c, 'yo');
        expect(yo).toBeGreaterThanOrEqual(160);
        expect(yo).toBeLessThan(MAYORIA);
        const a = prepararNegociacion(c)!;
        expect(a.rival).toBe('investidura');
        resolverActo(c, true);
        expect(c.terminada?.investidura).toBe(true);
      }
    }
    expect(vistas).toBeGreaterThan(0);
  });

  it('las cartas de las tablas de rarezas existen', () => {
    for (const [r] of [...HUECO_4, ...HUECO_5]) expect(LISTA_CARTAS.some((c) => c.rareza === r && c.coleccion !== 'basica')).toBe(true);
  });
});
