
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

export type MilitaryGrade = 'Oficial' | 'Praça';

export function getRankGrade(rank: Rank): MilitaryGrade {
  const officerRanks = [
    'Aspirante a Oficial',
    '2º Tenente',
    '1º Tenente',
    'Capitão',
    'Major'
  ];
  
  return officerRanks.includes(rank) ? 'Oficial' : 'Praça';
}

export type MilitaryFunction = 
  | 'Membro - Titular' 
  | 'Membro - Substituto' 
  | 'Presidente - Titular' 
  | 'Presidente - Substituto'
  | 'Membro'
  | 'Presidente'
  | 'Assessor Técnico';

export type ProcessType = 
  | 'TEAM' 
  | 'TREM' 
  | 'PT' 
  | 'Comissão de Conferência de Gêneros QR' 
  | 'Comissão de Conferência de Munição';

export type ProcessClass = 
  | 'Classe I - Subsistência'
  | 'Classe II - Intendência'
  | 'Classe III - Óleos e Combustíveis'
  | 'Classe IV - Patrimônio'
  | 'Classe V - Armamento e Munição'
  | 'Classe VI - Engenharia'
  | 'Classe VII - Comunicações'
  | 'Classe VIII - Saúde'
  | 'Classe IX - Motomecanização ou Aviação'
  | 'Classe X - Diversos';

export const PROCESS_CLASSES: ProcessClass[] = [
  'Classe I - Subsistência',
  'Classe II - Intendência',
  'Classe III - Óleos e Combustíveis',
  'Classe IV - Patrimônio',
  'Classe V - Armamento e Munição',
  'Classe VI - Engenharia',
  'Classe VII - Comunicações',
  'Classe VIII - Saúde',
  'Classe IX - Motomecanização ou Aviação',
  'Classe X - Diversos'
];

export interface Military {
  id: string;
  name: string;
  rank: Rank;
  branch: string; // Arma
  degree: MilitaryGrade;
  squadron: string;
  warName?: string;
  formationYear?: number;
  isActive: boolean;
  lastProcessDate: Date | null;
  processHistory: Record<string, Date | null>;
}

export interface AssignedMilitary {
  militaryId: string;
  function: MilitaryFunction;
}

export interface Process {
  id: string;
  type: ProcessType;
  class: ProcessClass;
  number: string;
  startDate: Date;
  endDate: Date | null;
  assignedMilitaries: AssignedMilitary[];
}

export interface MilitaryWithRestTime extends Military {
  restDays: number;
  restDaysForProcessType?: number;
}

export const getProcessMinMilitaries = (processType: ProcessType): number => {
  switch (processType) {
    case "Comissão de Conferência de Gêneros QR":
      return 6; // Exactly 6 militaries
    case "Comissão de Conferência de Munição":
      return 3; // 3 or more militaries
    case "TEAM":
      return 3; // 3 or more militaries
    case "TREM":
      return 3; // 3 or more militaries
    case "PT":
      return 1; // 1 or more militaries
    default:
      return 3;
  }
};
