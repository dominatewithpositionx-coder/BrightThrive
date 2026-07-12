import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import DashboardShell from './components/shell';

export const metadata: Metadata = {
  title: 'Dashboard | BrytThrive',
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardShell>{children}</DashboardShell>
      <Toaster position="top-right" richColors />
    </>
  );
}
