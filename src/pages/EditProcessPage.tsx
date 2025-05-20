
import Layout from "@/components/Layout";
import { ProcessForm } from "@/components/process/ProcessForm";
import { ProcessType } from "@/types";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { Tabs } from "@/components/ui/tabs";
import { useData } from "@/contexts/DataContext";

const EditProcessPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { getProcessById } = useData();
  const { processType } = location.state || {};

  // Get the process to determine its type
  const process = getProcessById(id || '');
  const currentProcessType = process?.type || processType;

  const handleComplete = () => {
    if (currentProcessType) {
      navigate(`/processes/${encodeURIComponent(currentProcessType)}`);
    } else {
      navigate('/processes');
    }
  };

  if (!id) {
    return <div>Processo não encontrado</div>;
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-military-navy">
          {process ? `Editar Processo: ${process.number}` : 'Editar Processo'}
        </h1>
        <p className="text-gray-600">
          Edite os detalhes do processo abaixo.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <Tabs defaultValue="details">
          <ProcessForm
            processId={id}
            processType={currentProcessType as ProcessType | undefined}
            onComplete={handleComplete}
          />
        </Tabs>
      </div>
    </Layout>
  );
};

export default EditProcessPage;
