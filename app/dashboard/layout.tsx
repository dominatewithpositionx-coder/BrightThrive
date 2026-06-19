import { Toaster } from 'sonner';
import DashboardShell from './components/shell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardShell>{children}</DashboardShell>
      <Toaster position="top-right" richColors />
    </>
  );
}
