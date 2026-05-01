'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useUserRole } from '@/lib/hooks/useUserRole';
import { RoleContext } from '@/lib/context/RoleContext';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const role = useUserRole(user?.id);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <RoleContext.Provider value={role}>
      <div className="flex h-screen bg-surface-900 overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Topbar user={user} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </RoleContext.Provider>
  );
}
