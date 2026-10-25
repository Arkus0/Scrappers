// Resumen de la colección (npm run cartas), listado completo en docs/CARTAS.md con --md
// y la lista de las cartas con su archivo de ilustración en docs/cartas.json con --json.
import { writeFileSync } from 'node:fs';
import { LISTA_CARTAS, esPolitico } from '../src/datos/catalogo';
import { PARTIDOS, TIPO_INFO } from '../src/datos/partidos';
import { CLASE_TXT, RAREZA_TXT } from '../src/ui/textos-carta';

const porCol: Record<string, number> = {};
const porClase: Record<string, number> = {};
const porTipo: Record<string, number> = {};
const porRareza: Record<string, number> = {};
for (const c of LISTA_CARTAS) {
  porCol[c.coleccion] = (porCol[c.coleccion] ?? 0) + 1;
  porClase[c.clase] = (porClase[c.clase] ?? 0) + 1;
  porRareza[c.rareza] = (porRareza[c.rareza] ?? 0) + 1;
  if (esPolitico(c)) porTipo[c.tipo] = (porTipo[c.tipo] ?? 0) + 1;
}
const personas = new Set(LISTA_CARTAS.map((c) => c.persona).filter(Boolean)).size;
const shiny = LISTA_CARTAS.filter((c) => c.persona).length;
console.log({ total: LISTA_CARTAS.length, porCol, porClase, porTipo, porRareza, personas, variantesShiny: shiny });

if (process.argv.includes('--md')) {
  const filas: string[] = ['# Listado de cartas', '', `${LISTA_CARTAS.length} cartas (${personas} personas reales, ${shiny} con versión Shiny). Generado con \`npm run cartas -- --md\`.`, ''];
  let col = '';
  for (const c of LISTA_CARTAS) {
    if (c.coleccion !== col) {
      col = c.coleccion;
      filas.push('', `## ${col === 'basica' ? 'Colección Básica' : col === '29n' ? 'Expansión 29N' : 'Secretas'}`, '', '| Nº | Carta | Clase | Rareza | Datos | Texto |', '|---|---|---|---|---|---|');
    }
    const datos = esPolitico(c)
      ? `${TIPO_INFO[c.tipo].nombre}${c.tipo2 ? `/${TIPO_INFO[c.tipo2].nombre}` : ''} · ${PARTIDOS[c.partido].siglas} · ${c.fase === 'basico' ? 'Básico' : c.fase === 'fase1' ? 'Fase 1' : 'Fase 2'} · AG ${c.aguante}${c.cl ? ' · CL' : ''}`
      : c.clase === 'tertuliano' ? `Audiencia ${c.audiencia}${c.presentador ? ' · presentador' : ''} · ${c.linea}` : '';
    const texto = esPolitico(c)
      ? [c.carisma ? `**${c.carisma.nombre}**: ${c.carisma.texto}` : '', ...c.acciones.map((a) => `**${a.nombre}** (${a.coste.map((t) => TIPO_INFO[t].simbolo).join('')}) ${a.danoTxt ?? a.dano}${a.texto ? `: ${a.texto}` : ''}`)].filter(Boolean).join('<br>')
      : c.texto ?? '';
    filas.push(`| ${c.id} | ${c.nombre}${c.cargo ? `<br><small>${c.cargo}</small>` : ''} | ${CLASE_TXT[c.clase]} | ${RAREZA_TXT[c.rareza]} | ${datos} | ${texto.replace(/\|/g, '/')} |`);
  }
  writeFileSync('docs/CARTAS.md', filas.join('\n') + '\n');
  console.log('docs/CARTAS.md escrito');
}

if (process.argv.includes('--json')) {
  const cartas = LISTA_CARTAS.filter((c) => !c.retirada).map((c) => ({
    id: c.id,
    archivo: `${c.id}.png`,
    nombre: c.nombre,
    clase: CLASE_TXT[c.clase],
    tipo: esPolitico(c) ? TIPO_INFO[c.tipo].nombre : null,
    partido: esPolitico(c) ? PARTIDOS[c.partido].siglas : null,
    rareza: c.rareza,
    coleccion: c.coleccion,
    cargo: c.cargo ?? null,
  }));
  writeFileSync('docs/cartas.json', JSON.stringify({ total: cartas.length, cartas }, null, 1) + '\n');
  console.log(`docs/cartas.json escrito: ${cartas.length} cartas`);
}
