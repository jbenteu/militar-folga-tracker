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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

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

  // Load data from Supabase on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading data from Supabase...');
      
      // Load militaries
      const { data: militariesData, error: militariesError } = await supabase
        .from('militaries')
        .select('*')
        .order('created_at', { ascending: true });

      if (militariesError) {
        console.error('Error loading militaries:', militariesError);
        toast.error('Erro ao carregar militares do banco de dados');
      } else if (militariesData) {
        const transformedMilitaries: Military[] = militariesData.map(m => ({
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
      }

      // Load processes
      const { data: processesData, error: processesError } = await supabase
        .from('processes')
        .select('*')
        .order('created_at', { ascending: true });

      if (processesError) {
        console.error('Error loading processes:', processesError);
        toast.error('Erro ao carregar processos do banco de dados');
      } else if (processesData) {
        const transformedProcesses: Process[] = processesData.map(p => ({
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
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao conectar com o banco de dados');
    } finally {
      setLoading(false);
      console.log('Data loading completed');
    }
  };

  // Military CRUD operations
  const addMilitary = async (military: Omit<Military, 'id' | 'processHistory'>) => {
    try {
      const { data, error } = await supabase
        .from('militaries')
        .insert({
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
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding military:', error);
        toast.error('Erro ao adicionar militar');
        return;
      }

      if (data) {
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
      }
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

      const { data, error } = await supabase
        .from('militaries')
        .insert(militariesToInsert)
        .select();

      if (error) {
        console.error('Error importing militaries:', error);
        toast.error('Erro ao importar militares');
        return;
      }

      if (data) {
        const transformedMilitaries: Military[] = data.map(m => ({
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
      }
    } catch (error) {
      console.error('Error importing militaries:', error);
      toast.error('Erro ao importar militares');
    }
  };

  const updateMilitary = async (updatedMilitary: Military) => {
    try {
      // Convert processHistory dates to ISO strings for storage
      const processHistoryForStorage: Record<string, string | null> = {};
      Object.entries(updatedMilitary.processHistory).forEach(([key, value]) => {
        processHistoryForStorage[key] = value ? value.toISOString() : null;
      });

      const { error } = await supabase
        .from('militaries')
        .update({
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
        })
        .eq('id', updatedMilitary.id);

      if (error) {
        console.error('Error updating military:', error);
        toast.error('Erro ao atualizar militar');
        return;
      }

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
      // Check if the military is assigned to any process
      const isAssigned = processes.some(process => 
        process.assignedMilitaries.some(m => m.militaryId === id)
      );

      if (isAssigned) {
        toast.error("Não é possível excluir este militar pois ele está designado em processos ativos.");
        return;
      }

      const { error } = await supabase
        .from('militaries')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting military:', error);
        toast.error('Erro ao excluir militar');
        return;
      }

      const militaryToDelete = militaries.find(m => m.id === id);
      setMilitaries(prev => prev.filter(m => m.id !== id));
      
      if (militaryToDelete) {
        toast.success(`Militar ${militaryToDelete.name} removido com sucesso`);
      }
    } catch (error) {
      console.error('Error deleting military:', error);
      toast.error('Erro ao excluir militar');
    }
  };

  // Process CRUD operations
  const addProcess = async (process: Omit<Process, 'id'>) => {
    try {
      console.log('Adding process:', process);
      
      const { data, error } = await supabase
        .from('processes')
        .insert({
          type: process.type,
          description: process.class,
          number: process.number,
          start_date: process.startDate.toISOString(),
          end_date: process.endDate?.toISOString() || null,
          assigned_militaries: process.assignedMilitaries as any
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding process:', error);
        toast.error('Erro ao adicionar processo');
        return;
      }

      if (data) {
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
        
        // Update military history for each assigned military
        const militariesToUpdate = process.assignedMilitaries.map(async (assigned) => {
          const military = militaries.find(m => m.id === assigned.militaryId);
          if (!military) return null;
          
          console.log(`Updating military ${military.name} for process ${process.type}`);
          
          // Update process history
          const updatedProcessHistory = { ...military.processHistory };
          updatedProcessHistory[process.type] = process.startDate;
          
          // Convert dates to ISO strings for database storage
          const processHistoryForStorage: Record<string, string | null> = {};
          Object.entries(updatedProcessHistory).forEach(([key, value]) => {
            processHistoryForStorage[key] = value ? value.toISOString() : null;
          });

          // Update in database
          const { error: updateError } = await supabase
            .from('militaries')
            .update({
              last_process_date: process.startDate.toISOString(),
              process_history: processHistoryForStorage
            })
            .eq('id', military.id);

          if (updateError) {
            console.error(`Error updating military ${military.name}:`, updateError);
            return null;
          }

          console.log(`Successfully updated military ${military.name}`);
          
          // Return updated military for local state
          return {
            ...military,
            lastProcessDate: process.startDate,
            processHistory: updatedProcessHistory
          };
        });

        // Wait for all military updates to complete
        const updatedMilitariesResults = await Promise.all(militariesToUpdate);
        const successfulUpdates = updatedMilitariesResults.filter(Boolean);
        
        // Update local state with successful updates
        if (successfulUpdates.length > 0) {
          setMilitaries(prevMilitaries => 
            prevMilitaries.map(military => {
              const updatedMilitary = successfulUpdates.find(updated => updated && updated.id === military.id);
              return updatedMilitary || military;
            })
          );
          console.log(`Updated ${successfulUpdates.length} militaries in local state`);
        }
        
        toast.success("Processo adicionado com sucesso");
      }
    } catch (error) {
      console.error('Error adding process:', error);
      toast.error('Erro ao adicionar processo');
    }
  };

  const updateProcess = async (updatedProcess: Process) => {
    try {
      const { error } = await supabase
        .from('processes')
        .update({
          type: updatedProcess.type,
          description: updatedProcess.class,
          number: updatedProcess.number,
          start_date: updatedProcess.startDate.toISOString(),
          end_date: updatedProcess.endDate?.toISOString() || null,
          assigned_militaries: updatedProcess.assignedMilitaries as any
        })
        .eq('id', updatedProcess.id);

      if (error) {
        console.error('Error updating process:', error);
        toast.error('Erro ao atualizar processo');
        return;
      }

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
      const { error } = await supabase
        .from('processes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting process:', error);
        toast.error('Erro ao excluir processo');
        return;
      }

      setProcesses(prev => prev.filter(p => p.id !== id));
      toast.success("Processo removido com sucesso");
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
    addMilitariesFromCSV
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
