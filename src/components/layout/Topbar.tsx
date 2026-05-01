'use client';

import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRole } from '@/lib/context/RoleContext';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface TopbarProps {
  user: User;
}

export default function Topbar({ user }: TopbarProps) {
  const router = useRouter();
  const role = useRole();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <header className="h-14 bg-surface-800 border-b border-gray-700/50 flex items-center justify-end px-6 gap-4">
      <div className="flex items-center gap-3">
        <Badge color={role === 'editor' ? 'blue' : 'gray'}>{role}</Badge>
        <span className="text-sm text-gray-400">{user.email}</span>
      </div>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        Sign out
      </Button>
    </header>
  );
}
