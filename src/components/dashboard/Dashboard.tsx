
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/contexts/DataContext";
import { MilitaryRanking } from "../military/MilitaryRanking";

export function Dashboard() {
  const { militaries, processes } = useData();
  
  // Count active processes
  const activeProcesses = processes.filter(p => !p.endDate);
  
  // Count different process types
  const processCounts = processes.reduce((counts: Record<string, number>, process) => {
    counts[process.type] = (counts[process.type] || 0) + 1;
    return counts;
  }, {});
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <img 
          src="/lovable-uploads/49c5397f-c69e-4a86-9b04-f0be1ca29930.png" 
          alt="SCPA Logo" 
          className="h-16 w-16" 
        />
        <div>
          <h1 className="text-3xl font-bold text-military-navy">SCPA</h1>
          <p className="text-xl text-military-navy/80">Controle de Processos - Fiscalização Administrativa</p>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-military-navy">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total de Militares</CardTitle>
            <CardDescription>Militares cadastrados no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{militaries.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total de Processos</CardTitle>
            <CardDescription>Todos os processos cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{processes.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Processos Ativos</CardTitle>
            <CardDescription>Processos em andamento</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeProcesses.length}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Distribuição por Tipo de Processo</CardTitle>
            <CardDescription>Quantidade de processos por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(processCounts).map(([type, count]) => (
                <div key={type} className="bg-military-light-blue/10 p-3 rounded-md">
                  <p className="text-sm font-medium">{type}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Militares com Maior Tempo de Folga</CardTitle>
            <CardDescription>Ordenados por posto/graduação e tempo de folga</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <MilitaryRanking />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
