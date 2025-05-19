
import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard' },
  { href: '/militaries', label: 'Militares' },
  { href: '/processes', label: 'Processos' },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-military-navy text-white py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">Sistema de Controle de Processos Administrativos</h1>
        </div>
      </header>
      
      <nav className="bg-military-blue text-white py-2 shadow-md">
        <div className="container mx-auto px-4 flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "px-4 py-2 mr-2 rounded-md hover:bg-military-light-blue/20 transition-colors",
                location.pathname === item.href && "bg-military-light-blue/30 font-medium"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
      
      <footer className="bg-military-navy text-white py-3 text-sm">
        <div className="container mx-auto px-4 text-center">
          Sistema de Controle de Processos Administrativos © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
