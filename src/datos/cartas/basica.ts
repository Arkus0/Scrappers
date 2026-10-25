// Colección Básica (B-01 … B-40): la tienen todos los jugadores y de aquí salen los cuatro mazos iniciales.
// Las parejas Rojo↔Azul y Magenta↔Verde son espejo: mismas estadísticas y efectos, distinta persona.
import { E, entrenador, espejo } from '../constructores';
import type { Carta } from '../../motor/tipos';

const B = 'basica' as const;

export const CARTAS_BASICA: Carta[] = [
  // ——— Rojo ↔ Azul: los dos candidatos a la Moncloa
  ...espejo(B, { eje: 'RA', aguante: 60, relevo: 1, rareza: 'C', arquetipos: ['ascenso'], acciones: [{ coste: 'X', dano: 20 }] },
    { num: 1, nombre: 'Pedro Sánchez · Concejal', persona: 'pedro-sanchez', cargo: 'Concejal en Madrid (2004-2009)', escena: 'Un coche familiar recorriendo de noche una carretera secundaria con un mapa de España desplegado en el asiento', icono: 'coche', acciones: ['Ruta en el Peugeot'] },
    { num: 2, nombre: 'Feijóo · Conselleiro', persona: 'feijoo', cargo: 'Conselleiro de Política Territorial (2003-2005)', escena: 'Un puente de hormigón en construcción sobre una ría gallega con grúas y niebla', icono: 'puente', acciones: ['Obras públicas'] }),
  ...espejo(B, { eje: 'RA', fase: 'fase1', aguante: 90, relevo: 1, rareza: 'I', arquetipos: ['ascenso'], acciones: [{ coste: 'XI', dano: 40 }] },
    { num: 3, nombre: 'Pedro Sánchez · Secretario general', persona: 'pedro-sanchez', cargo: 'Secretario general del PSOE', de: 'Pedro Sánchez · Concejal', frase: 'No es no.', escena: 'Una sala de reuniones larga con sillas rojas vacías y un atril solitario al fondo', icono: 'atril', acciones: ['No es no'] },
    { num: 4, nombre: 'Feijóo · Presidente de la Xunta', persona: 'feijoo', cargo: 'Presidente de la Xunta (2009-2022)', de: 'Feijóo · Conselleiro', escena: 'Un faro sobre un acantilado atlántico con cuatro haces de luz cruzando la noche', icono: 'faro', acciones: ['Cuatro mayorías absolutas'] }),
  ...espejo(B, {
    eje: 'RA', fase: 'fase2', aguante: 140, relevo: 2, rareza: 'R', arquetipos: ['ascenso'],
    acciones: [{ coste: 'XI', dano: 50 }, { coste: 'XXII', dano: 110 }],
    carisma: { disparo: 'pasiva', pasivas: [{ p: 'defensa', n: 10, ambito: 'este' }] },
  },
    { num: 5, nombre: 'Pedro Sánchez · Presidente', persona: 'pedro-sanchez', cargo: 'Presidente del Gobierno', de: 'Pedro Sánchez · Secretario general', escena: 'Un libro de tapas rojas abierto sobre un escritorio de palacio, iluminado por una lámpara de pie', icono: 'libro', acciones: ['Consejo de Ministros', 'Moción de censura'], carisma: 'Manual de resistencia' },
    { num: 6, nombre: 'Feijóo · Presidente del PP', persona: 'feijoo', cargo: 'Presidente del Partido Popular', de: 'Feijóo · Presidente de la Xunta', escena: 'Una escalinata de piedra que sube hacia una puerta entreabierta con luz azul', icono: 'escalera', acciones: ['Comité de dirección', 'Asalto a la Moncloa'], carisma: 'Moderación gallega' }),
  // ——— Rojo ↔ Azul: el equipo
  ...espejo(B, { eje: 'RA', aguante: 70, relevo: 1, rareza: 'C', claves: ['bulo'], arquetipos: ['bulo'], acciones: [{ coste: 'X', dano: 10, efectos: [E.bulo(10, 'elegirBanquilloRival')] }, { coste: 'XI', dano: 40 }] },
    { num: 7, nombre: 'Óscar Puente', persona: 'oscar-puente', cargo: 'Ministro de Transportes', escena: 'Un andén de tren de madrugada con un teléfono móvil brillando sobre un banco', icono: 'tren', acciones: ['Hilo de madrugada', 'Alta velocidad'] },
    { num: 8, nombre: 'Miguel Tellado', persona: 'miguel-tellado', cargo: 'Secretario general del PP', escena: 'Una sala de prensa con un atril azul y decenas de micrófonos apuntando a un hueco vacío', icono: 'microfono', acciones: ['Rueda de prensa', 'Ofensiva de los lunes'] }),
  ...espejo(B, {
    eje: 'RA', aguante: 80, relevo: 2, rareza: 'C', claves: ['portavoz'], arquetipos: ['equipo'],
    acciones: [{ coste: 'XXI', dano: 40 }],
    carisma: { disparo: 'activado', efectos: [{ e: 'moverVoto', n: 1, desde: 'banquilloPropio', a: 'tribunaPropia' }], requisito: { c: 'banquilloPropioMin', n: 1 } },
  },
    { num: 9, nombre: 'Patxi López', persona: 'patxi-lopez', cargo: 'Portavoz del PSOE en el Congreso', escena: 'Un escaño del hemiciclo con un micrófono encendido y una luz roja de turno de palabra', icono: 'hemiciclo', acciones: ['Sesión de control'], carisma: 'Turno de portavoces' },
    { num: 10, nombre: 'Ester Muñoz', persona: 'ester-munoz', cargo: 'Portavoz del PP en el Congreso', escena: 'Un escaño del hemiciclo con un micrófono encendido y una luz azul de turno de palabra', icono: 'hemiciclo', acciones: ['Pregunta al Gobierno'], carisma: 'Turno de portavoces' }),
  ...espejo(B, {
    eje: 'RA', aguante: 100, relevo: 2, rareza: 'I', arquetipos: ['equipo'],
    acciones: [{ coste: 'XXI', dano: 50 }],
    carisma: { disparo: 'pasiva', pasivas: [{ p: 'aguante', n: 20, ambito: 'aliadosBanquillo' }] },
  },
    { num: 11, nombre: 'Emiliano García-Page', persona: 'garcia-page', cargo: 'Presidente de Castilla-La Mancha', escena: 'Molinos de viento sobre un cerro manchego al atardecer, uno de ellos girando a contraviento', icono: 'molino', acciones: ['Verso suelto'], carisma: 'Barón territorial' },
    { num: 12, nombre: 'Juanma Moreno', persona: 'juanma-moreno', cargo: 'Presidente de la Junta de Andalucía', escena: 'Un patio andaluz con naranjos y una fuente, bajo un sol de mediodía', icono: 'sol', acciones: ['Mayoría andaluza'], carisma: 'Barón territorial' }),
  ...espejo(B, {
    eje: 'RA', aguante: 70, relevo: 1, rareza: 'C', arquetipos: ['tregua'],
    acciones: [{ coste: 'XI', dano: 30 }],
    carisma: { disparo: 'mitin', efectos: [E.cura(30, 'elegirDanadoPropio')] },
  },
    { num: 13, nombre: 'Salvador Illa', persona: 'salvador-illa', cargo: 'President de la Generalitat', escena: 'Un balcón gótico sobre una plaza de piedra con palomas y una luz de mañana tranquila', icono: 'balcon', acciones: ['Gestión'], carisma: 'Sin estridencias' },
    { num: 14, nombre: 'Alfonso Rueda', persona: 'alfonso-rueda', cargo: 'Presidente de la Xunta', escena: 'Una plaza de piedra mojada por la lluvia con soportales y una luz cálida en una ventana', icono: 'lluvia', acciones: ['Gestión'], carisma: 'Continuidad' }),

  // ——— Magenta ↔ Verde: los dos aspirantes
  ...espejo(B, { eje: 'MV', aguante: 60, relevo: 1, rareza: 'C', arquetipos: ['ascenso', 'equipo'], acciones: [{ coste: 'X', dano: 20 }] },
    { num: 15, nombre: 'Ada Colau · Activista', persona: 'colau', cargo: 'Portavoz de la PAH (2009-2014)', frase: 'Sí se puede.', escena: 'Una puerta de piso con pancartas lisas y muchas manos sujetándola desde dentro', icono: 'puerta', acciones: ['Stop desahucios'] },
    { num: 16, nombre: 'Santiago Abascal · Concejal', persona: 'abascal', cargo: 'Concejal en Llodio (1999-2007)', escena: 'Un pequeño ayuntamiento de pueblo vasco bajo un cielo plomizo, con una ventana iluminada', icono: 'ayuntamiento', acciones: ['Concejal en Llodio'] }),
  ...espejo(B, { eje: 'MV', fase: 'fase1', aguante: 90, relevo: 1, rareza: 'I', claves: ['disciplina'], arquetipos: ['ascenso', 'equipo'], acciones: [{ coste: 'XI', dano: 30, efectos: [E.masPor(10, 'aliadosPartido', 3)] }] },
    { num: 17, nombre: 'Ada Colau · Alcaldesa', persona: 'colau', cargo: 'Alcaldesa de Barcelona (2015-2023)', de: 'Ada Colau · Activista', escena: 'Una supermanzana con bancos y árboles en mitad de un cruce de avenidas, vista desde arriba', icono: 'arbol', acciones: ['Supermanzana'] },
    { num: 18, nombre: 'Santiago Abascal · Presidente', persona: 'abascal', cargo: 'Presidente de Vox', de: 'Santiago Abascal · Concejal', escena: 'Un caballo al galope por una ladera verde con nubes rápidas', icono: 'caballo', acciones: ['Cabalgada'] }),
  ...espejo(B, {
    eje: 'MV', fase: 'fase2', aguante: 140, relevo: 2, rareza: 'R', claves: ['disciplina'], arquetipos: ['ascenso', 'equipo'],
    acciones: [{ coste: 'XI', dano: 50 }, { coste: 'XXII', dano: 70, efectos: [E.masPor(20, 'aliadosPartido', 3)] }],
    carisma: { disparo: 'mitin', efectos: [{ e: 'buscar', filtro: { fase: ['basico'], partido: ['FA'] }, n: 1, destino: 'banquillo' }] },
  },
    { num: 19, nombre: 'Ada Colau · Candidata', persona: 'colau', cargo: 'Candidata del Frente Amplio', de: 'Ada Colau · Alcaldesa', escena: 'Un barco pequeño con velas magenta en mar abierto, rodeado de otros barcos a lo lejos', icono: 'barco', acciones: ['Frente Amplio', 'Todas las confluencias'], carisma: 'Sumar fuerzas' },
    { num: 20, nombre: 'Santiago Abascal · Candidato', persona: 'abascal', cargo: 'Candidato de Vox', de: 'Santiago Abascal · Presidente', escena: 'Una gran explanada llena de pancartas lisas verdes bajo focos de estadio', icono: 'estadio', acciones: ['Vistalegre', 'Todos a una'], carisma: 'Llamada a filas' }),
  // ——— Magenta ↔ Verde: el equipo
  ...espejo(B, {
    eje: 'MV', aguante: 70, relevo: 1, rareza: 'C', arquetipos: ['combo'],
    acciones: [{ coste: 'XI', dano: 30 }],
    carisma: { disparo: 'activado', descartaVotos: 1, efectos: [E.robar(1)] },
  },
    { num: 21, nombre: 'Yolanda Díaz', persona: 'yolanda-diaz', cargo: 'Vicepresidenta segunda y ministra de Trabajo', escena: 'Una mesa de negociación con tres sillas y un único documento firmado en el centro', icono: 'pluma', acciones: ['Reforma laboral'], carisma: 'Diálogo social' },
    { num: 22, nombre: 'Ignacio Garriga', persona: 'ignacio-garriga', cargo: 'Secretario general de Vox', escena: 'Un mapa de España clavado en un corcho con chinchetas verdes y un rotulador sin capuchón', icono: 'mapa', acciones: ['Estructura territorial'], carisma: 'Organización' }),
  ...espejo(B, {
    eje: 'MV', aguante: 70, relevo: 1, rareza: 'C', arquetipos: ['tregua'],
    acciones: [{ coste: 'X', dano: 10, efectos: [E.cura(20, 'tribunaPropia')] }, { coste: 'XI', dano: 30, efectos: [E.si({ c: 'defensorDanado' }, [E.mas(20)])] }],
  },
    { num: 23, nombre: 'Mónica García', persona: 'monica-garcia', cargo: 'Ministra de Sanidad', escena: 'Un fonendoscopio sobre un atril parlamentario junto a un vaso de agua', icono: 'fonendo', acciones: ['Primeros auxilios', 'Diagnóstico'] },
    { num: 24, nombre: 'Pepa Millán', persona: 'pepa-millan', cargo: 'Diputada de Vox', escena: 'Un cuaderno de notas abierto en un escaño con frases subrayadas sin texto legible', icono: 'cuaderno', acciones: ['Apunte', 'Réplica'] }),
  ...espejo(B, {
    eje: 'MV', aguante: 70, relevo: 1, rareza: 'C', arquetipos: ['control'],
    acciones: [{ coste: 'XI', dano: 30, efectos: [E.moneda([E.estado('desnortado')])] }],
  },
    { num: 25, nombre: 'Ernest Urtasun', persona: 'ernest-urtasun', cargo: 'Ministro de Cultura', escena: 'Un escenario de teatro vacío con un foco magenta y un telón a medio subir', icono: 'teatro', acciones: ['Golpe de efecto'] },
    { num: 26, nombre: 'Jorge Buxadé', persona: 'jorge-buxade', cargo: 'Dirigente de Vox', escena: 'Un pasillo largo de un parlamento europeo con banderas lisas y una cartera verde', icono: 'maletin', acciones: ['Desde Bruselas'] }),

  // ——— entrenadores básicos (neutrales)
  entrenador(B, { num: 27, nombre: 'Encuesta interna', clase: 'recurso', rareza: 'C', efectos: [{ e: 'mirarMazo', n: 4, quien: 'yo', tomar: { clase: ['politico'] } }], requisito: { c: 'mazoPropioMin', n: 1 }, escena: 'Un gráfico de barras hecho con papeles de colores sobre una mesa de cocina, de noche', icono: 'grafico' }),
  entrenador(B, { num: 28, nombre: 'Ficha de afiliación', clase: 'recurso', rareza: 'C', efectos: [{ e: 'buscar', filtro: { fase: ['basico'] }, n: 1, destino: 'mano' }], requisito: { c: 'mazoPropioMin', n: 1 }, escena: 'Un formulario en blanco y un bolígrafo sobre un mostrador de sede de barrio', icono: 'ficha' }),
  entrenador(B, { num: 29, nombre: 'Tila', clase: 'recurso', rareza: 'C', efectos: [E.cura(20, 'tribunaPropia')], requisito: { c: 'tribunaPropiaDanada' }, escena: 'Una taza humeante sobre un escaño, con un sobre de infusión al lado', icono: 'taza', arquetipos: ['tregua'] }),
  entrenador(B, { num: 30, nombre: 'Coche oficial', clase: 'recurso', rareza: 'C', efectos: [{ e: 'cambiarPropio' }], requisito: { c: 'banquilloPropioMin', n: 1 }, escena: 'Un coche negro con la puerta trasera abierta frente a una escalinata', icono: 'coche' }),
  entrenador(B, { num: 31, nombre: 'Moción de censura', clase: 'recurso', rareza: 'R', unica: true, efectos: [{ e: 'cambiarRival', elige: 'yo' }], requisito: { c: 'banquilloRivalMin', n: 1 }, escena: 'Un hemiciclo visto desde arriba con todos los escaños girados hacia el mismo atril', icono: 'hemiciclo', arquetipos: ['control'] }),
  entrenador(B, { num: 32, nombre: 'El dedazo', clase: 'recurso', rareza: 'I', efectos: [{ e: 'dedazo' }], escena: 'Una mano gigante señalando desde una nube a una silla vacía en medio de una sala', icono: 'dedo', arquetipos: ['ascenso'] }),
  entrenador(B, { num: 33, nombre: 'Megáfono', clase: 'herramienta', rareza: 'C', pasivas: [{ p: 'dano', n: 10, ambito: 'este' }], escena: 'Un megáfono blanco con una cinta de color atada al asa', icono: 'megafono' }),
  entrenador(B, { num: 34, nombre: 'Escolta', clase: 'herramienta', rareza: 'C', pasivas: [{ p: 'defensa', n: 10, ambito: 'este' }], escena: 'Unas gafas de sol y un pinganillo sobre una gabardina doblada', icono: 'escudo' }),
  entrenador(B, { num: 35, nombre: 'Voto útil', clase: 'recurso', rareza: 'I', efectos: [{ e: 'votoExtraTurno' }], escena: 'Una papeleta dorada luminosa entrando en una urna transparente', icono: 'urna' }),
  entrenador(B, { num: 36, nombre: 'José Félix Tezanos', clase: 'asesor', rareza: 'C', persona: 'tezanos', cargo: 'Presidente del CIS', efectos: [E.robar(2)], escena: 'Un barómetro antiguo de aguja sobre una pila de cuestionarios', icono: 'barometro' }),
  entrenador(B, { num: 37, nombre: 'Narciso Michavila', clase: 'asesor', rareza: 'C', persona: 'michavila', cargo: 'Presidente de GAD3', efectos: [{ e: 'mirarMazo', n: 5, quien: 'yo', tomar: {} }], requisito: { c: 'mazoPropioMin', n: 1 }, escena: 'Una lupa sobre un mapa electoral coloreado por provincias', icono: 'lupa' }),
  entrenador(B, { num: 38, nombre: 'Congreso de los Diputados', clase: 'escenario', rareza: 'I', pasivas: [{ p: 'aguante', n: 20, ambito: 'todos', filtro: { fase: ['basico'] } }], escena: 'La fachada neoclásica de un parlamento con dos leones de bronce, de noche y sin gente', icono: 'leon' }),
  entrenador(B, { num: 39, nombre: 'Pegada de carteles', clase: 'recurso', rareza: 'C', efectos: [E.robar(1), E.si({ c: 'combo' }, [E.robar(1)])], escena: 'Un cubo de cola y una brocha junto a una pared llena de carteles lisos superpuestos', icono: 'cartel', arquetipos: ['combo'], claves: ['combo'] }),
  entrenador(B, { num: 40, nombre: 'Comisión de investigación', clase: 'recurso', rareza: 'I', efectos: [{ e: 'barajarManoRobar', quien: 'rival', n: 3 }], requisito: { c: 'manoRivalMin', n: 4 }, escena: 'Una mesa larga de comisión con un micrófono ante una silla vacía y carpetas apiladas', icono: 'carpeta', arquetipos: ['control'] }),
];
