
import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { Military, MilitaryWithRestTime, Process } from '@/types';
import { initialMilitaries, initialProcesses } from '@/lib/mock-data';
import { addMilitaryWithRestTime, calculateRestDays } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

interface DataContextType {
  militaries: Military[];
  processes: Process[];
  addMilitary: (military: Omit<Military, 'id'>) => void;
  updateMilitary: (military: Military) => void;
  deleteMilitary: (id: string) => void;
  addProcess: (process: Omit<Process, 'id'>) => void;
  updateProcess: (process: Process) => void;
  deleteProcess: (id: string) => void;
  getMilitariesWithRestTime: () => MilitaryWithRestTime[];
  getMilitaryById: (id: string) => Military | undefined;
  getProcessById: (id: string) => Process | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [militaries, setMilitaries] = useState<Military[]>(initialMilitaries);
  const [processes, setProcesses] = useState<Process[]>(initialProcesses);

  useEffect(() => {
    // Load from localStorage if available
    const storedMilitaries = localStorage.getItem('militaries');
    const storedProcesses = localStorage.getItem('processes');
    
    if (storedMilitaries) {
      try {
        const parsed = JSON.parse(storedMilitaries);
        // Convert string dates back to Date objects
        const militariesWithDates = parsed.map((m: any) => ({
          ...m,
          lastProcessDate: m.lastProcessDate ? new Date(m.lastProcessDate) : null
        }));
        setMilitaries(militariesWithDates);
      } catch (error) {
        console.error('Failed to parse stored militaries', error);
      }
    }
    
    if (storedProcesses) {
      try {
        const parsed = JSON.parse(storedProcesses);
        // Convert string dates back to Date objects
        const processesWithDates = parsed.map((p: any) => ({
          ...p,
          startDate: new Date(p.startDate),
          endDate: p.endDate ? new Date(p.endDate) : null
        }));
        setProcesses(processesWithDates);
      } catch (error) {
        console.error('Failed to parse stored processes', error);
      }
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
  const addMilitary = (military: Omit<Military, 'id'>) => {
    const newMilitary = { ...military, id: uuidv4() };
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
      process.assignedMilitaries.includes(id)
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
      if (process.assignedMilitaries.includes(military.id)) {
        return {
          ...military,
          lastProcessDate: process.startDate
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
    const newlyAssigned = currentProcess 
      ? updatedProcess.assignedMilitaries.filter(id => !currentProcess.assignedMilitaries.includes(id))
      : updatedProcess.assignedMilitaries;
    
    if (newlyAssigned.length > 0) {
      const updatedMilitaries = militaries.map(military => {
        if (newlyAssigned.includes(military.id)) {
          return {
            ...military,
            lastProcessDate: updatedProcess.startDate
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
  const getMilitariesWithRestTime = (): MilitaryWithRestTime[] => {
    return militaries.map(military => ({
      ...military,
      restDays: calculateRestDays(military.lastProcessDate)
    }));
  };

  const getMilitaryById = (id: string): Military | undefined => {
    return militaries.find(m => m.id === id);
  };

  const getProcessById = (id: string): Process | undefined => {
    return processes.find(p => p.id === id);
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
      getProcessById
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
