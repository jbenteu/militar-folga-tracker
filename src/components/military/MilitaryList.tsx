import React, { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { MilitaryForm } from "./MilitaryForm";
import ImportCSVModal from "./ImportCSVModal";
import { formatDate, calculateRestDays, getRestTimeClass } from "@/lib/utils";
import { Military, MilitaryGrade, Rank, RANKS_ORDER, getRankGrade } from "@/types";

export function MilitaryList() {
  const { militaries, deleteMilitary, loading } = useData();
  const [openDialog, setOpenDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [editingMilitary, setEditingMilitary] = useState<string | null>(null);
  const [selectedMilitary, setSelectedMilitary] = useState<Military | null>(null);
  const [filterRank, setFilterRank] = useState<Rank | "">("");
  const [filterGrade, setFilterGrade] = useState<MilitaryGrade | "">("");
  const [filterSquadron, setFilterSquadron] = useState<string>("");
  const [filterActiveOnly, setFilterActiveOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const handleEdit = (id: string) => {
    setEditingMilitary(id);
    setOpenDialog(true);
  };

  const handleAdd = () => {
    setEditingMilitary(null);
    setOpenDialog(true);
  };

  const handleDetails = (military: Military) => {
    setSelectedMilitary(military);
    setOpenDetailsDialog(true);
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
  
  // Filter by active status
  if (filterActiveOnly) {
    filteredMilitaries = filteredMilitaries.filter(m => m.isActive);
  }
  
  // Filter by rank if selected
  if (filterRank) {
    filteredMilitaries = filteredMilitaries.filter(m => m.rank === filterRank);
  }
  
  // Filter by grade if selected
  if (filterGrade) {
    filteredMilitaries = filteredMilitaries.filter(m => getRankGrade(m.rank) === filterGrade);
  }

  // Filter by squadron if selected
  if (filterSquadron) {
    filteredMilitaries = filteredMilitaries.filter(m => m.squadron === filterSquadron);
  }
  
  // Filter by search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filteredMilitaries = filteredMilitaries.filter(m => 
      m.name.toLowerCase().includes(query) || 
      m.rank.toLowerCase().includes(query) ||
      m.branch.toLowerCase().includes(query) ||
      m.degree.toLowerCase().includes(query) ||
      m.squadron.toLowerCase().includes(query) ||
      (m.warName && m.warName.toLowerCase().includes(query))
    );
  }
  
  // Sort by rank according to the defined order, then by formation year
  filteredMilitaries = [...filteredMilitaries].sort((a, b) => {
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

  const squadronOptions = ["Base Adm", "ECAp", "EHEG", "EHRA", "EM", "EMS"];

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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4 items-end">
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
            <label className="block text-sm font-medium mb-1">Posto/Graduação:</label>
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

          <div>
            <label className="block text-sm font-medium mb-1">Esquadrilha:</label>
            <select
              value={filterSquadron}
              onChange={(e) => setFilterSquadron(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-military-blue"
            >
              <option value="">Todas</option>
              {squadronOptions.map((squadron) => (
                <option key={squadron} value={squadron}>{squadron}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="filterActive"
              checked={filterActiveOnly}
              onChange={(e) => setFilterActiveOnly(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="filterActive" className="text-sm font-medium">Apenas ativos</label>
          </div>
          
          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setFilterRank("");
                setFilterGrade("");
                setFilterSquadron("");
                setSearchQuery("");
                setFilterActiveOnly(true);
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
                <TableHead>Esquadrilha</TableHead>
                <TableHead>Arma</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última Participação</TableHead>
                <TableHead>Dias em Folga</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMilitaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    Nenhum militar encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredMilitaries.map((military) => {
                  const restDays = calculateRestDays(military.lastProcessDate);
                  const restTimeClass = getRestTimeClass(restDays);
                  
                  return (
                    <TableRow key={military.id}>
                      <TableCell>
                        {military.warName ? (
                          <>
                            {military.name} (<span className="font-bold">{military.warName}</span>)
                          </>
                        ) : (
                          military.name
                        )}
                      </TableCell>
                      <TableCell>{military.rank}</TableCell>
                      <TableCell>{military.squadron}</TableCell>
                      <TableCell>{military.branch}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${military.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {military.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(military.lastProcessDate)}</TableCell>
                      <TableCell className={restTimeClass}>
                        {restDays} {restDays === 1 ? 'dia' : 'dias'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDetails(military)}
                          >
                            Detalhes
                          </Button>
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

      <Dialog open={openDetailsDialog} onOpenChange={setOpenDetailsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Militar</DialogTitle>
          </DialogHeader>
          {selectedMilitary && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nome:</label>
                  <p className="text-lg">{selectedMilitary.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Nome de Guerra:</label>
                  <p className="text-lg">
                    {selectedMilitary.warName ? (
                      <span className="font-bold">{selectedMilitary.warName}</span>
                    ) : (
                      "Não informado"
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Posto/Graduação:</label>
                  <p className="text-lg">{selectedMilitary.rank}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Grau:</label>
                  <p className="text-lg">{selectedMilitary.degree}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Arma:</label>
                  <p className="text-lg">{selectedMilitary.branch}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Esquadrilha:</label>
                  <p className="text-lg">{selectedMilitary.squadron}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ano de Formação:</label>
                  <p className="text-lg">{selectedMilitary.formationYear || "Não informado"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status:</label>
                  <p className="text-lg">
                    <span className={`px-2 py-1 rounded text-sm ${selectedMilitary.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {selectedMilitary.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Última Participação:</label>
                <p className="text-lg">{formatDate(selectedMilitary.lastProcessDate)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ImportCSVModal 
        open={openImportDialog}
        onOpenChange={setOpenImportDialog}
      />
    </div>
  );
}
