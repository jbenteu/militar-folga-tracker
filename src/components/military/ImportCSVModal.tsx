
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { useData } from "@/contexts/DataContext";
import { parseCSVForMilitaries } from "@/lib/utils";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ImportCSVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImportCSVModal({ open, onOpenChange }: ImportCSVModalProps) {
  const { addMilitary } = useData();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Read and preview the file
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          try {
            const csvText = event.target.result as string;
            const militaries = parseCSVForMilitaries(csvText);
            setPreviewData(militaries);
          } catch (error) {
            toast.error("Erro ao analisar o arquivo CSV");
            console.error(error);
          }
        }
      };
      reader.readAsText(selectedFile);
    }
  };
  
  const handleImport = () => {
    if (previewData.length === 0) {
      toast.error("Nenhum dado para importar");
      return;
    }
    
    let importedCount = 0;
    
    previewData.forEach(military => {
      try {
        addMilitary({
          name: military.name,
          rank: military.rank,
          branch: military.branch,
          degree: military.degree,
          lastProcessDate: null,
        });
        importedCount++;
      } catch (error) {
        console.error("Erro ao importar militar:", military, error);
      }
    });
    
    toast.success(`${importedCount} militares importados com sucesso`);
    setFile(null);
    setPreviewData([]);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar Militares via CSV</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Formato esperado: Nome, Posto/Graduação, Arma, Grau
          </p>
          
          <div className="border-dashed border-2 border-gray-300 p-6 rounded-md">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full"
            />
          </div>
          
          {previewData.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Pré-visualização ({previewData.length} registros):</h3>
              <div className="max-h-60 overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Posto/Graduação</TableHead>
                      <TableHead>Arma</TableHead>
                      <TableHead>Grau</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.rank}</TableCell>
                        <TableCell>{row.branch}</TableCell>
                        <TableCell>{row.degree}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            className="bg-military-navy hover:bg-military-navy/80 text-white"
            onClick={handleImport}
            disabled={previewData.length === 0}
          >
            Importar {previewData.length} Militares
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
