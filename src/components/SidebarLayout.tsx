
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-screen">
        <Sidebar />
      </div>
      
      {/* Mobile Header with Sidebar */}
      <header className="bg-military-navy text-white py-3 px-4 shadow lg:hidden">
        <div className="flex items-center">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white mr-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-full sm:w-80 border-r-0">
              <Sidebar mobile onClose={() => setIsOpen(false)} />
            </SheetContent>
          </Sheet>
          <h1 className="text-xl font-bold">Sistema de Controle de Processos Administrativos</h1>
        </div>
      </header>
      
      {/* Main Content - Full Width */}
      <main className="flex-1 container-fluid mx-auto px-4 py-6 overflow-auto">
        {children}
      </main>
      
      {/* Footer - Full Width */}
      <footer className="bg-military-navy text-white py-3 text-sm mt-auto">
        <div className="container-fluid mx-auto px-4 text-center">
          Sistema de Controle de Processos Administrativos © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
