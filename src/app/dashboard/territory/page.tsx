'use client';

import { useState } from 'react';
import { useTerritory } from '@/lib/hooks/useTerritory';
import { useResources } from '@/lib/hooks/useResources';
import { useRole } from '@/lib/context/RoleContext';
import type { Territory, TerritoryStatus } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import Table, { type Column } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import TerritoryFormModal from '@/components/territory/TerritoryFormModal';

const statusColor: Record<TerritoryStatus, 'green' | 'yellow' | 'red' | 'gray'> = {
  controlled: 'green',
  developing: 'yellow',
  contested: 'red',
  lost: 'gray',
};

const statusLabel: Record<TerritoryStatus, string> = {
  controlled: 'Controlled',
  developing: 'Developing',
  contested: 'Contested',
  lost: 'Lost',
};

export default function TerritoryPage() {
  const { territories, loading, refresh } = useTerritory();
  const { resources } = useResources();
  const role = useRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Territory | null>(null);

  async function handleDelete(t: Territory) {
    if (!confirm(`Delete territory "${t.name}"? This cannot be undone.`)) return;
    await supabase.from('territories').delete().eq('id', t.id);
    refresh();
  }

  const columns: Column<Territory>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (t) => <span className="font-medium text-gray-100">{t.name}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      render: (t) => <Badge color={statusColor[t.status]}>{statusLabel[t.status]}</Badge>,
    },
    {
      key: 'facilities',
      header: 'Facilities',
      width: '100px',
      render: (t) => (
        <span className="text-gray-400">{t.facilities?.length ?? 0}</span>
      ),
    },
    {
      key: 'storefronts',
      header: 'Storefronts',
      width: '110px',
      render: (t) => (
        <span className="text-gray-400">{t.storefronts?.length ?? 0}</span>
      ),
    },
    {
      key: 'resources',
      header: 'Resource Nodes',
      render: (t) => (
        <div className="flex flex-wrap gap-1">
          {t.resource_nodes && t.resource_nodes.length > 0 ? (
            t.resource_nodes.map((n) => (
              <Badge key={n.id} color="green">{n.resource?.name ?? 'Unknown'}</Badge>
            ))
          ) : (
            <span className="text-gray-600 text-xs">None</span>
          )}
        </div>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (t) => <span className="text-gray-500 text-xs">{t.notes ?? '—'}</span>,
    },
    ...(role === 'editor'
      ? [{
          key: 'actions',
          header: '',
          width: '140px',
          render: (t: Territory) => (
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setEditing(t); setModalOpen(true); }}>Edit</Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(t)}>Delete</Button>
            </div>
          ),
        }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Territory</h2>
          <p className="text-sm text-gray-400 mt-1">Regions and zones controlled by the kingdom</p>
        </div>
        {role === 'editor' && (
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>+ New Territory</Button>
        )}
      </div>

      <Table
        columns={columns}
        data={territories}
        loading={loading}
        keyExtractor={(t) => t.id}
        emptyMessage="No territories yet. Add a region to get started."
      />

      <TerritoryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refresh}
        territory={editing}
        resources={resources}
      />
    </div>
  );
}
