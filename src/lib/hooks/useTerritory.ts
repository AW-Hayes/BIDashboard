'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Territory } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export function useTerritory() {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('territories')
      .select(`
        *,
        facilities(id, name, type),
        storefronts(id, name),
        resource_nodes:territory_resources(*, resource:resources(*))
      `)
      .order('name');
    setTerritories((data as Territory[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { territories, loading, refresh: fetch };
}
