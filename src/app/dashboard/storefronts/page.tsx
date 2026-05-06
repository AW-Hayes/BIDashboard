'use client';

import { useState } from 'react';
import { useStorefronts } from '@/lib/hooks/useStorefronts';
import { useBlueprints } from '@/lib/hooks/useBlueprints';
import { useTerritory } from '@/lib/hooks/useTerritory';
import { useRole } from '@/lib/context/RoleContext';
import type { Storefront } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import Table, { type Column } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import StorefrontFormModal from '@/components/storefronts/StorefrontFormModal';

export default function StorefrontsPage() {
  const { storefronts, loading, refresh } = useStorefronts();
  const { blueprints } = useBlueprints();
  const { territories } = useTerritory();
  const role = useRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Storefront | null>(null);

  async function handleDelete(s: Storefront) {
    if (!confirm(`Delete storefront "${s.name}"? This cannot be undone.`)) return;
    await supabase.from('storefronts').delete().eq('id', s.id);
    refresh();
  }

  const columns: Column<Storefront>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (s) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-100">{s.name}</span>
          <Badge color={s.is_open ? 'green' : 'gray'}>{s.is_open ? 'Open' : 'Closed'}</Badge>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (s) => <span className="text-gray-400">{s.location ?? '—'}</span>,
    },
    {
      key: 'listings',
      header: 'Listings',
      render: (s) => (
        <div className="flex flex-wrap gap-1">
          {s.listings && s.listings.length > 0 ? (
            s.listings.map((l) => (
              <Badge key={l.id} color="purple">
                {l.blueprint?.name ?? 'Unknown'}
                {l.price != null && ` — $${l.price.toLocaleString()}`}
                {l.quantity_available != null && ` (${l.quantity_available})`}
              </Badge>
            ))
          ) : (
            <span className="text-gray-600 text-xs">No listings</span>
          )}
        </div>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (s) => <span className="text-gray-500 text-xs">{s.notes ?? '—'}</span>,
    },
    ...(role === 'editor'
      ? [{
          key: 'actions',
          header: '',
          width: '140px',
          render: (s: Storefront) => (
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setEditing(s); setModalOpen(true); }}>Edit</Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(s)}>Delete</Button>
            </div>
          ),
        }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Storefronts</h2>
          <p className="text-sm text-gray-400 mt-1">Sales locations and their blueprint listings</p>
        </div>
        {role === 'editor' && (
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            + New Storefront
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        data={storefronts}
        loading={loading}
        keyExtractor={(s) => s.id}
        emptyMessage="No storefronts yet. Create one to track your sales locations."
      />

      <StorefrontFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refresh}
        storefront={editing}
        blueprints={blueprints}
        territories={territories}
      />
    </div>
  );
}
