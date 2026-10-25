// Las 52 circunscripciones del Congreso con sus escaños de 2026 (RD 806/2026: Madrid 38 y Cádiz 8) y su zona.
// Datos tomados de «176 · La Batalla del 29N» (src/data/provincias.ts y base.json).
export type ZonaId = 'AND' | 'CAT' | 'MAD' | 'LEV' | 'INT' | 'NOR' | 'CAN';

export interface Provincia {
  id: string;
  nombre: string;
  corto: string;
  zona: ZonaId;
  escanos: number;
  vecinos: string[];
}

export const ZONAS: Record<ZonaId, { nombre: string; color: string }> = {
  AND: { nombre: 'Andalucía', color: '#c9a227' },
  CAT: { nombre: 'Cataluña', color: '#d9822b' },
  MAD: { nombre: 'Madrid y Centro', color: '#8e6fc1' },
  LEV: { nombre: 'Levante y Baleares', color: '#2a9d8f' },
  INT: { nombre: 'Interior', color: '#a26b4f' },
  NOR: { nombre: 'Cornisa Norte', color: '#4f8fbf' },
  CAN: { nombre: 'Canarias, Ceuta y Melilla', color: '#c46a8a' },
};

type Fila = [id: string, nombre: string, corto: string, zona: ZonaId, escanos: number, vecinos: string[]];
const FILAS: Fila[] = [
  ['15', "A Coruña", "A Coruña", 'NOR', 8, ["27", "36"]],
  ['03', "Alacant/Alicante", "Alicante", 'LEV', 12, ["02", "30", "46"]],
  ['02', "Albacete", "Albacete", 'MAD', 4, ["03", "13", "16", "18", "23", "30", "46"]],
  ['04', "Almería", "Almería", 'AND', 6, ["18", "30"]],
  ['01', "Araba/Álava", "Álava", 'NOR', 4, ["09", "20", "26", "31", "48"]],
  ['33', "Asturias", "Asturias", 'NOR', 7, ["24", "27", "39"]],
  ['06', "Badajoz", "Badajoz", 'MAD', 5, ["10", "13", "14", "21", "41", "45"]],
  ['08', "Barcelona", "Barcelona", 'CAT', 32, ["17", "25", "43"]],
  ['48', "Bizkaia", "Bizkaia", 'NOR', 8, ["09", "20", "39", "01"]],
  ['09', "Burgos", "Burgos", 'INT', 4, ["26", "34", "39", "40", "42", "47", "48", "01"]],
  ['39', "Cantabria", "Cantabria", 'NOR', 5, ["09", "24", "33", "34", "48"]],
  ['12', "Castelló/Castellón", "Castellón", 'LEV', 5, ["43", "44", "46"]],
  ['51', "Ceuta", "Ceuta", 'CAN', 1, []],
  ['13', "Ciudad Real", "C. Real", 'MAD', 5, ["02", "06", "14", "16", "23", "45"]],
  ['16', "Cuenca", "Cuenca", 'MAD', 3, ["02", "13", "19", "28", "44", "45", "46"]],
  ['10', "Cáceres", "Cáceres", 'MAD', 4, ["05", "06", "37", "45"]],
  ['11', "Cádiz", "Cádiz", 'AND', 8, ["21", "29", "41"]],
  ['14', "Córdoba", "Córdoba", 'AND', 6, ["06", "13", "18", "23", "29", "41"]],
  ['20', "Gipuzkoa", "Gipuzkoa", 'NOR', 6, ["31", "48", "01"]],
  ['17', "Girona", "Girona", 'CAT', 6, ["08", "25"]],
  ['18', "Granada", "Granada", 'AND', 7, ["02", "04", "14", "23", "29", "30"]],
  ['19', "Guadalajara", "Guadalajara", 'MAD', 3, ["16", "28", "40", "42", "44", "50"]],
  ['21', "Huelva", "Huelva", 'AND', 5, ["06", "11", "41"]],
  ['22', "Huesca", "Huesca", 'INT', 3, ["25", "31", "50"]],
  ['07', "Illes Balears", "Baleares", 'LEV', 8, []],
  ['23', "Jaén", "Jaén", 'AND', 5, ["02", "13", "14", "18"]],
  ['26', "La Rioja", "La Rioja", 'INT', 4, ["09", "31", "42", "50", "01"]],
  ['35', "Las Palmas", "Las Palmas", 'CAN', 8, []],
  ['24', "León", "León", 'INT', 4, ["27", "32", "33", "34", "39", "47", "49"]],
  ['25', "Lleida", "Lleida", 'CAT', 4, ["08", "17", "22", "43", "50"]],
  ['27', "Lugo", "Lugo", 'NOR', 4, ["15", "24", "32", "33", "36"]],
  ['28', "Madrid", "Madrid", 'MAD', 38, ["05", "16", "19", "40", "45"]],
  ['52', "Melilla", "Melilla", 'CAN', 1, []],
  ['30', "Murcia", "Murcia", 'LEV', 10, ["02", "03", "04", "18"]],
  ['29', "Málaga", "Málaga", 'AND', 11, ["11", "14", "18", "41"]],
  ['31', "Navarra", "Navarra", 'NOR', 5, ["20", "22", "26", "50", "01"]],
  ['32', "Ourense", "Ourense", 'NOR', 4, ["24", "27", "36", "49"]],
  ['34', "Palencia", "Palencia", 'INT', 3, ["09", "24", "39", "47"]],
  ['36', "Pontevedra", "Pontevedra", 'NOR', 7, ["15", "27", "32"]],
  ['37', "Salamanca", "Salamanca", 'INT', 4, ["05", "10", "47", "49"]],
  ['38', "Santa Cruz de Tenerife", "S.C. Tenerife", 'CAN', 7, []],
  ['40', "Segovia", "Segovia", 'INT', 3, ["05", "09", "19", "28", "42", "47"]],
  ['41', "Sevilla", "Sevilla", 'AND', 12, ["06", "11", "14", "21", "29"]],
  ['42', "Soria", "Soria", 'INT', 2, ["09", "19", "26", "40", "50"]],
  ['43', "Tarragona", "Tarragona", 'CAT', 6, ["08", "12", "25", "44", "50"]],
  ['44', "Teruel", "Teruel", 'INT', 3, ["12", "16", "19", "43", "46", "50"]],
  ['45', "Toledo", "Toledo", 'MAD', 6, ["05", "06", "10", "13", "16", "28"]],
  ['47', "Valladolid", "Valladolid", 'INT', 5, ["05", "09", "24", "34", "37", "40", "49"]],
  ['46', "València/Valencia", "Valencia", 'LEV', 16, ["02", "03", "12", "16", "44"]],
  ['49', "Zamora", "Zamora", 'INT', 3, ["24", "32", "37", "47"]],
  ['50', "Zaragoza", "Zaragoza", 'INT', 7, ["19", "22", "25", "26", "31", "42", "43", "44"]],
  ['05', "Ávila", "Ávila", 'INT', 3, ["10", "28", "37", "40", "45", "47"]],
];

export const PROVINCIAS: Provincia[] = FILAS.map(([id, nombre, corto, zona, escanos, vecinos]) => ({ id, nombre, corto, zona, escanos, vecinos }));
export const PROV: Record<string, Provincia> = Object.fromEntries(PROVINCIAS.map((p) => [p.id, p]));
export const TOTAL_ESCANOS = PROVINCIAS.reduce((s, p) => s + p.escanos, 0);
