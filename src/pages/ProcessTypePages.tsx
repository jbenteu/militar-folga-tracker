
import Layout from "@/components/Layout";
import { ProcessList } from "@/components/process/ProcessList";
import { ProcessType } from "@/types";
import { useParams } from "react-router-dom";
import { Tabs } from "@/components/ui/tabs";

export function ProcessTypePage() {
  const { processType } = useParams<{ processType: string }>();
  
  // Decode the process type from URL
  const decodedType = processType ? decodeURIComponent(processType) as ProcessType : undefined;
  
  return (
    <Layout>
      <Tabs defaultValue="details">
        <ProcessList processType={decodedType} />
      </Tabs>
    </Layout>
  );
}
