
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";
import { formatDate } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ProcessDetailsProps {
  processId: string;
  onEdit?: () => void;
}

export function ProcessDetails({ processId, onEdit }: ProcessDetailsProps) {
  const { getProcessById, militaries } = useData();
  const [process, setProcess] = useState(getProcessById(processId));
  
  useEffect(() => {
    setProcess(getProcessById(processId));
  }, [processId, getProcessById]);
  
  if (!process) {
    return <div>Processo não encontrado</div>;
  }
  
  const assignedMilitaries = militaries.filter(m => 
    process.assignedMilitaries.includes(m.id)
  );
  
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm text-gray-500">Tipo de Processo</h3>
              <p className="font-medium">{process.type}</p>
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Classe</h3>
              <p className="font-medium">{process.class}</p>
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Número</h3>
              <p className="font-medium">{process.number}</p>
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Status</h3>
              <p className="font-medium">
                {process.endDate 
                  ? <span className="text-green-600">Concluído</span> 
                  : <span className="text-amber-600">Em Andamento</span>}
              </p>
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Data de Início</h3>
              <p className="font-medium">{formatDate(process.startDate)}</p>
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Data de Fim</h3>
              <p className="font-medium">{formatDate(process.endDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Militares Designados</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignedMilitaries.map(military => (
            <Card key={military.id} className="military-card">
              <CardContent className="pt-4">
                <h4 className="font-bold">{military.rank} {military.name}</h4>
                <p className="text-sm">{military.branch} | {military.degree}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {onEdit && (
        <div className="flex justify-end">
          <Button onClick={onEdit} className="bg-military-blue hover:bg-military-navy">
            Editar Processo
          </Button>
        </div>
      )}
    </div>
  );
}
