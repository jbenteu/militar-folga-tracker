
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
import { ProcessForm } from "./ProcessForm";
import { ProcessDetails } from "./ProcessDetails";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ProcessList() {
  const { processes, deleteProcess } = useData();
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [editingProcess, setEditingProcess] = useState<string | null>(null);
  const [viewingProcess, setViewingProcess] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<ProcessType | "">("");

  const handleEdit = (id: string) => {
    setEditingProcess(id);
    setOpenAddDialog(true);
  };

  const handleAdd = () => {
    setEditingProcess(null);
    setOpenAddDialog(true);
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

  const filteredProcesses = filterType 
    ? processes.filter(p => p.type === filterType)
    : processes;

  const processTypes: ProcessType[] = [
    "TEAM",
    "TREM",
    "PT",
    "Comissão de Conferência de Gêneros QR",
    "Comissão de Conferência de Munição",
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-military-navy">Lista de Processos</h2>
        <Button onClick={handleAdd} className="bg-military-blue hover:bg-military-navy">
          Adicionar Processo
        </Button>
      </div>

      <div className="bg-white p-4 rounded-md shadow mb-4">
        <div className="flex items-center mb-4">
          <label className="mr-2 font-medium">Filtrar por Tipo:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ProcessType | "")}
            className="border rounded px-2 py-1"
          >
            <option value="">Todos</option>
            {processTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Tipo</TableHead>
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
                <TableCell colSpan={7} className="text-center py-4">
                  Nenhum processo encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredProcesses.map((process) => (
                <TableRow key={process.id}>
                  <TableCell>{process.number}</TableCell>
                  <TableCell>{process.type}</TableCell>
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
      </div>

      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {editingProcess ? 'Editar Processo' : 'Adicionar Novo Processo'}
            </DialogTitle>
          </DialogHeader>
          <ProcessForm
            processId={editingProcess}
            onComplete={() => setOpenAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

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
                setEditingProcess(viewingProcess);
                setOpenAddDialog(true);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
