'use client';

import { useState, useEffect } from 'react';
import type { UserRole } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export function useUserRole(userId: string | undefined): UserRole {
  const [role, setRole] = useState<UserRole>('viewer');

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        if (data?.role) setRole(data.role as UserRole);
      });
  }, [userId]);

  return role;
}
