import React, { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { Military, MilitaryWithRestTime, Process, ProcessType, AssignedMilitary, MilitaryFunction, Rank, ProcessClass, MilitaryGrade, RANKS_ORDER, getRankGrade } from '@/types';
import { calculateRestDays } from '@/lib/utils';
import { toast } from 'sonner';

interface DataContextType {
  militaries: Military[];
  processes: Process[];
  loading: boolean;
  addMilitary: (military: Omit<Military, 'id' | 'processHistory'>) => Promise<void>;
  updateMilitary: (military: Military) => Promise<void>;
  deleteMilitary: (id: string) => Promise<void>;
  addProcess: (process: Omit<Process, 'id'>) => Promise<void>;
  updateProcess: (process: Process) => Promise<void>;
  deleteProcess: (id: string) => Promise<void>;
  getMilitariesWithRestTime: (processType?: ProcessType) => MilitaryWithRestTime[];
  getMilitaryById: (id: string) => Military | undefined;
  getProcessById: (id: string) => Process | undefined;
  getProcessesByType: (type: ProcessType) => Process[];
  addMilitariesFromCSV: (militaries: Omit<Military, 'id' | 'lastProcessDate' | 'processHistory'>[]) => Promise<void>;
  synchronizeProcessHistory: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Base URL for edge functions
const FUNCTIONS_URL = 'https://tghmaigxcrnhyjzvjpvc.supabase.co/functions/v1';

// Helper functions for API calls
const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${FUNCTIONS_URL}${endpoint}`;
  console.log('Making request to:', url);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnaG1haWd4Y3JuaHlqenZqcHZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MjM5MTAsImV4cCI6MjA2NDA5OTkxMH0.aE3SFUMpAeySqbSayZ4n7XjyoV3XSvr1GoKbP2G-voU`,
      ...options.headers,
    },
  });

  console.log('Response status:', response.status);
  console.log('Response ok:', response.ok);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Request failed with response:', errorText);
    let errorMessage;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || 'Request failed';
    } catch {
      errorMessage = errorText || 'Request failed';
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

// Helper functions for safe type conversion
const convertProcessHistory = (processHistory: any): Record<string, Date | null> => {
  if (!processHistory || typeof processHistory !== 'object') {
    return {};
  }
  
  const result: Record<string, Date | null> = {};
  Object.entries(processHistory).forEach(([key, value]) => {
    if (typeof value === 'string') {
      result[key] = new Date(value);
    } else {
      result[key] = null;
    }
  });
  return result;
};

const convertAssignedMilitaries = (assignedMilitaries: any): AssignedMilitary[] => {
  if (!Array.isArray(assignedMilitaries)) {
    return [];
  }
  
  return assignedMilitaries.filter((item): item is AssignedMilitary => {
    return item && 
           typeof item === 'object' && 
           typeof item.militaryId === 'string' && 
           typeof item.function === 'string';
  });
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [militaries, setMilitaries] = useState<Military[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('DataProvider initialized');

  // Load data from edge functions on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading data from edge functions...');
      
      // Load militaries
      const militariesData = await makeRequest('/militaries');
      const transformedMilitaries: Military[] = militariesData.map((m: any) => ({
        id: m.id,
        name: m.name,
        rank: m.rank as Rank,
        branch: m.branch,
        degree: getRankGrade(m.rank as Rank),
        squadron: m.squadron,
        warName: m.war_name,
        formationYear: m.formation_year,
        isActive: m.is_active ?? true,
        lastProcessDate: m.last_process_date ? new Date(m.last_process_date) : null,
        processHistory: convertProcessHistory(m.process_history)
      }));
      setMilitaries(transformedMilitaries);
      console.log('Militaries loaded:', transformedMilitaries.length);

      // Load processes
      const processesData = await makeRequest('/processes');
      const transformedProcesses: Process[] = processesData.map((p: any) => ({
        id: p.id,
        type: p.type as ProcessType,
        class: (p.description || 'Classe I - Subsistência') as ProcessClass,
        number: p.number,
        startDate: new Date(p.start_date),
        endDate: p.end_date ? new Date(p.end_date) : null,
        assignedMilitaries: convertAssignedMilitaries(p.assigned_militaries)
      }));
      setProcesses(transformedProcesses);
      console.log('Processes loaded:', transformedProcesses.length);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao conectar com o banco de dados');
    } finally {
      setLoading(false);
      console.log('Data loading completed');
    }
  };

  // Function to synchronize process history using edge function
  const synchronizeProcessHistory = async () => {
    try {
      console.log('Starting process history synchronization...');
      
      const result = await makeRequest('/sync-history', {
        method: 'POST'
      });

      if (result.updatedCount > 0) {
        toast.success(`Histórico de processos sincronizado para ${result.updatedCount} militares`);
        // Reload data to reflect changes
        await loadData();
      } else {
        toast.info('Todos os históricos já estão sincronizados');
      }
      
      console.log('Process history synchronization completed');
    } catch (error) {
      console.error('Error synchronizing process history:', error);
      toast.error('Erro ao sincronizar histórico de processos');
    }
  };

  // Military CRUD operations using edge functions
  const addMilitary = async (military: Omit<Military, 'id' | 'processHistory'>) => {
    try {
      const militaryData = {
        name: military.name,
        rank: military.rank,
        branch: military.branch,
        degree: military.degree,
        squadron: military.squadron,
        war_name: military.warName || null,
        formation_year: military.formationYear || null,
        is_active: military.isActive,
        last_process_date: military.lastProcessDate?.toISOString() || null,
        process_history: {}
      };

      const data = await makeRequest('/militaries', {
        method: 'POST',
        body: JSON.stringify(militaryData)
      });

      const newMilitary: Military = {
        id: data.id,
        name: data.name,
        rank: data.rank as Rank,
        branch: data.branch,
        degree: getRankGrade(data.rank as Rank),
        squadron: data.squadron,
        warName: data.war_name,
        formationYear: data.formation_year,
        isActive: data.is_active ?? true,
        lastProcessDate: data.last_process_date ? new Date(data.last_process_date) : null,
        processHistory: convertProcessHistory(data.process_history)
      };
      
      setMilitaries(prev => [...prev, newMilitary]);
      toast.success(`Militar ${military.name} adicionado com sucesso`);
    } catch (error) {
      console.error('Error adding military:', error);
      toast.error('Erro ao adicionar militar');
    }
  };

  const addMilitariesFromCSV = async (newMilitaries: Omit<Military, 'id' | 'lastProcessDate' | 'processHistory'>[]) => {
    try {
      const militariesToInsert = newMilitaries.map(m => ({
        name: m.name,
        rank: m.rank,
        branch: m.branch,
        degree: m.degree,
        squadron: m.squadron,
        war_name: m.warName || null,
        formation_year: m.formationYear || null,
        is_active: m.isActive,
        last_process_date: null,
        process_history: {}
      }));

      const data = await makeRequest('/militaries', {
        method: 'POST',
        body: JSON.stringify(militariesToInsert)
      });

      const transformedMilitaries: Military[] = data.map((m: any) => ({
        id: m.id,
        name: m.name,
        rank: m.rank as Rank,
        branch: m.branch,
        degree: getRankGrade(m.rank as Rank),
        squadron: m.squadron,
        warName: m.war_name,
        formationYear: m.formation_year,
        isActive: m.is_active ?? true,
        lastProcessDate: m.last_process_date ? new Date(m.last_process_date) : null,
        processHistory: convertProcessHistory(m.process_history)
      }));
      
      setMilitaries(prev => [...prev, ...transformedMilitaries]);
      toast.success(`${data.length} militares importados com sucesso`);
    } catch (error) {
      console.error('Error importing militaries:', error);
      toast.error('Erro ao importar militares');
    }
  };

  const updateMilitary = async (updatedMilitary: Military) => {
    try {
      const processHistoryForStorage: Record<string, string | null> = {};
      Object.entries(updatedMilitary.processHistory).forEach(([key, value]) => {
        processHistoryForStorage[key] = value ? value.toISOString() : null;
      });

      const militaryData = {
        name: updatedMilitary.name,
        rank: updatedMilitary.rank,
        branch: updatedMilitary.branch,
        degree: updatedMilitary.degree,
        squadron: updatedMilitary.squadron,
        war_name: updatedMilitary.warName || null,
        formation_year: updatedMilitary.formationYear || null,
        is_active: updatedMilitary.isActive,
        last_process_date: updatedMilitary.lastProcessDate?.toISOString() || null,
        process_history: processHistoryForStorage
      };

      await makeRequest(`/militaries?id=${updatedMilitary.id}`, {
        method: 'PUT',
        body: JSON.stringify(militaryData)
      });

      setMilitaries(prev => prev.map(m => 
        m.id === updatedMilitary.id ? updatedMilitary : m
      ));
      toast.success(`Dados do militar ${updatedMilitary.name} atualizados`);
    } catch (error) {
      console.error('Error updating military:', error);
      toast.error('Erro ao atualizar militar');
    }
  };

  const deleteMilitary = async (id: string) => {
    try {
      console.log('Attempting to delete military:', id);
      
      const militaryToDelete = militaries.find(m => m.id === id);
      if (!militaryToDelete) {
        toast.error("Militar não encontrado");
        return;
      }

      console.log(`Calling delete endpoint for military: ${militaryToDelete.name}`);
      
      const result = await makeRequest(`/militaries?id=${id}`, {
        method: 'DELETE'
      });

      console.log('Delete result:', result);

      setMilitaries(prev => prev.filter(m => m.id !== id));
      toast.success(`Militar ${militaryToDelete.name} removido com sucesso`);
      
    } catch (error) {
      console.error('Error deleting military:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao excluir militar';
      toast.error(errorMessage);
    }
  };

  // Process CRUD operations using edge functions
  const addProcess = async (process: Omit<Process, 'id'>) => {
    try {
      console.log('Adding process:', process);
      
      const processData = {
        type: process.type,
        description: process.class,
        number: process.number,
        start_date: process.startDate.toISOString(),
        end_date: process.endDate?.toISOString() || null,
        assigned_militaries: process.assignedMilitaries
      };

      const data = await makeRequest('/processes', {
        method: 'POST',
        body: JSON.stringify(processData)
      });

      const newProcess: Process = {
        id: data.id,
        type: data.type as ProcessType,
        class: (data.description || 'Classe I - Subsistência') as ProcessClass,
        number: data.number,
        startDate: new Date(data.start_date),
        endDate: data.end_date ? new Date(data.end_date) : null,
        assignedMilitaries: convertAssignedMilitaries(data.assigned_militaries)
      };
      
      setProcesses(prev => [...prev, newProcess]);
      
      // Reload militaries to get updated process history
      await loadData();
      
      toast.success("Processo adicionado com sucesso");
    } catch (error) {
      console.error('Error adding process:', error);
      toast.error('Erro ao adicionar processo');
    }
  };

  const updateProcess = async (updatedProcess: Process) => {
    try {
      const processData = {
        type: updatedProcess.type,
        description: updatedProcess.class,
        number: updatedProcess.number,
        start_date: updatedProcess.startDate.toISOString(),
        end_date: updatedProcess.endDate?.toISOString() || null,
        assigned_militaries: updatedProcess.assignedMilitaries
      };

      await makeRequest(`/processes?id=${updatedProcess.id}`, {
        method: 'PUT',
        body: JSON.stringify(processData)
      });

      setProcesses(prev => prev.map(p => 
        p.id === updatedProcess.id ? updatedProcess : p
      ));
      
      toast.success("Processo atualizado com sucesso");
    } catch (error) {
      console.error('Error updating process:', error);
      toast.error('Erro ao atualizar processo');
    }
  };

  const deleteProcess = async (id: string) => {
    try {
      console.log('Deleting process:', id);
      
      await makeRequest(`/processes?id=${id}`, {
        method: 'DELETE'
      });

      setProcesses(prev => prev.filter(p => p.id !== id));
      
      // Reload militaries to get updated process history
      await loadData();

      toast.success("Processo removido e folgas restauradas com sucesso");
    } catch (error) {
      console.error('Error deleting process:', error);
      toast.error('Erro ao excluir processo');
    }
  };

  // Helper functions
  const getMilitariesWithRestTime = (processType?: ProcessType): MilitaryWithRestTime[] => {
    return militaries
      .filter(military => military.isActive) // Only show active militaries
      .map(military => {
        const generalRestDays = calculateRestDays(military.lastProcessDate);
        let processTypeRestDays = generalRestDays;
        
        if (processType && military.processHistory) {
          // Check for shared rest days for TEAM, TREM, and PT processes
          if (processType === "TEAM" || processType === "TREM" || processType === "PT") {
            const teamDate = military.processHistory["TEAM"];
            const tremDate = military.processHistory["TREM"];
            const ptDate = military.processHistory["PT"];
            
            // Use the most recent date among TEAM, TREM, and PT
            let mostRecentDate = null;
            if (teamDate && tremDate && ptDate) {
              mostRecentDate = new Date(Math.max(teamDate.getTime(), tremDate.getTime(), ptDate.getTime()));
            } else if (teamDate && tremDate) {
              mostRecentDate = teamDate > tremDate ? teamDate : tremDate;
            } else if (teamDate && ptDate) {
              mostRecentDate = teamDate > ptDate ? teamDate : ptDate;
            } else if (tremDate && ptDate) {
              mostRecentDate = tremDate > ptDate ? tremDate : ptDate;
            } else if (teamDate) {
              mostRecentDate = teamDate;
            } else if (tremDate) {
              mostRecentDate = tremDate;
            } else if (ptDate) {
              mostRecentDate = ptDate;
            }
            
            processTypeRestDays = calculateRestDays(mostRecentDate);
          } 
          // Conferência processes have individualized rest days
          else if (processType === "Comissão de Conferência de Gêneros QR") {
            processTypeRestDays = calculateRestDays(military.processHistory["Comissão de Conferência de Gêneros QR"]);
          }
          else if (processType === "Comissão de Conferência de Munição") {
            processTypeRestDays = calculateRestDays(military.processHistory["Comissão de Conferência de Munição"]);
          }
          else {
            // For any other process type, use specific rest days
            processTypeRestDays = calculateRestDays(military.processHistory[processType]);
          }
        }
        
        return {
          ...military,
          restDays: generalRestDays,
          restDaysForProcessType: processType ? processTypeRestDays : undefined
        };
      })
      .sort((a, b) => {
        // Sort by rank first
        const rankAIndex = RANKS_ORDER.indexOf(a.rank);
        const rankBIndex = RANKS_ORDER.indexOf(b.rank);
        
        if (rankAIndex !== rankBIndex) {
          return rankAIndex - rankBIndex;
        }
        
        // If same rank, sort by formation year (most recent first)
        const yearA = a.formationYear || 0;
        const yearB = b.formationYear || 0;
        return yearB - yearA;
      });
  };

  const getMilitaryById = (id: string): Military | undefined => {
    return militaries.find(m => m.id === id);
  };

  const getProcessById = (id: string): Process | undefined => {
    return processes.find(p => p.id === id);
  };
  
  const getProcessesByType = (type: ProcessType): Process[] => {
    return processes.filter(p => p.type === type);
  };

  const contextValue: DataContextType = {
    militaries,
    processes,
    loading,
    addMilitary,
    updateMilitary,
    deleteMilitary,
    addProcess,
    updateProcess,
    deleteProcess,
    getMilitariesWithRestTime,
    getMilitaryById,
    getProcessById,
    getProcessesByType,
    addMilitariesFromCSV,
    synchronizeProcessHistory
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    console.error('useData must be used within a DataProvider');
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
