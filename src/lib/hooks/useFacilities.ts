'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Facility } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export function useFacilities() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('facilities')
      .select(`
        *,
        resource_assignment:facility_resource_assignments(*, resource:resources(*)),
        blueprint_assignments:facility_blueprint_assignments(*, blueprint:blueprints(*))
      `)
      .order('name');
    setFacilities((data as Facility[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { facilities, loading, refresh: fetch };
}
