
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useData } from "@/contexts/DataContext";
import { formatDate, getRestTimeClass, sortMilitariesByRankAndRestTime } from "@/lib/utils";
import { MilitaryGrade, ProcessType, getRankGrade } from "@/types";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MilitaryRankingProps {
  processType?: ProcessType;
  onSelect?: (militaryId: string) => void;
  selectedIds?: string[];
}

export function MilitaryRanking({ processType, onSelect, selectedIds = [] }: MilitaryRankingProps) {
  const { getMilitariesWithRestTime } = useData();
  const [showAllMilitaries, setShowAllMilitaries] = useState(false);
  const [filterGrade, setFilterGrade] = useState<MilitaryGrade | "">("");
  const [filterRank, setFilterRank] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get militaries with rest time and sort them
  const militariesWithRest = getMilitariesWithRestTime(processType);
  let sortedMilitaries = sortMilitariesByRankAndRestTime(militariesWithRest, processType ? 'restDaysForProcessType' : 'restDays');
  
  // Always sort by rest time first (most rested at top) when in the assignment tab
  if (onSelect) {
    sortedMilitaries = [...sortedMilitaries].sort((a, b) => {
      const restDaysA = processType && a.restDaysForProcessType !== undefined ? a.restDaysForProcessType : a.restDays;
      const restDaysB = processType && b.restDaysForProcessType !== undefined ? b.restDaysForProcessType : b.restDays;
      return restDaysB - restDaysA;
    });
  }
  
  // Apply filters
  if (filterGrade) {
    sortedMilitaries = sortedMilitaries.filter(m => getRankGrade(m.rank) === filterGrade);
  }
  
  if (filterRank) {
    sortedMilitaries = sortedMilitaries.filter(m => m.rank === filterRank);
  }
  
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    sortedMilitaries = sortedMilitaries.filter(m => 
      m.name.toLowerCase().includes(query) || 
      m.rank.toLowerCase().includes(query) ||
      m.branch.toLowerCase().includes(query) ||
      m.degree.toLowerCase().includes(query)
    );
  }
  
  // Show only top 10 unless showAll is true
  const displayedMilitaries = showAllMilitaries 
    ? sortedMilitaries 
    : sortedMilitaries.slice(0, 10);
  
  return (
    <Card>
      <CardHeader className="bg-military-navy text-white rounded-t-md">
        <CardTitle>Ranking de Militares por Folga {processType ? `(${processType})` : ''}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
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
              onChange={(e) => setFilterRank(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-military-blue"
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
        </div>
        
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Posto/Grad.</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Última Participação</TableHead>
                <TableHead>Dias em Folga</TableHead>
                {onSelect && <TableHead>Ação</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedMilitaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={onSelect ? 5 : 4} className="text-center py-4">
                    Nenhum militar encontrado
                  </TableCell>
                </TableRow>
              ) : displayedMilitaries.map((military) => {
                const isSelected = selectedIds.includes(military.id);
                const restDays = processType && military.restDaysForProcessType !== undefined
                  ? military.restDaysForProcessType
                  : military.restDays;
                
                return (
                  <TableRow 
                    key={military.id} 
                    className={isSelected ? "bg-military-sand/30" : ""}
                  >
                    <TableCell>{military.rank}</TableCell>
                    <TableCell>
                      {military.warName ? (
                        <>
                          {military.name} (<span className="font-bold">{military.warName}</span>)
                        </>
                      ) : (
                        military.name
                      )}
                    </TableCell>
                    <TableCell>
                      {processType && military.processHistory?.[processType]
                        ? formatDate(military.processHistory[processType])
                        : formatDate(military.lastProcessDate)}
                    </TableCell>
                    <TableCell className={getRestTimeClass(restDays)}>
                      {restDays} {restDays === 1 ? 'dia' : 'dias'}
                    </TableCell>
                    {onSelect && (
                      <TableCell>
                        <button
                          className={`px-3 py-1 rounded text-sm ${
                            isSelected 
                              ? "bg-military-red text-white hover:bg-military-red/80" 
                              : "bg-military-blue text-white hover:bg-military-blue/80"
                          }`}
                          onClick={() => onSelect(military.id)}
                        >
                          {isSelected ? "Remover" : "Selecionar"}
                        </button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
        {sortedMilitaries.length > 10 && (
          <div className="py-2 px-4 text-center mt-4">
            <button 
              className="text-military-blue hover:text-military-navy underline text-sm"
              onClick={() => setShowAllMilitaries(!showAllMilitaries)}
            >
              {showAllMilitaries ? "Mostrar apenas os 10 primeiros" : "Ver todos os militares"}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
