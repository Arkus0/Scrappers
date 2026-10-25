// Mazos temáticos: uno por arquetipo. La IA los juega en la campaña y se pueden conseguir.
import type { DefMazo } from '../motor/mazo';

export interface MazoTematico extends DefMazo {
  id: string;
  arquetipo: string;
  descripcion: string;
}

export const MAZOS_TEMATICOS: MazoTematico[] = [];
