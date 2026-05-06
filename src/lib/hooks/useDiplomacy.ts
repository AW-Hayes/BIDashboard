'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Faction } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export function useDiplomacy() {
  const [factions, setFactions] = useState<Faction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('factions')
      .select(`*, treaties(*)`)
      .order('name');
    setFactions((data as Faction[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { factions, loading, refresh: fetch };
}
