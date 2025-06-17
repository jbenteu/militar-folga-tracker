
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export function SyncProcessHistoryButton() {
  const { synchronizeProcessHistory } = useData();
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      await synchronizeProcessHistory();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSync} 
      disabled={isLoading}
      variant="outline"
      className="flex items-center space-x-2"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      <span>
        {isLoading ? 'Sincronizando...' : 'Sincronizar Histórico'}
      </span>
    </Button>
  );
}
