
import Layout from "@/components/Layout";
import { ProcessForm } from "@/components/process/ProcessForm";
import { ProcessType } from "@/types";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CreateProcessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { processType } = location.state || {};

  const handleComplete = () => {
    if (processType) {
      navigate(`/processes/${encodeURIComponent(processType)}`);
    } else {
      navigate('/processes');
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-military-navy">
          {processType ? `Criar Processo: ${processType}` : 'Criar Novo Processo'}
        </h1>
        <p className="text-gray-600">
          Preencha os detalhes abaixo para criar um novo processo.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <Tabs defaultValue="details">
          <ProcessForm
            processId={null}
            processType={processType as ProcessType | undefined}
            onComplete={handleComplete}
          />
        </Tabs>
      </div>
    </Layout>
  );
};

export default CreateProcessPage;
