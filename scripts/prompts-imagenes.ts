// Encargo de ilustraciones: un prompt por carta (las 306) para ChatGPT u otro generador de imágenes.
// Escribe docs/PROMPTS_IMAGENES.md (para leer) y docs/cartas.json (para que una IA las recorra una a una).
// Uso: npm run prompts
import { writeFileSync } from 'node:fs';
import { esPolitico, esTertuliano, LISTA_CARTAS } from '../src/datos/catalogo';
import { PARTIDOS, TIPO_INFO } from '../src/datos/partidos';
import type { Carta } from '../src/motor/tipos';
import { CLASE_TXT, RAREZA_NOMBRE } from '../src/ui/textos-carta';

const PALETA: Record<string, string> = {
  rojo: 'rojos bermellón y granate con toques crema',
  magenta: 'magentas y fucsias con toques rosa pálido',
  azul: 'azules cobalto y marino con toques celeste',
  verde: 'verdes oliva y esmeralda con toques lima',
  morado: 'morados y violetas con toques lavanda',
  ambar: 'ámbar, ocre y mostaza con toques arena',
  incoloro: 'grises perla y plata con toques blanco roto',
  tertuliano: 'violetas de plató con luces de estudio frías',
  asesor: 'verdes azulados y turquesa apagado',
  recurso: 'grises pizarra con un acento de color',
  herramienta: 'dorados envejecidos y marrón cuero',
  escenario: 'azules nocturnos con luces cálidas de ventanas',
  maniobra: 'burdeos y rosa viejo en penumbra',
};

export const ESTILO = 'Ilustración horizontal en estilo cartel serigrafiado de campaña de los años 70-80: tintas planas, trama de semitono visible, grano de papel, luz dramática y composición sencilla y legible en pequeño.';
export const NORMAS = 'Sin caras ni rasgos reconocibles de ninguna persona real (si aparece alguien, solo como silueta anónima a contraluz o de espaldas), sin logotipos de partidos, sin banderas oficiales, sin escudos y sin ningún texto, letra ni número en la imagen.';
export const FORMATO = 'Proporción 20:13 (por ejemplo 1200 × 780 px).';

const archivo = (c: Carta) => `${c.id}.png`;

function paleta(c: Carta): string {
  if (esPolitico(c)) return PALETA[c.tipo] + (c.tipo2 ? ` mezclados con ${PALETA[c.tipo2]}` : '');
  return PALETA[c.clase];
}

function sujeto(c: Carta): string {
  if (esPolitico(c)) return `Carta de un cargo político: ${c.cargo ?? c.nombre.split(' · ')[0]}. La persona no aparece o es una silueta anónima pequeña; el protagonista es el lugar o el objeto.`;
  if (esTertuliano(c)) return `Carta de un periodista o tertuliano${c.cargo ? ` (${c.cargo})` : ''}. La persona no aparece: protagoniza el espacio de trabajo.`;
  if (c.clase === 'asesor') return `Carta de un asesor o demóscopo${c.cargo ? ` (${c.cargo})` : ''}. La persona no aparece: protagonizan las herramientas de su oficio.`;
  if (c.clase === 'escenario') return 'Carta de un lugar: el edificio o espacio es el protagonista, sin personas reconocibles.';
  return `Carta de ${CLASE_TXT[c.clase].toLowerCase()}: un objeto o una escena simbólica.`;
}

export function promptDe(c: Carta): string {
  return `${ESTILO} ${sujeto(c)} Escena: ${c.escena}. Paleta dominante: ${paleta(c)}. ${NORMAS} ${FORMATO}`;
}

const cartas = LISTA_CARTAS.filter((c) => !c.retirada);
const json = cartas.map((c) => ({
  id: c.id,
  archivo: archivo(c),
  nombre: c.nombre,
  clase: CLASE_TXT[c.clase],
  tipo: esPolitico(c) ? TIPO_INFO[c.tipo].nombre : null,
  partido: esPolitico(c) ? PARTIDOS[c.partido].siglas : null,
  rareza: RAREZA_NOMBRE[c.rareza],
  coleccion: c.coleccion,
  cargo: 'cargo' in c ? c.cargo ?? null : null,
  escena: c.escena,
  prompt: promptDe(c),
}));
writeFileSync('docs/cartas.json', JSON.stringify({ total: json.length, estilo: ESTILO, normas: NORMAS, formato: FORMATO, cartas: json }, null, 1) + '\n');

const md: string[] = [
  '# Ilustraciones: un prompt por carta',
  '',
  `**${cartas.length} cartas** (${cartas.filter((c) => c.coleccion === 'basica').length} de la colección Básica, ${cartas.filter((c) => c.coleccion === '29n').length} de la expansión 29N y ${cartas.filter((c) => c.coleccion === 'secreta').length} secretas). Generado con \`npm run prompts\`; la misma lista en formato máquina está en \`docs/cartas.json\`.`,
  '',
  '## Cómo se usan',
  '',
  '1. Genera la imagen con el prompt de la carta.',
  '2. Guárdala con el nombre exacto que se indica (p. ej. `N-001.png`; vale también `.jpg` o `.webp`) en la carpeta `ilustraciones/` del repositorio.',
  '3. `npm run ilustraciones` (o el build de Vercel, que lo hace solo) la recorta, la convierte a WebP y la carta la usa en lugar del arte generado.',
  '',
  '## Estilo común (repítelo en cada imagen)',
  '',
  `- ${ESTILO}`,
  `- ${NORMAS}`,
  `- ${FORMATO}`,
  '',
  'Las cartas de una misma persona (sus fases y su arte alternativo) deben parecer de la misma serie: mismo lugar u objeto, más grande o más épico en cada fase.',
];
let col = '';
for (const c of cartas) {
  if (c.coleccion !== col) {
    col = c.coleccion;
    md.push('', `## ${col === 'basica' ? 'Colección Básica' : col === '29n' ? 'Expansión 29N' : 'Secretas'}`, '');
  }
  const datos = [CLASE_TXT[c.clase], esPolitico(c) ? `${TIPO_INFO[c.tipo].nombre} · ${PARTIDOS[c.partido].siglas}` : null, RAREZA_NOMBRE[c.rareza], 'cargo' in c ? c.cargo : null].filter(Boolean).join(' · ');
  md.push(`### ${c.id} · ${c.nombre}`, '', `Archivo: \`${archivo(c)}\` · ${datos}`, '', `> ${promptDe(c)}`, '');
}
writeFileSync('docs/PROMPTS_IMAGENES.md', md.join('\n'));
console.log(`docs/PROMPTS_IMAGENES.md y docs/cartas.json: ${cartas.length} cartas`);
