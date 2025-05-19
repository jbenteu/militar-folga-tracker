
import { ReactNode } from 'react';
import SidebarLayout from './SidebarLayout';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <SidebarLayout>
      {children}
    </SidebarLayout>
  );
}
