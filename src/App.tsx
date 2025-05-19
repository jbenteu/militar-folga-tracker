
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import { DataProvider } from "@/contexts/DataContext";
import MilitariesPage from "@/pages/MilitariesPage";
import ProcessesPage from "@/pages/ProcessesPage";
import NotFound from "@/pages/NotFound";
import { Toaster } from "@/components/ui/sonner";
import { ProcessTypePage } from "@/pages/ProcessTypePages";

export function App() {
  return (
    <DataProvider>
      <Router>
        <Toaster />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/militaries" element={<MilitariesPage />} />
          <Route path="/processes" element={<ProcessesPage />} />
          <Route path="/processes/:processType" element={<ProcessTypePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </DataProvider>
  );
}

export default App;
