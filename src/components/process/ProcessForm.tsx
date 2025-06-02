import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ProcessType, ProcessClass, AssignedMilitary, MilitaryFunction, PROCESS_CLASSES } from "@/types";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { MilitaryRanking } from "../military/MilitaryRanking";
import { cn } from "@/lib/utils";
import { format, lastDayOfMonth } from "date-fns";
import { toast } from "sonner";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProcessFormProps {
  processId: string | null;
  processType?: ProcessType;
  onComplete: () => void;
}

export function ProcessForm({ processId, processType, onComplete }: ProcessFormProps) {
  const { addProcess, updateProcess, getProcessById, militaries } = useData();
  
  const [type, setType] = useState<ProcessType>(processType || "TEAM");
  const [processClass, setProcessClass] = useState<ProcessClass>(PROCESS_CLASSES[0]);
  const [number, setNumber] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedMilitaryIds, setSelectedMilitaryIds] = useState<string[]>([]);
  const [assignedMilitaries, setAssignedMilitaries] = useState<AssignedMilitary[]>([]);
  const [activeTab, setActiveTab] = useState<string>("details");
  const [month, setMonth] = useState<string>("01");
  const [year, setYear] = useState<string>("2025");
  
  // Generate unique process number for new processes
  useEffect(() => {
    if (!processId) {
      setNumber(generateUniqueProcessNumber(type));
    }
  }, [processId, type]);
  
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
        setSelectedMilitaryIds(process.assignedMilitaries.map(m => m.militaryId));
        
        // Extract month and year for special process types
        if (isSpecialProcessType(process.type)) {
          const parts = process.number.split('-')[1].split('/');
          setMonth(parts[0]);
          setYear(parts[1]);
        }
      }
    } else {
      // Reset form for new process
      if (processType) {
        setType(processType);
      } else {
        setType("TEAM");
      }
      setProcessClass(PROCESS_CLASSES[0]);
      setNumber(generateUniqueProcessNumber());
      setStartDate(new Date());
      setEndDate(null);
      setAssignedMilitaries([]);
      setSelectedMilitaryIds([]);
      
      // Initialize month/year for special process types
      const currentDate = new Date();
      setMonth((currentDate.getMonth() + 1).toString().padStart(2, '0'));
      setYear("2025");
    }
  }, [processId, getProcessById, processType]);
  
  // When type changes, check if it's a special type and update number format if needed
  useEffect(() => {
    const isSpecialType = isSpecialProcessType(type);
    
    if (isSpecialType) {
      // For these special types, we'll generate the process number based on month/year
      updateSpecialProcessNumber();
      
      // Set the start date to the first day of the month
      const firstDay = new Date(parseInt(year), parseInt(month) - 1, 1);
      setStartDate(firstDay);
      
      // Set the end date to the last day of the month
      const lastDay = lastDayOfMonth(firstDay);
      setEndDate(lastDay);
    } else {
      // For TEAM, TREM, PT - set empty number so user inputs manually
      if (!processId) {
        setNumber("");
      }
    }
  }, [type, month, year, processId]);
  
  const isSpecialProcessType = (type: ProcessType): boolean => {
    return type === "Comissão de Conferência de Gêneros QR" || type === "Comissão de Conferência de Munição";
  };
  
  const updateSpecialProcessNumber = () => {
    if (type === "Comissão de Conferência de Gêneros QR") {
      setNumber(`CG-${month}/${year}`);
    } else if (type === "Comissão de Conferência de Munição") {
      setNumber(`CM-${month}/${year}`);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!isSpecialProcessType(type) && !processClass) || !startDate) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    
    // Check if number is required and empty for non-special types
    if (!isSpecialProcessType(type) && !number.trim()) {
      toast.error("Por favor, insira o número do processo.");
      return;
    }
    
    // Special validation for "Comissão de Conferência de Gêneros QR" - exactly 6
    if (type === "Comissão de Conferência de Gêneros QR" && assignedMilitaries.length !== 6) {
      toast.error("Comissão de Conferência de Gêneros QR requer exatamente 6 militares.");
      return;
    }
    
    // For other processes, check minimum
    if (type !== "Comissão de Conferência de Gêneros QR" && assignedMilitaries.length < getProcessMinMilitaries(type)) {
      toast.error(`Este tipo de processo requer pelo menos ${getProcessMinMilitaries(type)} ${getProcessMinMilitaries(type) === 1 ? 'militar' : 'militares'}.`);
      return;
    }
    
    // Check if all assigned militaries have a function
    const missingFunction = assignedMilitaries.some(m => !m.function);
    if (missingFunction) {
      toast.error("Todos os militares designados devem ter uma função atribuída.");
      return;
    }
    
    if (processId) {
      updateProcess({
        id: processId,
        type,
        class: isSpecialProcessType(type) ? PROCESS_CLASSES[0] : processClass,
        number,
        startDate,
        endDate: endDate || startDate,
        assignedMilitaries,
      });
    } else {
      addProcess({
        type,
        class: isSpecialProcessType(type) ? PROCESS_CLASSES[0] : processClass,
        number,
        startDate,
        endDate: endDate || startDate,
        assignedMilitaries,
      });
    }
    
    onComplete();
  };
  
  const handleSelectMilitary = (militaryId: string) => {
    setSelectedMilitaryIds((current) => {
      if (current.includes(militaryId)) {
        // Remove from selected and assigned
        setAssignedMilitaries(prev => prev.filter(m => m.militaryId !== militaryId));
        return current.filter((id) => id !== militaryId);
      } else {
        // Add to selected and to assigned with default function
        const defaultFunction = getDefaultMilitaryFunction(type);
        setAssignedMilitaries(prev => [
          ...prev, 
          { militaryId, function: defaultFunction }
        ]);
        return [...current, militaryId];
      }
    });
  };
  
  const getDefaultMilitaryFunction = (processType: ProcessType): MilitaryFunction => {
    const isSpecial = isSpecialProcessType(processType);
    
    if (isSpecial) {
      return 'Membro - Titular';
    } else {
      return 'Membro';
    }
  };
  
  const handleChangeFunction = (militaryId: string, func: MilitaryFunction) => {
    setAssignedMilitaries(prev => 
      prev.map(m => m.militaryId === militaryId ? { ...m, function: func } : m)
    );
  };
  
  const processTypes: ProcessType[] = [
    "TEAM",
    "TREM",
    "PT",
    "Comissão de Conferência de Gêneros QR",
    "Comissão de Conferência de Munição",
  ];
  
  // Get available functions based on process type
  const getAvailableFunctions = (processType: ProcessType): MilitaryFunction[] => {
    const isSpecial = isSpecialProcessType(processType);
    
    if (isSpecial) {
      return [
        "Membro - Titular",
        "Membro - Substituto",
        "Presidente - Titular",
        "Presidente - Substituto"
      ];
    } else {
      return [
        "Membro",
        "Presidente",
        "Assessor Técnico"
      ];
    }
  };
  
  const minMilitaries = getProcessMinMilitaries(type);
  
  const months = [
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];
  
  const years = ["2025", "2026", "2027", "2028", "2029", "2030"];
  
  const isSpecialType = isSpecialProcessType(type);
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-0 shadow-none">
        <CardHeader className="px-0 pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="details">Detalhes do Processo</TabsTrigger>
              <TabsTrigger value="militaries">Designação de Militares ({assignedMilitaries.length})</TabsTrigger>
            </TabsList>
          
            <TabsContent value="details" className="mt-0">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle>Informações do Processo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo de Processo</Label>
                      <Select 
                        value={type} 
                        onValueChange={(value) => setType(value as ProcessType)}
                        disabled={!!processType}
                      >
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
                    
                    {isSpecialType ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="month">Mês</Label>
                          <Select
                            value={month}
                            onValueChange={setMonth}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o mês" />
                            </SelectTrigger>
                            <SelectContent>
                              {months.map((m) => (
                                <SelectItem key={m.value} value={m.value}>
                                  {m.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="year">Ano</Label>
                          <Select
                            value={year}
                            onValueChange={setYear}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o ano" />
                            </SelectTrigger>
                            <SelectContent>
                              {years.map((y) => (
                                <SelectItem key={y} value={y}>{y}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="startDate">Data de Início</Label>
                          <Input
                            id="startDate"
                            value={startDate ? format(startDate, "dd/MM/yyyy") : ''}
                            disabled
                            className="bg-gray-100"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="endDate">Data de Fim</Label>
                          <Input
                            id="endDate"
                            value={endDate ? format(endDate, "dd/MM/yyyy") : ''}
                            disabled
                            className="bg-gray-100"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="class">Classe</Label>
                          <Select 
                            value={processClass} 
                            onValueChange={(value) => setProcessClass(value as ProcessClass)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a classe" />
                            </SelectTrigger>
                            <SelectContent>
                              {PROCESS_CLASSES.map((cls) => (
                                <SelectItem key={cls} value={cls}>
                                  {cls}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="number">Número *</Label>
                          <Input
                            id="number"
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            placeholder="Digite o número do processo"
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
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          
            <TabsContent value="militaries" className="mt-0">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Designação de Militares</h3>
                    <span className={`text-sm ${
                      type === "Comissão de Conferência de Gêneros QR" 
                        ? (assignedMilitaries.length !== 6 ? "text-red-500" : "text-green-600")
                        : (assignedMilitaries.length < minMilitaries ? "text-red-500" : "text-green-600")
                    }`}>
                      {type === "Comissão de Conferência de Gêneros QR" 
                        ? (assignedMilitaries.length !== 6 ? "Exige exatamente 6 militares" : "Quantidade correta")
                        : (assignedMilitaries.length < minMilitaries 
                          ? `Mínimo de ${minMilitaries} ${minMilitaries === 1 ? 'militar' : 'militares'}`
                          : "Quantidade suficiente")
                      }
                    </span>
                  </div>
                </div>

                {assignedMilitaries.length > 0 && (
                  <div className="bg-white p-3 rounded border border-military-blue mb-4">
                    <h3 className="text-sm font-semibold mb-2">Militares selecionados:</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Posto/Grad.</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Função</TableHead>
                          <TableHead>Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignedMilitaries.map((assigned) => {
                          const mil = militaries.find((m) => m.id === assigned.militaryId);
                          return mil ? (
                            <TableRow key={assigned.militaryId}>
                              <TableCell>{mil.rank}</TableCell>
                              <TableCell>{mil.name}</TableCell>
                              <TableCell>
                                <Select 
                                  value={assigned.function} 
                                  onValueChange={(value) => handleChangeFunction(assigned.militaryId, value as MilitaryFunction)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione a função" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getAvailableFunctions(type).map((func) => (
                                      <SelectItem key={func} value={func}>
                                        {func}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleSelectMilitary(assigned.militaryId)}
                                >
                                  Remover
                                </Button>
                              </TableCell>
                            </TableRow>
                          ) : null;
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                <div className="bg-white rounded border">
                  <MilitaryRanking 
                    processType={type} 
                    onSelect={handleSelectMilitary}
                    selectedIds={selectedMilitaryIds}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-0">
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
