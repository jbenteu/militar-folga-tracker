
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useData } from "@/contexts/DataContext";
import { formatDate, getRestTimeClass, sortMilitariesByRankAndRestTime } from "@/lib/utils";
import { ProcessType } from "@/types";
import { useState } from "react";

interface MilitaryRankingProps {
  processType?: ProcessType;
  onSelect?: (militaryId: string) => void;
  selectedIds?: string[];
}

export function MilitaryRanking({ processType, onSelect, selectedIds = [] }: MilitaryRankingProps) {
  const { getMilitariesWithRestTime } = useData();
  const [showAllMilitaries, setShowAllMilitaries] = useState(false);
  
  // Get militaries with rest time and sort them
  const militariesWithRest = getMilitariesWithRestTime();
  const sortedMilitaries = sortMilitariesByRankAndRestTime(militariesWithRest);
  
  // Show only top 10 unless showAll is true
  const displayedMilitaries = showAllMilitaries 
    ? sortedMilitaries 
    : sortedMilitaries.slice(0, 10);
  
  return (
    <Card>
      <CardHeader className="bg-military-navy text-white rounded-t-md">
        <CardTitle>Ranking de Militares por Folga</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
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
            {displayedMilitaries.map((military) => {
              const isSelected = selectedIds.includes(military.id);
              
              return (
                <TableRow 
                  key={military.id} 
                  className={isSelected ? "bg-military-sand/30" : ""}
                >
                  <TableCell>{military.rank}</TableCell>
                  <TableCell>{military.name}</TableCell>
                  <TableCell>{formatDate(military.lastProcessDate)}</TableCell>
                  <TableCell className={getRestTimeClass(military.restDays)}>
                    {military.restDays} {military.restDays === 1 ? 'dia' : 'dias'}
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
        {sortedMilitaries.length > 10 && (
          <div className="py-2 px-4 text-center">
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
