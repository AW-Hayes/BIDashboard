'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Member } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('members')
      .select(`
        *,
        assignments:member_assignments(
          *,
          facility:facilities(id, name),
          storefront:storefronts(id, name)
        )
      `)
      .order('name');
    setMembers((data as Member[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { members, loading, refresh: fetch };
}
