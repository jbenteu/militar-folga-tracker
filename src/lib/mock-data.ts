
import { Military, Process, ProcessType, ProcessClass, Rank, AssignedMilitary, MilitaryFunction } from "@/types";
import { v4 as uuidv4 } from "uuid";

// Initial mock data for militaries
export const initialMilitaries: Military[] = [
  {
    id: uuidv4(),
    name: "João Silva",
    rank: "3º Sargento",
    branch: "Infantaria",
    degree: "Praça",
    squadron: "Base Adm",
    isActive: true,
    lastProcessDate: new Date("2023-12-15"),
    processHistory: {}
  },
  {
    id: uuidv4(),
    name: "Carlos Oliveira",
    rank: "2º Sargento",
    branch: "Cavalaria",
    degree: "Praça",
    squadron: "ECAp",
    isActive: true,
    lastProcessDate: new Date("2023-11-20"),
    processHistory: {}
  },
  {
    id: uuidv4(),
    name: "Antônio Santos",
    rank: "1º Sargento",
    branch: "Artilharia",
    degree: "Praça",
    squadron: "EHEG",
    isActive: true,
    lastProcessDate: new Date("2024-01-10"),
    processHistory: {}
  },
  {
    id: uuidv4(),
    name: "Pedro Costa",
    rank: "Aspirante a Oficial",
    branch: "Infantaria",
    degree: "Oficial",
    squadron: "EHRA",
    isActive: true,
    lastProcessDate: new Date("2024-02-01"),
    processHistory: {}
  },
  {
    id: uuidv4(),
    name: "Ricardo Souza",
    rank: "2º Tenente",
    branch: "Engenharia",
    degree: "Oficial",
    squadron: "EM",
    isActive: true,
    lastProcessDate: new Date("2023-10-05"),
    processHistory: {}
  },
  {
    id: uuidv4(),
    name: "Marcelo Pereira",
    rank: "1º Tenente",
    branch: "Comunicações",
    degree: "Oficial",
    squadron: "Base Adm",
    isActive: true,
    lastProcessDate: null,
    processHistory: {}
  },
  {
    id: uuidv4(),
    name: "Eduardo Lima",
    rank: "Capitão",
    branch: "Infantaria",
    degree: "Oficial",
    squadron: "ECAp",
    isActive: true,
    lastProcessDate: new Date("2023-09-15"),
    processHistory: {}
  },
  {
    id: uuidv4(),
    name: "Felipe Almeida",
    rank: "Major",
    branch: "Cavalaria",
    degree: "Oficial",
    squadron: "EHEG",
    isActive: true,
    lastProcessDate: new Date("2023-08-22"),
    processHistory: {}
  },
];

// Initial mock data for processes
export const initialProcesses: Process[] = [
  {
    id: uuidv4(),
    type: "TEAM",
    class: "Classe I - Subsistência",
    number: "001/2024",
    startDate: new Date("2024-01-10"),
    endDate: new Date("2024-01-15"),
    assignedMilitaries: [
      { militaryId: initialMilitaries[0].id, function: "Membro - Titular" },
      { militaryId: initialMilitaries[1].id, function: "Membro - Titular" },
      { militaryId: initialMilitaries[2].id, function: "Presidente - Titular" }
    ],
  },
  {
    id: uuidv4(),
    type: "PT",
    class: "Classe II - Intendência",
    number: "002/2024",
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-02-05"),
    assignedMilitaries: [
      { militaryId: initialMilitaries[3].id, function: "Presidente - Titular" }
    ],
  },
  {
    id: uuidv4(),
    type: "TREM",
    class: "Classe III - Óleos e Combustíveis",
    number: "003/2024",
    startDate: new Date("2024-02-20"),
    endDate: null,
    assignedMilitaries: [
      { militaryId: initialMilitaries[4].id, function: "Membro - Titular" },
      { militaryId: initialMilitaries[5].id, function: "Membro - Substituto" },
      { militaryId: initialMilitaries[6].id, function: "Presidente - Titular" }
    ],
  },
];
