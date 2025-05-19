
import { Military, Process, ProcessType, Rank } from "@/types";
import { v4 as uuidv4 } from "uuid";

// Initial mock data for militaries
export const initialMilitaries: Military[] = [
  {
    id: uuidv4(),
    name: "João Silva",
    rank: "3º Sargento",
    branch: "Infantaria",
    degree: "Superior",
    lastProcessDate: new Date("2023-12-15"),
  },
  {
    id: uuidv4(),
    name: "Carlos Oliveira",
    rank: "2º Sargento",
    branch: "Cavalaria",
    degree: "Técnico",
    lastProcessDate: new Date("2023-11-20"),
  },
  {
    id: uuidv4(),
    name: "Antônio Santos",
    rank: "1º Sargento",
    branch: "Artilharia",
    degree: "Superior",
    lastProcessDate: new Date("2024-01-10"),
  },
  {
    id: uuidv4(),
    name: "Pedro Costa",
    rank: "Aspirante a Oficial",
    branch: "Infantaria",
    degree: "Superior",
    lastProcessDate: new Date("2024-02-01"),
  },
  {
    id: uuidv4(),
    name: "Ricardo Souza",
    rank: "2º Tenente",
    branch: "Engenharia",
    degree: "Superior",
    lastProcessDate: new Date("2023-10-05"),
  },
  {
    id: uuidv4(),
    name: "Marcelo Pereira",
    rank: "1º Tenente",
    branch: "Comunicações",
    degree: "Superior",
    lastProcessDate: null,
  },
  {
    id: uuidv4(),
    name: "Eduardo Lima",
    rank: "Capitão",
    branch: "Infantaria",
    degree: "Superior",
    lastProcessDate: new Date("2023-09-15"),
  },
  {
    id: uuidv4(),
    name: "Felipe Almeida",
    rank: "Major",
    branch: "Cavalaria",
    degree: "Superior",
    lastProcessDate: new Date("2023-08-22"),
  },
];

// Initial mock data for processes
export const initialProcesses: Process[] = [
  {
    id: uuidv4(),
    type: "TEAM",
    class: "A-01",
    number: "001/2024",
    startDate: new Date("2024-01-10"),
    endDate: new Date("2024-01-15"),
    assignedMilitaries: [initialMilitaries[0].id, initialMilitaries[1].id, initialMilitaries[2].id],
  },
  {
    id: uuidv4(),
    type: "PT",
    class: "B-02",
    number: "002/2024",
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-02-05"),
    assignedMilitaries: [initialMilitaries[3].id],
  },
  {
    id: uuidv4(),
    type: "TREM",
    class: "C-03",
    number: "003/2024",
    startDate: new Date("2024-02-20"),
    endDate: null,
    assignedMilitaries: [initialMilitaries[4].id, initialMilitaries[5].id, initialMilitaries[6].id],
  },
];
