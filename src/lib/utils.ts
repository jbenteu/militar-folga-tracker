import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Military, MilitaryWithRestTime, ProcessType, RANKS_ORDER, Rank, MilitaryGrade } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | null): string {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

export function calculateRestDays(lastProcessDate: Date | null): number {
  if (!lastProcessDate) return 365; // If never participated, give maximum "rest" time
  
  const today = new Date();
  const diffTime = today.getTime() - lastProcessDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

export function getRestTimeClass(days: number): string {
  if (days >= 90) return 'rest-time-high';
  if (days >= 30) return 'rest-time-medium';
  return 'rest-time-low';
}

export function sortMilitariesByRankAndRestTime(militaries: MilitaryWithRestTime[], restTimeProperty: 'restDays' | 'restDaysForProcessType' = 'restDays'): MilitaryWithRestTime[] {
  return [...militaries].sort((a, b) => {
    // First sort by rank (lower rank first)
    const rankCompare = RANKS_ORDER.indexOf(a.rank) - RANKS_ORDER.indexOf(b.rank);
    if (rankCompare !== 0) return rankCompare;
    
    // Then by rest time (more rest time first)
    const aRestDays = restTimeProperty === 'restDaysForProcessType' && a.restDaysForProcessType !== undefined 
      ? a.restDaysForProcessType 
      : a.restDays;
      
    const bRestDays = restTimeProperty === 'restDaysForProcessType' && b.restDaysForProcessType !== undefined 
      ? b.restDaysForProcessType 
      : b.restDays;
      
    return bRestDays - aRestDays;
  });
}

export function compareRanks(rank1: Rank, rank2: Rank): number {
  return RANKS_ORDER.indexOf(rank1) - RANKS_ORDER.indexOf(rank2);
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

export function addMilitaryWithRestTime(militaries: Military[]): MilitaryWithRestTime[] {
  return militaries.map(military => ({
    ...military,
    restDays: calculateRestDays(military.lastProcessDate)
  }));
}

export function generateUniqueProcessNumber(processType?: ProcessType): string {
  // For special process types, return empty string so user can input manually
  if (processType === "TEAM" || processType === "TREM" || processType === "PT") {
    return "";
  }
  
  const currentYear = new Date().getFullYear();
  const randomNumber = Math.floor(Math.random() * 900) + 100; // 3-digit random number
  return `${randomNumber}/${currentYear}`;
}

// Function to parse CSV data for military import
export function parseCSVForMilitaries(csvText: string): Omit<Military, 'id' | 'lastProcessDate' | 'processHistory'>[] {
  const rows = csvText.trim().split('\n');
  const militaries: Omit<Military, 'id' | 'lastProcessDate' | 'processHistory'>[] = [];
  
  // Skip the header row if it exists
  const startRow = rows[0].includes('Nome') || rows[0].includes('Posto') ? 1 : 0;
  
  for (let i = startRow; i < rows.length; i++) {
    const cols = rows[i].split(',');
    if (cols.length >= 4) {
      const name = cols[0].trim();
      const rank = cols[1].trim() as Rank;
      const branch = cols[2].trim();
      const squadron = cols[3].trim();
      
      if (name && rank && branch && squadron && RANKS_ORDER.includes(rank)) {
        const degree = ['Aspirante a Oficial', '2º Tenente', '1º Tenente', 'Capitão', 'Major'].includes(rank) ? 'Oficial' : 'Praça';
        
        militaries.push({
          name,
          rank,
          branch,
          degree: degree as MilitaryGrade,
          squadron,
          isActive: true
        });
      }
    }
  }
  
  return militaries;
}
