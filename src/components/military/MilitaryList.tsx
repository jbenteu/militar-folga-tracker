
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
import { MilitaryGrade, Rank, RANKS_ORDER, getRankGrade } from "@/types";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import ImportCSVModal from "./ImportCSVModal";
import { ScrollArea } from "@/components/ui/scroll-area";

export function MilitaryList() {
  const { militaries, deleteMilitary, loading } = useData();
  const [openDialog, setOpenDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [editingMilitary, setEditingMilitary] = useState<string | null>(null);
  const [filterRank, setFilterRank] = useState<Rank | "">("");
  const [filterGrade, setFilterGrade] = useState<MilitaryGrade | "">("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleEdit = (id: string) => {
    setEditingMilitary(id);
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setEditingMilitary(null);
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este militar?")) {
      await deleteMilitary(id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dados...</span>
      </div>
    );
  }

  // Apply filters
  let filteredMilitaries = militaries;
  
  // Filter by rank if selected
  if (filterRank) {
    filteredMilitaries = filteredMilitaries.filter(m => m.rank === filterRank);
  }
  
  // Filter by grade if selected
  if (filterGrade) {
    filteredMilitaries = filteredMilitaries.filter(m => getRankGrade(m.rank) === filterGrade);
  }
  
  // Filter by search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filteredMilitaries = filteredMilitaries.filter(m => 
      m.name.toLowerCase().includes(query) || 
      m.rank.toLowerCase().includes(query) ||
      m.branch.toLowerCase().includes(query) ||
      m.degree.toLowerCase().includes(query)
    );
  }
  
  // Sort by rank according to the defined order
  filteredMilitaries = [...filteredMilitaries].sort((a, b) => {
    const rankAIndex = RANKS_ORDER.indexOf(a.rank);
    const rankBIndex = RANKS_ORDER.indexOf(b.rank);
    return rankAIndex - rankBIndex;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-military-navy">Lista de Militares</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setOpenImportDialog(true)}
            className="border-military-blue text-military-blue hover:bg-military-blue/10"
          >
            Importar CSV
          </Button>
          <Button onClick={handleAdd} className="bg-military-blue hover:bg-military-navy">
            Adicionar Militar
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-md shadow mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              placeholder="Buscar militar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Filtrar por Grau:</label>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value as MilitaryGrade | "")}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-military-blue"
            >
              <option value="">Todos</option>
              <option value="Oficial">Oficial</option>
              <option value="Praça">Praça</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Filtrar por Posto/Graduação:</label>
            <select
              value={filterRank}
              onChange={(e) => setFilterRank(e.target.value as Rank | "")}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-military-blue"
            >
              <option value="">Todos</option>
              {RANKS_ORDER.map((rank) => (
                <option key={rank} value={rank}>{rank}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setFilterRank("");
                setFilterGrade("");
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
                <TableHead>Nome</TableHead>
                <TableHead>Posto/Graduação</TableHead>
                <TableHead>Grau</TableHead>
                <TableHead>Arma</TableHead>
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
                      <TableCell>{getRankGrade(military.rank)}</TableCell>
                      <TableCell>{military.branch}</TableCell>
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
        </ScrollArea>
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

      <ImportCSVModal 
        open={openImportDialog}
        onOpenChange={setOpenImportDialog}
      />
    </div>
  );
}
