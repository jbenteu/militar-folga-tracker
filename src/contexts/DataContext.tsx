
import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { Military, MilitaryWithRestTime, Process, ProcessType, AssignedMilitary, MilitaryFunction } from '@/types';
import { initialMilitaries, initialProcesses } from '@/lib/mock-data';
import { calculateRestDays } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

interface DataContextType {
  militaries: Military[];
  processes: Process[];
  addMilitary: (military: Omit<Military, 'id' | 'processHistory'>) => void;
  updateMilitary: (military: Military) => void;
  deleteMilitary: (id: string) => void;
  addProcess: (process: Omit<Process, 'id'>) => void;
  updateProcess: (process: Process) => void;
  deleteProcess: (id: string) => void;
  getMilitariesWithRestTime: (processType?: ProcessType) => MilitaryWithRestTime[];
  getMilitaryById: (id: string) => Military | undefined;
  getProcessById: (id: string) => Process | undefined;
  getProcessesByType: (type: ProcessType) => Process[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [militaries, setMilitaries] = useState<Military[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);

  // Initialize or load from localStorage
  useEffect(() => {
    // Transform initial data for compatibility with new structure
    const transformedInitialMilitaries = initialMilitaries.map(m => ({
      ...m,
      processHistory: {} as Record<string, Date | null>
    }));

    const transformedInitialProcesses = initialProcesses.map(p => ({
      ...p,
      class: p.class as any, // Cast to the new ProcessClass type
      assignedMilitaries: p.assignedMilitaries.map(id => ({
        militaryId: id,
        function: 'Membro - Titular' as MilitaryFunction
      }))
    }));

    // Load from localStorage if available
    const storedMilitaries = localStorage.getItem('militaries');
    const storedProcesses = localStorage.getItem('processes');
    
    if (storedMilitaries) {
      try {
        const parsed = JSON.parse(storedMilitaries);
        // Convert string dates back to Date objects
        const militariesWithDates = parsed.map((m: any) => ({
          ...m,
          lastProcessDate: m.lastProcessDate ? new Date(m.lastProcessDate) : null,
          processHistory: m.processHistory || {}
        }));
        
        // Convert process history dates
        militariesWithDates.forEach((m: any) => {
          if (m.processHistory) {
            Object.keys(m.processHistory).forEach(key => {
              if (m.processHistory[key]) {
                m.processHistory[key] = new Date(m.processHistory[key]);
              }
            });
          }
        });
        
        setMilitaries(militariesWithDates);
      } catch (error) {
        console.error('Failed to parse stored militaries', error);
        setMilitaries(transformedInitialMilitaries);
      }
    } else {
      setMilitaries(transformedInitialMilitaries);
    }
    
    if (storedProcesses) {
      try {
        const parsed = JSON.parse(storedProcesses);
        // Convert string dates back to Date objects
        const processesWithDates = parsed.map((p: any) => ({
          ...p,
          startDate: new Date(p.startDate),
          endDate: p.endDate ? new Date(p.endDate) : null,
          // Ensure assigned militaries have the new structure
          assignedMilitaries: Array.isArray(p.assignedMilitaries) 
            ? p.assignedMilitaries.map((m: any) => {
                if (typeof m === 'string') {
                  return { militaryId: m, function: 'Membro - Titular' };
                }
                return m;
              })
            : []
        }));
        setProcesses(processesWithDates);
      } catch (error) {
        console.error('Failed to parse stored processes', error);
        setProcesses(transformedInitialProcesses);
      }
    } else {
      setProcesses(transformedInitialProcesses);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('militaries', JSON.stringify(militaries));
  }, [militaries]);

  useEffect(() => {
    localStorage.setItem('processes', JSON.stringify(processes));
  }, [processes]);

  // Military CRUD operations
  const addMilitary = (military: Omit<Military, 'id' | 'processHistory'>) => {
    const newMilitary = { 
      ...military, 
      id: uuidv4(),
      processHistory: {} as Record<string, Date | null>
    };
    setMilitaries([...militaries, newMilitary]);
    toast.success(`Militar ${military.name} adicionado com sucesso`);
  };

  const updateMilitary = (updatedMilitary: Military) => {
    setMilitaries(militaries.map(m => 
      m.id === updatedMilitary.id ? updatedMilitary : m
    ));
    toast.success(`Dados do militar ${updatedMilitary.name} atualizados`);
  };

  const deleteMilitary = (id: string) => {
    // Check if the military is assigned to any process
    const isAssigned = processes.some(process => 
      process.assignedMilitaries.some(m => m.militaryId === id)
    );

    if (isAssigned) {
      toast.error("Não é possível excluir este militar pois ele está designado em processos ativos.");
      return;
    }

    const militaryToDelete = militaries.find(m => m.id === id);
    setMilitaries(militaries.filter(m => m.id !== id));
    
    if (militaryToDelete) {
      toast.success(`Militar ${militaryToDelete.name} removido com sucesso`);
    }
  };

  // Process CRUD operations
  const addProcess = (process: Omit<Process, 'id'>) => {
    const newProcess = { ...process, id: uuidv4() };
    setProcesses([...processes, newProcess]);
    
    // Update last process date for assigned militaries
    const updatedMilitaries = militaries.map(military => {
      if (process.assignedMilitaries.some(m => m.militaryId === military.id)) {
        const processHistory = { ...military.processHistory };
        processHistory[process.type] = process.startDate;
        
        return {
          ...military,
          lastProcessDate: process.startDate,
          processHistory
        };
      }
      return military;
    });
    
    setMilitaries(updatedMilitaries);
    toast.success("Processo adicionado com sucesso");
  };

  const updateProcess = (updatedProcess: Process) => {
    setProcesses(processes.map(p => 
      p.id === updatedProcess.id ? updatedProcess : p
    ));
    
    // Update last process date for newly assigned militaries
    const currentProcess = processes.find(p => p.id === updatedProcess.id);
    const currentAssignedIds = currentProcess 
      ? currentProcess.assignedMilitaries.map(m => m.militaryId)
      : [];
      
    const newlyAssignedIds = updatedProcess.assignedMilitaries
      .map(m => m.militaryId)
      .filter(id => !currentAssignedIds.includes(id));
    
    if (newlyAssignedIds.length > 0) {
      const updatedMilitaries = militaries.map(military => {
        if (newlyAssignedIds.includes(military.id)) {
          const processHistory = { ...military.processHistory };
          processHistory[updatedProcess.type] = updatedProcess.startDate;
          
          return {
            ...military,
            lastProcessDate: updatedProcess.startDate,
            processHistory
          };
        }
        return military;
      });
      
      setMilitaries(updatedMilitaries);
    }
    
    toast.success("Processo atualizado com sucesso");
  };

  const deleteProcess = (id: string) => {
    setProcesses(processes.filter(p => p.id !== id));
    toast.success("Processo removido com sucesso");
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
      addMilitary,
      updateMilitary,
      deleteMilitary,
      addProcess,
      updateProcess,
      deleteProcess,
      getMilitariesWithRestTime,
      getMilitaryById,
      getProcessById,
      getProcessesByType
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
