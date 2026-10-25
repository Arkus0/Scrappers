// Registro de las personas reales que aparecen en las cartas: su cargo público y de dónde sale.
// Ninguna carta puede usar a alguien que no esté aquí (lo comprueba tests/contenido.test.ts).
// Normas en docs/NORMAS_CONTENIDO.md: solo la faceta pública, sátira amable, nada de delitos sin sentencia firme.

export type Ambito = 'politico' | 'periodista' | 'asesor' | 'historico';

export interface Persona {
  nombre: string;
  ambito: Ambito;
  /** cargo o papel público por el que se le conoce (octubre de 2026) */
  cargo: string;
  /** fuentes públicas del cargo y de las frases que se citan */
  fuentes: string[];
  /** fallecida: solo como Leyenda y con respeto */
  fallecido?: boolean;
}

const W = (titulo: string) => `Wikipedia (es): ${titulo}`;
const C = 'Congreso de los Diputados: ficha parlamentaria';

export const PERSONAS: Record<string, Persona> = {};

function reg(id: string, p: Persona) {
  if (PERSONAS[id]) throw new Error(`Persona repetida: ${id}`);
  PERSONAS[id] = p;
}

// ————————————————————————————————————— candidatos (de «176 · La Batalla del 29N», src/data/partidos.ts)
reg('pedro-sanchez', { nombre: 'Pedro Sánchez', ambito: 'politico', cargo: 'Presidente del Gobierno y candidato del PSOE', fuentes: [W('Pedro Sánchez'), 'Comité Federal del PSOE (2016): «No es no»', 'Manual de resistencia (Península, 2019)'] });
reg('feijoo', { nombre: 'Alberto Núñez Feijóo', ambito: 'politico', cargo: 'Presidente del PP y candidato a la Moncloa', fuentes: [W('Alberto Núñez Feijóo'), 'Xunta de Galicia: presidentes (2009-2022)'] });
reg('abascal', { nombre: 'Santiago Abascal', ambito: 'politico', cargo: 'Presidente de Vox y candidato', fuentes: [W('Santiago Abascal'), 'Ayuntamiento de Llodio: concejal (1999-2007)'] });
reg('colau', { nombre: 'Ada Colau', ambito: 'politico', cargo: 'Candidata del Frente Amplio', fuentes: [W('Ada Colau'), 'Plataforma de Afectados por la Hipoteca: «Sí se puede»', 'Ayuntamiento de Barcelona: alcaldesa (2015-2023)'] });
reg('irene-montero', { nombre: 'Irene Montero', ambito: 'politico', cargo: 'Candidata de Podemos', fuentes: [W('Irene Montero'), 'Parlamento Europeo: eurodiputada (2024)'] });

// ————————————————————————————————————— colección básica
reg('oscar-puente', { nombre: 'Óscar Puente', ambito: 'politico', cargo: 'Ministro de Transportes', fuentes: [W('Óscar Puente'), 'BOE: nombramiento (2023)'] });
reg('miguel-tellado', { nombre: 'Miguel Tellado', ambito: 'politico', cargo: 'Secretario general del PP', fuentes: [W('Miguel Tellado'), 'Congreso del PP (2025)'] });
reg('patxi-lopez', { nombre: 'Patxi López', ambito: 'politico', cargo: 'Portavoz del PSOE en el Congreso', fuentes: [W('Patxi López'), C] });
reg('ester-munoz', { nombre: 'Ester Muñoz', ambito: 'politico', cargo: 'Portavoz del PP en el Congreso', fuentes: [W('Ester Muñoz'), C] });
reg('garcia-page', { nombre: 'Emiliano García-Page', ambito: 'politico', cargo: 'Presidente de Castilla-La Mancha', fuentes: [W('Emiliano García-Page')] });
reg('juanma-moreno', { nombre: 'Juanma Moreno', ambito: 'politico', cargo: 'Presidente de la Junta de Andalucía', fuentes: [W('Juan Manuel Moreno'), 'Elecciones andaluzas de mayo de 2026: 53 escaños'] });
reg('salvador-illa', { nombre: 'Salvador Illa', ambito: 'politico', cargo: 'President de la Generalitat de Catalunya', fuentes: [W('Salvador Illa')] });
reg('alfonso-rueda', { nombre: 'Alfonso Rueda', ambito: 'politico', cargo: 'Presidente de la Xunta de Galicia', fuentes: [W('Alfonso Rueda')] });
reg('yolanda-diaz', { nombre: 'Yolanda Díaz', ambito: 'politico', cargo: 'Vicepresidenta segunda y ministra de Trabajo', fuentes: [W('Yolanda Díaz')] });
reg('ignacio-garriga', { nombre: 'Ignacio Garriga', ambito: 'politico', cargo: 'Secretario general de Vox', fuentes: [W('Ignacio Garriga')] });
reg('monica-garcia', { nombre: 'Mónica García', ambito: 'politico', cargo: 'Ministra de Sanidad', fuentes: [W('Mónica García Gómez')] });
reg('pepa-millan', { nombre: 'Pepa Millán', ambito: 'politico', cargo: 'Portavoz de Vox en el Congreso', fuentes: [W('Pepa Millán'), C] });
reg('ernest-urtasun', { nombre: 'Ernest Urtasun', ambito: 'politico', cargo: 'Ministro de Cultura', fuentes: [W('Ernest Urtasun')] });
reg('jorge-buxade', { nombre: 'Jorge Buxadé', ambito: 'politico', cargo: 'Eurodiputado de Vox', fuentes: [W('Jorge Buxadé'), 'Parlamento Europeo: ficha de eurodiputado'] });
reg('tezanos', { nombre: 'José Félix Tezanos', ambito: 'asesor', cargo: 'Presidente del CIS', fuentes: [W('José Félix Tezanos'), 'Centro de Investigaciones Sociológicas'] });
reg('michavila', { nombre: 'Narciso Michavila', ambito: 'asesor', cargo: 'Presidente de GAD3', fuentes: [W('Narciso Michavila'), 'GAD3: equipo'] });
