'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Resource } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export function useResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('resources').select('*').order('name');
    setResources((data as Resource[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { resources, loading, refresh: fetch };
}
