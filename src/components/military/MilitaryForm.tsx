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
  const [squadron, setSquadron] = useState("");
  const [warName, setWarName] = useState("");
  const [formationYear, setFormationYear] = useState<number | undefined>(undefined);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (militaryId) {
      const military = getMilitaryById(militaryId);
      if (military) {
        setName(military.name);
        setRank(military.rank);
        setBranch(military.branch);
        setSquadron(military.squadron);
        setWarName(military.warName || "");
        setFormationYear(military.formationYear);
        setIsActive(military.isActive);
      }
    } else {
      // Reset form for new military
      setName("");
      setRank("3º Sargento");
      setBranch("Engenharia");
      setSquadron("");
      setWarName("");
      setFormationYear(undefined);
      setIsActive(true);
    }
  }, [militaryId, getMilitaryById]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !branch || !squadron) {
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
            squadron,
            warName: warName || undefined,
            formationYear,
            isActive,
          });
        }
      } else {
        await addMilitary({
          name,
          rank,
          branch,
          degree,
          squadron,
          warName: warName || undefined,
          formationYear,
          isActive,
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

  const squadronOptions = [
    "Base Adm",
    "ECAp",
    "EHEG",
    "EHRA",
    "EM",
    "EMS"
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

          <div className="space-y-2">
            <Label htmlFor="squadron">Esquadrilha</Label>
            <Select 
              value={squadron} 
              onValueChange={(value) => setSquadron(value)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a esquadrilha" />
              </SelectTrigger>
              <SelectContent>
                {squadronOptions.map((squadronOption) => (
                  <SelectItem key={squadronOption} value={squadronOption}>
                    {squadronOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warName">Nome de Guerra (opcional)</Label>
            <Input
              id="warName"
              value={warName}
              onChange={(e) => setWarName(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="formationYear">Ano de Formação (opcional)</Label>
            <Input
              id="formationYear"
              type="number"
              value={formationYear || ""}
              onChange={(e) => setFormationYear(e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={saving}
              min="1950"
              max="2030"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={saving}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isActive">Militar ativo (disponível para escalas)</Label>
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
