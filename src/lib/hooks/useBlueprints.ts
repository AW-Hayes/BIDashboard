'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Blueprint } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export function useBlueprints() {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('blueprints')
      .select(`*, materials:blueprint_materials(*, resource:resources(*))`)
      .order('name');
    setBlueprints((data as Blueprint[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { blueprints, loading, refresh: fetch };
}
