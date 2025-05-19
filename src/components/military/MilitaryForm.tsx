
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !branch) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    
    // Automatically determine degree based on rank
    const degree = getRankGrade(rank);
    
    if (militaryId) {
      const military = getMilitaryById(militaryId);
      if (military) {
        updateMilitary({
          ...military,
          name,
          rank,
          branch,
          degree,
        });
      }
    } else {
      addMilitary({
        name,
        rank,
        branch,
        degree,
        lastProcessDate: null,
      });
    }
    
    onComplete();
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
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rank">Posto/Graduação</Label>
            <Select value={rank} onValueChange={(value) => setRank(value as Rank)}>
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
            <Select value={branch} onValueChange={(value) => setBranch(value)}>
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
            <Button type="button" variant="outline" onClick={onComplete}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-military-blue hover:bg-military-navy">
              {militaryId ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
