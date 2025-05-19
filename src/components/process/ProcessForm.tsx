
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger, 
} from "@/components/ui/popover";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { formatDate, generateUniqueProcessNumber, getProcessMinMilitaries } from "@/lib/utils";
import { ProcessType } from "@/types";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { MilitaryRanking } from "../military/MilitaryRanking";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

interface ProcessFormProps {
  processId: string | null;
  onComplete: () => void;
}

export function ProcessForm({ processId, onComplete }: ProcessFormProps) {
  const { addProcess, updateProcess, getProcessById, militaries } = useData();
  
  const [type, setType] = useState<ProcessType>("TEAM");
  const [processClass, setProcessClass] = useState("");
  const [number, setNumber] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [assignedMilitaries, setAssignedMilitaries] = useState<string[]>([]);
  
  // Generate unique process number for new processes
  useEffect(() => {
    if (!processId) {
      setNumber(generateUniqueProcessNumber());
    }
  }, [processId]);
  
  useEffect(() => {
    if (processId) {
      const process = getProcessById(processId);
      if (process) {
        setType(process.type);
        setProcessClass(process.class);
        setNumber(process.number);
        setStartDate(process.startDate);
        setEndDate(process.endDate);
        setAssignedMilitaries(process.assignedMilitaries);
      }
    } else {
      // Reset form for new process
      setType("TEAM");
      setProcessClass("");
      setNumber(generateUniqueProcessNumber());
      setStartDate(new Date());
      setEndDate(null);
      setAssignedMilitaries([]);
    }
  }, [processId, getProcessById]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!processClass || !number || !startDate) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    
    const minMilitaries = getProcessMinMilitaries(type);
    if (assignedMilitaries.length < minMilitaries) {
      toast.error(`Este tipo de processo requer pelo menos ${minMilitaries} ${minMilitaries === 1 ? 'militar' : 'militares'}.`);
      return;
    }
    
    if (processId) {
      updateProcess({
        id: processId,
        type,
        class: processClass,
        number,
        startDate,
        endDate,
        assignedMilitaries,
      });
    } else {
      addProcess({
        type,
        class: processClass,
        number,
        startDate,
        endDate,
        assignedMilitaries,
      });
    }
    
    onComplete();
  };
  
  const handleSelectMilitary = (militaryId: string) => {
    setAssignedMilitaries((current) => {
      if (current.includes(militaryId)) {
        return current.filter((id) => id !== militaryId);
      } else {
        return [...current, militaryId];
      }
    });
  };
  
  const processTypes: ProcessType[] = [
    "TEAM",
    "TREM",
    "PT",
    "Comissão de Conferência de Gêneros QR",
    "Comissão de Conferência de Munição",
  ];
  
  const minMilitaries = getProcessMinMilitaries(type);
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-0 shadow-none">
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Processo</Label>
              <Select value={type} onValueChange={(value) => setType(value as ProcessType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {processTypes.map((processType) => (
                    <SelectItem key={processType} value={processType}>
                      {processType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="class">Classe</Label>
              <Input
                id="class"
                value={processClass}
                onChange={(e) => setProcessClass(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Fim (opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Militares Designados ({assignedMilitaries.length}/{minMilitaries}+)</Label>
              <span className={`text-sm ${assignedMilitaries.length < minMilitaries ? "text-red-500" : "text-green-600"}`}>
                {assignedMilitaries.length < minMilitaries 
                  ? `Mínimo de ${minMilitaries} ${minMilitaries === 1 ? 'militar' : 'militares'}`
                  : "Quantidade suficiente"}
              </span>
            </div>
            
            {assignedMilitaries.length > 0 && (
              <div className="bg-military-sand/20 p-3 rounded border border-military-sand mb-4">
                <h3 className="text-sm font-semibold mb-2">Militares selecionados:</h3>
                <ul className="list-disc pl-5">
                  {assignedMilitaries.map((id) => {
                    const mil = militaries.find((m) => m.id === id);
                    return mil ? (
                      <li key={id} className="text-sm">
                        {mil.rank} {mil.name}
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
            )}
            
            <div className="bg-white rounded border">
              <MilitaryRanking 
                processType={type} 
                onSelect={handleSelectMilitary}
                selectedIds={assignedMilitaries}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onComplete}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-military-blue hover:bg-military-navy">
              {processId ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
