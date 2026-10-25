// Banda sonora de 176 TCG: temas originales en clave de chiptune de consola portátil (dos canales de pulso,
// un triángulo para el bajo y ruido para la percusión). Notación: «nota:pasos», con pasos de semicorchea;
// «-» es silencio. En la percusión: k bombo, s caja, h charles.

export type Canal = 'pulso' | 'triangulo' | 'ruido';

export interface DefPista {
  canal: Canal;
  /** ciclo de trabajo del pulso: 0.125, 0.25 o 0.5 */
  ciclo?: number;
  vol: number;
  notas: string;
}

export interface DefTema {
  bpm: number;
  bucle: boolean;
  pistas: DefPista[];
}

/** Repite un fragmento n veces. */
const x = (n: number, s: string) => Array.from({ length: n }, () => s).join(' ');
/** Arpegio de semicorcheas: las notas del acorde en bucle durante un compás (16 pasos). */
const arp = (...notas: string[]) => Array.from({ length: 16 }, (_, i) => `${notas[i % notas.length]}:1`).join(' ');
/** Bajo de corcheas: fundamental, octava, quinta, octava, dos veces. */
const bajo = (raiz: string, octava: string, quinta: string) => x(2, `${raiz}:2 ${octava}:2 ${quinta}:2 ${octava}:2`);
/** Bajo de semicorcheas saltando de octava durante un compás. */
const octavas = (grave: string, aguda: string) => x(8, `${grave}:1 ${aguda}:1`);

export const TEMAS = {
  // ————————————————————————— portada y menús: alegre, Do mayor
  menu: {
    bpm: 118,
    bucle: true,
    pistas: [
      {
        canal: 'pulso', ciclo: 0.25, vol: 0.5, notas: [
          'E5:2 G5:2 C6:4 B5:2 G5:2 A5:4',
          'G5:2 E5:2 F5:2 G5:2 E5:4 C5:4',
          'D5:2 E5:2 F5:4 A5:2 G5:2 F5:4',
          'E5:2 D5:2 C5:2 D5:2 E5:8',
          'E5:2 G5:2 C6:4 D6:2 C6:2 B5:4',
          'A5:2 B5:2 C6:2 A5:2 G5:4 E5:4',
          'F5:2 A5:2 G5:2 F5:2 E5:2 D5:2 C5:2 D5:2',
          'C5:4 G4:2 C5:2 -:8',
        ].join(' '),
      },
      {
        canal: 'pulso', ciclo: 0.125, vol: 0.16, notas: [
          arp('C4', 'E4', 'G4', 'C5'), arp('A3', 'C4', 'E4', 'A4'), arp('F3', 'A3', 'C4', 'F4'), arp('G3', 'B3', 'D4', 'G4'),
          arp('C4', 'E4', 'G4', 'C5'), arp('A3', 'C4', 'E4', 'A4'), `${x(2, 'F3:1 A3:1 C4:1 F4:1')} ${x(2, 'G3:1 B3:1 D4:1 G4:1')}`, arp('C4', 'E4', 'G4', 'C5'),
        ].join(' '),
      },
      {
        canal: 'triangulo', vol: 0.55, notas: [
          bajo('C3', 'C4', 'G3'), bajo('A2', 'A3', 'E3'), bajo('F2', 'F3', 'C3'), bajo('G2', 'G3', 'D3'),
          bajo('C3', 'C4', 'G3'), bajo('A2', 'A3', 'E3'), 'F2:2 F3:2 C3:2 F3:2 G2:2 G3:2 D3:2 G3:2', bajo('C3', 'C4', 'G3'),
        ].join(' '),
      },
      { canal: 'ruido', vol: 0.3, notas: x(8, 'k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2') },
    ],
  },

  // ————————————————————————— partida: combate rápido en La menor
  combate: {
    bpm: 152,
    bucle: true,
    pistas: [
      {
        canal: 'pulso', ciclo: 0.25, vol: 0.48, notas: [
          'A4:2 C5:2 E5:2 A5:4 G5:2 E5:2 C5:2',
          'D5:2 E5:2 C5:2 B4:2 A4:6 -:2',
          'F5:2 E5:2 F5:2 A5:2 C6:4 A5:4',
          'G5:2 F5:2 E5:2 D5:2 B4:4 G4:4',
          'A4:2 C5:2 E5:2 A5:2 B5:2 C6:2 B5:2 A5:2',
          'G5:2 E5:2 D5:2 E5:2 C5:4 A4:4',
          'F5:3 E5:3 D5:2 C5:3 D5:3 E5:2',
          'E5:4 G#5:4 B5:4 E6:4',
        ].join(' '),
      },
      {
        canal: 'pulso', ciclo: 0.125, vol: 0.14, notas: [
          arp('A3', 'C4', 'E4', 'A4'), arp('A3', 'C4', 'E4', 'A4'), arp('F3', 'A3', 'C4', 'F4'), arp('G3', 'B3', 'D4', 'G4'),
          arp('A3', 'C4', 'E4', 'A4'), arp('A3', 'C4', 'E4', 'A4'), arp('F3', 'A3', 'C4', 'F4'), arp('E3', 'G#3', 'B3', 'E4'),
        ].join(' '),
      },
      {
        canal: 'triangulo', vol: 0.6, notas: [
          octavas('A2', 'A3'), octavas('A2', 'A3'), octavas('F2', 'F3'), octavas('G2', 'G3'),
          octavas('A2', 'A3'), octavas('A2', 'A3'), octavas('F2', 'F3'), octavas('E2', 'E3'),
        ].join(' '),
      },
      { canal: 'ruido', vol: 0.32, notas: x(8, 'k:2 h:2 s:2 h:2 k:1 k:1 h:2 s:2 h:2') },
    ],
  },

  // ————————————————————————— mapa de campaña: marcha de aventura en Sol mayor
  campana: {
    bpm: 108,
    bucle: true,
    pistas: [
      {
        canal: 'pulso', ciclo: 0.5, vol: 0.4, notas: [
          'G4:3 B4:1 D5:4 B4:2 D5:2 G5:4',
          'F#5:2 E5:2 D5:2 A4:2 D5:8',
          'E5:3 G5:1 B5:4 A5:2 G5:2 E5:4',
          'C5:2 E5:2 G5:2 E5:2 D5:4 B4:4',
          'G4:3 B4:1 D5:4 G5:2 A5:2 B5:4',
          'A5:2 F#5:2 D5:2 F#5:2 A5:8',
          'G5:2 E5:2 C5:2 E5:2 G5:4 E5:4',
          'D5:2 E5:2 F#5:2 A5:2 G5:8',
        ].join(' '),
      },
      {
        canal: 'pulso', ciclo: 0.125, vol: 0.13, notas: [
          x(2, 'B3:2 D4:2 G4:2 D4:2'), x(2, 'A3:2 D4:2 F#4:2 D4:2'), x(2, 'B3:2 E4:2 G4:2 E4:2'), x(2, 'C4:2 E4:2 G4:2 E4:2'),
          x(2, 'B3:2 D4:2 G4:2 D4:2'), x(2, 'A3:2 D4:2 F#4:2 D4:2'), x(2, 'C4:2 E4:2 G4:2 E4:2'), x(2, 'A3:2 D4:2 F#4:2 D4:2'),
        ].join(' '),
      },
      {
        canal: 'triangulo', vol: 0.55, notas: [
          'G2:4 D3:4 G2:4 D3:4', 'D3:4 A2:4 D3:4 A2:4', 'E2:4 B2:4 E2:4 B2:4', 'C3:4 G2:4 C3:4 G2:4',
          'G2:4 D3:4 G2:4 D3:4', 'D3:4 A2:4 D3:4 A2:4', 'C3:4 G2:4 C3:4 G2:4', 'D3:4 A2:4 D3:2 E3:2 F#3:4',
        ].join(' '),
      },
      { canal: 'ruido', vol: 0.26, notas: x(8, 'k:4 s:4 k:4 s:2 s:2') },
    ],
  },

  // ————————————————————————— sobres y álbum: tintineo de tienda en Fa mayor
  sobres: {
    bpm: 128,
    bucle: true,
    pistas: [
      {
        canal: 'pulso', ciclo: 0.125, vol: 0.38, notas: [
          'C6:2 A5:2 F5:2 A5:2 C6:4 -:4',
          'D6:2 A#5:2 G5:2 A#5:2 D6:4 -:4',
          'C6:2 A5:2 F5:2 A5:2 C6:2 D6:2 E6:2 F6:2',
          'E6:2 C6:2 G5:2 E5:2 F5:8',
        ].join(' '),
      },
      {
        canal: 'triangulo', vol: 0.5, notas: ['F2:4 C3:4 F3:4 C3:4', 'G2:4 D3:4 G3:4 A#2:4', 'F2:4 C3:4 A2:4 C3:4', 'C3:4 G2:4 F2:8'].join(' '),
      },
      { canal: 'ruido', vol: 0.18, notas: x(4, 'h:2 h:2 s:2 h:2 h:2 h:2 s:2 h:1 h:1') },
    ],
  },

  // ————————————————————————— fanfarrias
  victoria: {
    bpm: 150,
    bucle: false,
    pistas: [
      { canal: 'pulso', ciclo: 0.25, vol: 0.5, notas: 'G4:2 G4:2 G4:2 C5:6 E5:2 G5:2 C6:8 -:8 G5:2 A5:2 B5:2 C6:10 -:8' },
      { canal: 'pulso', ciclo: 0.125, vol: 0.2, notas: 'E4:2 E4:2 E4:2 G4:6 C5:2 E5:2 G5:8 -:8 D5:2 F5:2 G5:2 E5:10 -:8' },
      { canal: 'triangulo', vol: 0.55, notas: 'C3:6 C3:6 G2:4 C3:8 -:8 G2:6 C3:10 -:8' },
      { canal: 'ruido', vol: 0.3, notas: 'k:2 s:2 s:2 k:6 s:2 s:2 k:8 -:8 s:2 s:2 s:2 k:10 -:8' },
    ],
  },
  derrota: {
    bpm: 84,
    bucle: false,
    pistas: [
      { canal: 'pulso', ciclo: 0.5, vol: 0.4, notas: 'E5:4 D5:4 C5:4 B4:4 A4:6 G#4:2 A4:12 -:4' },
      { canal: 'triangulo', vol: 0.5, notas: 'A2:8 F2:8 E2:8 A2:12 -:4' },
    ],
  },
} satisfies Record<string, DefTema>;

export type TemaId = keyof typeof TEMAS;
