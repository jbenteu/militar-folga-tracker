
import React, { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { Military, MilitaryWithRestTime, Process, ProcessType, AssignedMilitary, MilitaryFunction, Rank, ProcessClass } from '@/types';
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

  // Load data from Supabase on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
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
          degree: m.degree,
          lastProcessDate: m.last_process_date ? new Date(m.last_process_date) : null,
          processHistory: convertProcessHistory(m.process_history)
        }));
        setMilitaries(transformedMilitaries);
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
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao conectar com o banco de dados');
    } finally {
      setLoading(false);
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
          degree: data.degree,
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
          degree: m.degree,
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
        
        // Update last process date for assigned militaries
        const updatedMilitaries = militaries.map(military => {
          if (process.assignedMilitaries.some(m => m.militaryId === military.id)) {
            const processHistory = { ...military.processHistory };
            processHistory[process.type] = process.startDate;
            
            const updatedMilitary = {
              ...military,
              lastProcessDate: process.startDate,
              processHistory
            };
            
            // Update in database
            const processHistoryForStorage: Record<string, string | null> = {};
            Object.entries(processHistory).forEach(([key, value]) => {
              processHistoryForStorage[key] = value ? value.toISOString() : null;
            });

            supabase
              .from('militaries')
              .update({
                last_process_date: process.startDate.toISOString(),
                process_history: processHistoryForStorage
              })
              .eq('id', military.id);
            
            return updatedMilitary;
          }
          return military;
        });
        
        setMilitaries(updatedMilitaries);
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
    return militaries.map(military => {
      const generalRestDays = calculateRestDays(military.lastProcessDate);
      let processTypeRestDays = generalRestDays;
      
      if (processType && military.processHistory) {
        processTypeRestDays = calculateRestDays(military.processHistory[processType]);
      }
      
      return {
        ...military,
        restDays: generalRestDays,
        restDaysForProcessType: processType ? processTypeRestDays : undefined
      };
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

  return (
    <DataContext.Provider value={{
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
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
