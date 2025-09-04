import React, { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { Military, MilitaryWithRestTime, Process, ProcessType, AssignedMilitary, MilitaryFunction, Rank, ProcessClass, MilitaryGrade, RANKS_ORDER, getRankGrade } from '@/types';
import { calculateRestDays } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

const DataContext = createContext<DataContextType>({} as DataContextType);


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

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading data from Supabase...');
      
      // Load militaries using Supabase client
      const { data: militariesData, error: militariesError } = await supabase
        .from('militaries')
        .select('*')
        .order('created_at', { ascending: true });

      if (militariesError) throw militariesError;

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

      // Load processes using Supabase client
      const { data: processesData, error: processesError } = await supabase
        .from('processes')
        .select('*')
        .order('created_at', { ascending: true });

      if (processesError) throw processesError;

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
      toast.error(`Erro ao conectar com o banco de dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
      console.log('Data loading completed');
    }
  };

  // Function to synchronize process history using Supabase functions
  const synchronizeProcessHistory = async () => {
    try {
      console.log('Starting process history synchronization...');
      
      const { data: result, error } = await supabase.functions.invoke('sync-history');

      if (error) throw error;

      if (result?.updatedCount > 0) {
        toast.success(`Histórico de processos sincronizado para ${result.updatedCount} militares`);
        // Reload data to reflect changes
        await loadData();
      } else {
        toast.info('Todos os históricos já estão sincronizados');
      }
      
      console.log('Process history synchronization completed');
    } catch (error) {
      console.error('Error synchronizing process history:', error);
      toast.error(`Erro ao sincronizar histórico de processos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  // Load data from Supabase on mount
  useEffect(() => {
    loadData();
    // Sync process history on app start
    setTimeout(() => {
      synchronizeProcessHistory();
    }, 1000);
  }, []);

  // Military CRUD operations using Supabase client
  const addMilitary = async (military: Omit<Military, 'id' | 'processHistory'>) => {
    try {
      console.log('Adding military:', military);
      
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

      const { data, error } = await supabase
        .from('militaries')
        .insert(militaryData)
        .select()
        .single();

      if (error) throw error;

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
      toast.error(`Erro ao adicionar militar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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

      const { data, error } = await supabase
        .from('militaries')
        .insert(militariesToInsert)
        .select();

      if (error) throw error;

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
      console.log('=== STARTING MILITARY UPDATE ===');
      console.log('Military ID:', updatedMilitary.id);
      console.log('Military name:', updatedMilitary.name);
      console.log('Current militaries count:', militaries.length);
      
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

      console.log('Military data to update:', militaryData);

      const { data, error } = await supabase
        .from('militaries')
        .update(militaryData)
        .eq('id', updatedMilitary.id)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Supabase update successful, returned data:', data);

      setMilitaries(prev => {
        console.log('Updating local militaries state');
        const updated = prev.map(m => 
          m.id === updatedMilitary.id ? updatedMilitary : m
        );
        console.log('New militaries count:', updated.length);
        return updated;
      });
      
      console.log('=== MILITARY UPDATE COMPLETED ===');
      toast.success(`Dados do militar ${updatedMilitary.name} atualizados`);
    } catch (error) {
      console.error('=== MILITARY UPDATE FAILED ===');
      console.error('Error updating military:', error);
      toast.error(`Erro ao atualizar militar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const deleteMilitary = async (id: string) => {
    try {
      console.log('=== STARTING MILITARY DELETE ===');
      console.log('Military ID to delete:', id);
      console.log('Current militaries count:', militaries.length);
      
      const militaryToDelete = militaries.find(m => m.id === id);
      if (!militaryToDelete) {
        console.error('Military not found with ID:', id);
        console.log('Available military IDs:', militaries.map(m => m.id));
        toast.error("Militar não encontrado");
        return;
      }

      console.log(`Deleting military: ${militaryToDelete.name} (${id})`);
      
      const { data, error } = await supabase
        .from('militaries')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      console.log('Supabase delete successful, returned data:', data);

      setMilitaries(prev => {
        console.log('Updating local militaries state - removing military');
        const filtered = prev.filter(m => m.id !== id);
        console.log('New militaries count:', filtered.length);
        return filtered;
      });
      
      console.log('=== MILITARY DELETE COMPLETED ===');
      toast.success(`Militar ${militaryToDelete.name} removido com sucesso`);
      
    } catch (error) {
      console.error('=== MILITARY DELETE FAILED ===');
      console.error('Error deleting military:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao excluir militar';
      toast.error(errorMessage);
    }
  };

  // Process CRUD operations using Supabase client
  const addProcess = async (process: Omit<Process, 'id'>) => {
    try {
      console.log('Adding process:', process);
      
      const processData = {
        type: process.type,
        description: process.class,
        number: process.number,
        start_date: process.startDate.toISOString(),
        end_date: process.endDate?.toISOString() || null,
        assigned_militaries: process.assignedMilitaries,
        status: 'active'
      };

      console.log('Process data to send:', processData);

      const { data, error } = await supabase
        .from('processes')
        .insert(processData as any)
        .select()
        .single();

      if (error) throw error;

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
      toast.error(`Erro ao adicionar processo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const updateProcess = async (updatedProcess: Process) => {
    try {
      console.log('=== STARTING PROCESS UPDATE ===');
      console.log('Process ID:', updatedProcess.id);
      console.log('Process number:', updatedProcess.number);
      console.log('Current processes count:', processes.length);
      
      const processData = {
        type: updatedProcess.type,
        description: updatedProcess.class,
        number: updatedProcess.number,
        start_date: updatedProcess.startDate.toISOString(),
        end_date: updatedProcess.endDate?.toISOString() || null,
        assigned_militaries: updatedProcess.assignedMilitaries
      };

      console.log('Process data to update:', processData);

      const { data, error } = await supabase
        .from('processes')
        .update(processData as any)
        .eq('id', updatedProcess.id)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Supabase update successful, returned data:', data);

      setProcesses(prev => {
        console.log('Updating local processes state');
        const updated = prev.map(p => 
          p.id === updatedProcess.id ? updatedProcess : p
        );
        console.log('New processes count:', updated.length);
        return updated;
      });
      
      console.log('=== PROCESS UPDATE COMPLETED ===');
      toast.success("Processo atualizado com sucesso");
    } catch (error) {
      console.error('=== PROCESS UPDATE FAILED ===');
      console.error('Error updating process:', error);
      toast.error(`Erro ao atualizar processo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const deleteProcess = async (id: string) => {
    try {
      console.log('=== STARTING PROCESS DELETE ===');
      console.log('Process ID to delete:', id);
      console.log('Current processes count:', processes.length);
      
      const processToDelete = processes.find(p => p.id === id);
      if (!processToDelete) {
        console.error('Process not found with ID:', id);
        console.log('Available process IDs:', processes.map(p => p.id));
        toast.error("Processo não encontrado");
        return;
      }

      console.log(`Deleting process: ${processToDelete.number} (${id})`);
      
      const { data, error } = await supabase
        .from('processes')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      console.log('Supabase delete successful, returned data:', data);

      setProcesses(prev => {
        console.log('Updating local processes state - removing process');
        const filtered = prev.filter(p => p.id !== id);
        console.log('New processes count:', filtered.length);
        return filtered;
      });
      
      console.log('Reloading all data to update process history...');
      // Reload militaries to get updated process history
      await loadData();

      console.log('=== PROCESS DELETE COMPLETED ===');
      toast.success("Processo removido e folgas restauradas com sucesso");
    } catch (error) {
      console.error('=== PROCESS DELETE FAILED ===');
      console.error('Error deleting process:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao excluir processo';
      toast.error(errorMessage);
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
  if (!context || Object.keys(context).length === 0) {
    console.error('useData must be used within a DataProvider');
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
