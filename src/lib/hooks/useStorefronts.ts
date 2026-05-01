'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Storefront } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export function useStorefronts() {
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('storefronts')
      .select(`*, listings:storefront_listings(*, blueprint:blueprints(*))`)
      .order('name');
    setStorefronts((data as Storefront[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { storefronts, loading, refresh: fetch };
}
