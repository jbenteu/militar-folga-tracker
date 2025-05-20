
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ProcessType } from '@/types';
import { 
  FileText, 
  Users, 
  Home,
  PanelLeft,
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobile, onClose }: SidebarProps) {
  const location = useLocation();
  
  // Main navigation items
  const mainNavItems = [
    { href: '/', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/militaries', label: 'Militares', icon: <Users className="h-5 w-5" /> },
    { href: '/processes', label: 'Todos Processos', icon: <FileText className="h-5 w-5" /> },
  ];
  
  // Process type navigation items
  const processTypes: { type: ProcessType, label: string }[] = [
    { type: 'TEAM', label: 'TEAM' },
    { type: 'TREM', label: 'TREM' },
    { type: 'PT', label: 'PT' },
    { type: 'Comissão de Conferência de Gêneros QR', label: 'Conferência de Gêneros' },
    { type: 'Comissão de Conferência de Munição', label: 'Conferência de Munição' },
  ];
  
  const processNavItems = processTypes.map(item => ({
    href: `/processes/${encodeURIComponent(item.type)}`,
    label: item.label,
    icon: <FileText className="h-4 w-4" />,
  }));
  
  return (
    <div className={cn(
      "flex flex-col h-full bg-military-navy text-white", 
      mobile ? "w-full" : "w-64 min-w-64 h-screen"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-military-light-blue/20">
        <h1 className="text-xl font-bold">SCPA</h1>
        {mobile && (
          <button onClick={onClose} className="p-1">
            <X className="h-6 w-6" />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-4">
          <h2 className="px-2 text-xs font-semibold uppercase tracking-wider text-military-sand mb-2">
            Principal
          </h2>
          <nav className="space-y-1">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center px-2 py-2 text-sm rounded-md w-full",
                  location.pathname === item.href
                    ? "bg-military-light-blue text-white font-medium"
                    : "text-military-sand hover:bg-military-light-blue/20"
                )}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="px-4">
          <h2 className="px-2 text-xs font-semibold uppercase tracking-wider text-military-sand mb-2">
            Tipos de Processos
          </h2>
          <nav className="space-y-1">
            {processNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center px-2 py-2 text-sm rounded-md w-full",
                  location.pathname === item.href
                    ? "bg-military-light-blue text-white font-medium"
                    : "text-military-sand hover:bg-military-light-blue/20"
                )}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
      
      <div className="p-4 border-t border-military-light-blue/20">
        <div className="text-xs text-military-sand text-center">
          Sistema de Controle de Processos Administrativos
        </div>
      </div>
    </div>
  );
}
