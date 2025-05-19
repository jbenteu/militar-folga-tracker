
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
import { formatDate, getRestTimeClass, calculateRestDays } from "@/lib/utils";
import { useState } from "react";
import { MilitaryForm } from "./MilitaryForm";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Rank } from "@/types";

export function MilitaryList() {
  const { militaries, deleteMilitary } = useData();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMilitary, setEditingMilitary] = useState<string | null>(null);
  const [filterRank, setFilterRank] = useState<Rank | "">("");

  const handleEdit = (id: string) => {
    setEditingMilitary(id);
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setEditingMilitary(null);
    setOpenDialog(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este militar?")) {
      deleteMilitary(id);
    }
  };

  const filteredMilitaries = filterRank 
    ? militaries.filter(m => m.rank === filterRank)
    : militaries;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-military-navy">Lista de Militares</h2>
        <Button onClick={handleAdd} className="bg-military-blue hover:bg-military-navy">
          Adicionar Militar
        </Button>
      </div>

      <div className="bg-white p-4 rounded-md shadow mb-4">
        <div className="flex items-center mb-4">
          <label className="mr-2 font-medium">Filtrar por Posto/Graduação:</label>
          <select
            value={filterRank}
            onChange={(e) => setFilterRank(e.target.value as Rank | "")}
            className="border rounded px-2 py-1"
          >
            <option value="">Todos</option>
            <option value="3º Sargento">3º Sargento</option>
            <option value="2º Sargento">2º Sargento</option>
            <option value="1º Sargento">1º Sargento</option>
            <option value="Aspirante a Oficial">Aspirante a Oficial</option>
            <option value="2º Tenente">2º Tenente</option>
            <option value="1º Tenente">1º Tenente</option>
            <option value="Capitão">Capitão</option>
            <option value="Major">Major</option>
          </select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Posto/Graduação</TableHead>
              <TableHead>Arma</TableHead>
              <TableHead>Grau</TableHead>
              <TableHead>Última Participação</TableHead>
              <TableHead>Dias em Folga</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMilitaries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Nenhum militar encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredMilitaries.map((military) => {
                const restDays = calculateRestDays(military.lastProcessDate);
                const restTimeClass = getRestTimeClass(restDays);
                
                return (
                  <TableRow key={military.id}>
                    <TableCell>{military.name}</TableCell>
                    <TableCell>{military.rank}</TableCell>
                    <TableCell>{military.branch}</TableCell>
                    <TableCell>{military.degree}</TableCell>
                    <TableCell>{formatDate(military.lastProcessDate)}</TableCell>
                    <TableCell className={restTimeClass}>
                      {restDays} {restDays === 1 ? 'dia' : 'dias'}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEdit(military.id)}
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDelete(military.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingMilitary ? 'Editar Militar' : 'Adicionar Novo Militar'}
            </DialogTitle>
          </DialogHeader>
          <MilitaryForm
            militaryId={editingMilitary}
            onComplete={() => setOpenDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
