
import Layout from "@/components/Layout";
import { ProcessList } from "@/components/process/ProcessList";
import { ProcessType } from "@/types";
import { useParams } from "react-router-dom";

export function ProcessTypePage() {
  const { processType } = useParams<{ processType: string }>();
  
  // Decode the process type from URL
  const decodedType = processType ? decodeURIComponent(processType) as ProcessType : undefined;
  
  return (
    <Layout>
      <ProcessList processType={decodedType} />
    </Layout>
  );
}
