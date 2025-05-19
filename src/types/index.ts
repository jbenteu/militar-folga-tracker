
export type Rank = 
  | '3º Sargento' 
  | '2º Sargento' 
  | '1º Sargento' 
  | 'Aspirante a Oficial' 
  | '2º Tenente' 
  | '1º Tenente' 
  | 'Capitão' 
  | 'Major';

export const RANKS_ORDER: Rank[] = [
  '3º Sargento',
  '2º Sargento',
  '1º Sargento',
  'Aspirante a Oficial',
  '2º Tenente',
  '1º Tenente',
  'Capitão',
  'Major'
];

export type ProcessType = 
  | 'TEAM' 
  | 'TREM' 
  | 'PT' 
  | 'Comissão de Conferência de Gêneros QR' 
  | 'Comissão de Conferência de Munição';

export interface Military {
  id: string;
  name: string;
  rank: Rank;
  branch: string; // Arma
  degree: string; // Grau
  lastProcessDate: Date | null;
}

export interface Process {
  id: string;
  type: ProcessType;
  class: string;
  number: string;
  startDate: Date;
  endDate: Date | null;
  assignedMilitaries: string[]; // Array of Military IDs
}

export interface MilitaryWithRestTime extends Military {
  restDays: number;
}
