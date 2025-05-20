
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useData } from "@/contexts/DataContext";
import { formatDate } from "@/lib/utils";
import { ProcessType } from "@/types";
import { useState } from "react";
import { ProcessDetails } from "./ProcessDetails";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "../ui/input";
import { Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ScrollArea } from "../ui/scroll-area";

interface ProcessListProps {
  processType?: ProcessType;
}

export function ProcessList({ processType }: ProcessListProps) {
  const { processes, deleteProcess, getProcessesByType } = useData();
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [viewingProcess, setViewingProcess] = useState<string | null>(null);
  const [filterClass, setFilterClass] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleAdd = () => {
    navigate("/criar-processo", { state: { processType } });
  };

  const handleEdit = (id: string) => {
    navigate(`/editar-processo/${id}`, { state: { processType } });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este processo?")) {
      deleteProcess(id);
    }
  };

  const handleViewDetails = (id: string) => {
    setViewingProcess(id);
    setOpenDetailsDialog(true);
  };

  // Get processes of specific type if specified
  const allProcesses = processType 
    ? getProcessesByType(processType)
    : processes;
    
  // Apply filters
  let filteredProcesses = allProcesses;
  
  if (filterClass) {
    filteredProcesses = filteredProcesses.filter(p => p.class === filterClass);
  }
  
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filteredProcesses = filteredProcesses.filter(p => 
      p.number.toLowerCase().includes(query) || 
      p.class.toLowerCase().includes(query) || 
      p.type.toLowerCase().includes(query)
    );
  }

  const processClasses = [
    "Classe I - Subsistência",
    "Classe II - Intendência",
    "Classe III - Óleos e Combustíveis",
    "Classe IV - Patrimônio",
    "Classe V - Armamento e Munição",
    "Classe VI - Engenharia",
    "Classe VII - Comunicações",
    "Classe VIII - Saúde",
    "Classe IX - Motomecanização ou Aviação",
    "Classe X - Diversos"
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-military-navy">
          {processType ? `Processos: ${processType}` : 'Lista de Processos'}
        </h2>
        <Button 
          onClick={handleAdd} 
          className="bg-military-blue hover:bg-military-navy"
        >
          Adicionar Processo {processType ? `(${processType})` : ''}
        </Button>
      </div>

      <div className="bg-white p-4 rounded-md shadow mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              placeholder="Buscar processo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Filtrar por Classe:</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-military-blue"
            >
              <option value="">Todas</option>
              {processClasses.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setFilterClass("");
                setSearchQuery("");
              }}
              className="w-full"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[50vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                {!processType && <TableHead>Tipo</TableHead>}
                <TableHead>Classe</TableHead>
                <TableHead>Data Início</TableHead>
                <TableHead>Data Fim</TableHead>
                <TableHead>Militares</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProcesses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={processType ? 6 : 7} className="text-center py-4">
                    Nenhum processo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredProcesses.map((process) => (
                  <TableRow key={process.id}>
                    <TableCell>{process.number}</TableCell>
                    {!processType && <TableCell>{process.type}</TableCell>}
                    <TableCell>{process.class}</TableCell>
                    <TableCell>{formatDate(process.startDate)}</TableCell>
                    <TableCell>{formatDate(process.endDate)}</TableCell>
                    <TableCell>{process.assignedMilitaries.length} militares</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewDetails(process.id)}
                        >
                          Detalhes
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEdit(process.id)}
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDelete(process.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      <Dialog open={openDetailsDialog} onOpenChange={setOpenDetailsDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Processo</DialogTitle>
          </DialogHeader>
          {viewingProcess && (
            <ProcessDetails
              processId={viewingProcess}
              onEdit={() => {
                setOpenDetailsDialog(false);
                navigate(`/editar-processo/${viewingProcess}`, { state: { processType } });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
