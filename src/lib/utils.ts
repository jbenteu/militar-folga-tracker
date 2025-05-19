
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Military, MilitaryWithRestTime, RANKS_ORDER, Rank } from "@/types"

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

export function sortMilitariesByRankAndRestTime(militaries: MilitaryWithRestTime[]): MilitaryWithRestTime[] {
  return [...militaries].sort((a, b) => {
    // First sort by rank (lower rank first)
    const rankCompare = RANKS_ORDER.indexOf(a.rank) - RANKS_ORDER.indexOf(b.rank);
    if (rankCompare !== 0) return rankCompare;
    
    // Then by rest time (more rest time first)
    return b.restDays - a.restDays;
  });
}

export function compareRanks(rank1: Rank, rank2: Rank): number {
  return RANKS_ORDER.indexOf(rank1) - RANKS_ORDER.indexOf(rank2);
}

export function getProcessMinMilitaries(processType: string): number {
  return processType === 'PT' ? 1 : 3;
}

export function addMilitaryWithRestTime(militaries: Military[]): MilitaryWithRestTime[] {
  return militaries.map(military => ({
    ...military,
    restDays: calculateRestDays(military.lastProcessDate)
  }));
}

export function generateUniqueProcessNumber(): string {
  const currentYear = new Date().getFullYear();
  const randomNumber = Math.floor(Math.random() * 900) + 100; // 3-digit random number
  return `${randomNumber}/${currentYear}`;
}
