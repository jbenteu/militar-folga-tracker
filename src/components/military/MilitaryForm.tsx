
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useData } from "@/contexts/DataContext";
import { RANKS_ORDER, Rank, getRankGrade } from "@/types";
import { useEffect, useState } from "react";

interface MilitaryFormProps {
  militaryId: string | null;
  onComplete: () => void;
}

export function MilitaryForm({ militaryId, onComplete }: MilitaryFormProps) {
  const { addMilitary, updateMilitary, getMilitaryById } = useData();
  const [name, setName] = useState("");
  const [rank, setRank] = useState<Rank>("3º Sargento");
  const [branch, setBranch] = useState("Engenharia");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (militaryId) {
      const military = getMilitaryById(militaryId);
      if (military) {
        setName(military.name);
        setRank(military.rank);
        setBranch(military.branch);
      }
    } else {
      // Reset form for new military
      setName("");
      setRank("3º Sargento");
      setBranch("Engenharia");
    }
  }, [militaryId, getMilitaryById]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !branch) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    
    setSaving(true);
    
    try {
      // Automatically determine degree based on rank
      const degree = getRankGrade(rank);
      
      if (militaryId) {
        const military = getMilitaryById(militaryId);
        if (military) {
          await updateMilitary({
            ...military,
            name,
            rank,
            branch,
            degree,
          });
        }
      } else {
        await addMilitary({
          name,
          rank,
          branch,
          degree,
          lastProcessDate: null,
        });
      }
      
      onComplete();
    } catch (error) {
      console.error("Error saving military:", error);
    } finally {
      setSaving(false);
    }
  };

  const branchOptions = [
    "Engenharia",
    "Infantaria",
    "Comunicações",
    "Cavalaria", 
    "Intendência",
    "Saúde",
    "Artilharia",
    "Material Bélico",
    "Aviação",
    "Técnico Temporário"
  ];

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-0 shadow-none">
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={saving}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rank">Posto/Graduação</Label>
            <Select 
              value={rank} 
              onValueChange={(value) => setRank(value as Rank)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o posto/graduação" />
              </SelectTrigger>
              <SelectContent>
                {RANKS_ORDER.map((rankOption) => (
                  <SelectItem key={rankOption} value={rankOption}>
                    {rankOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="branch">Arma</Label>
            <Select 
              value={branch} 
              onValueChange={(value) => setBranch(value)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a arma" />
              </SelectTrigger>
              <SelectContent>
                {branchOptions.map((branchOption) => (
                  <SelectItem key={branchOption} value={branchOption}>
                    {branchOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onComplete}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-military-blue hover:bg-military-navy"
              disabled={saving}
            >
              {saving ? "Salvando..." : (militaryId ? "Atualizar" : "Adicionar")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
