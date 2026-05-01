'use client';

import { createContext, useContext } from 'react';
import type { UserRole } from '@/lib/types';

export const RoleContext = createContext<UserRole>('viewer');

export function useRole() {
  return useContext(RoleContext);
}
