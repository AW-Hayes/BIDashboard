'use client';

import { useState } from 'react';
import { useResources } from '@/lib/hooks/useResources';
import { useRole } from '@/lib/context/RoleContext';
import type { Resource } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import Table, { type Column } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ResourceFormModal from '@/components/resources/ResourceFormModal';

export default function ResourcesPage() {
  const { resources, loading, refresh } = useResources();
  const role = useRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);

  async function handleDelete(r: Resource) {
    if (!confirm(`Delete resource "${r.name}"? This may affect blueprints that reference it.`)) return;
    await supabase.from('resources').delete().eq('id', r.id);
    refresh();
  }

  const columns: Column<Resource>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (r) => <span className="font-medium text-gray-100">{r.name}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (r) => r.category ? <Badge color="yellow">{r.category}</Badge> : <span className="text-gray-600">—</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (r) => <span className="text-gray-400">{r.description ?? '—'}</span>,
    },
    ...(role === 'editor'
      ? [{
          key: 'actions',
          header: '',
          width: '120px',
          render: (r: Resource) => (
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setEditing(r); setModalOpen(true); }}>Edit</Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(r)}>Delete</Button>
            </div>
          ),
        }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Resources</h2>
          <p className="text-sm text-gray-400 mt-1">Raw materials used in blueprint manufacturing</p>
        </div>
        {role === 'editor' && (
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            + New Resource
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        data={resources}
        loading={loading}
        keyExtractor={(r) => r.id}
        emptyMessage="No resources yet. Add raw materials to get started."
      />

      <ResourceFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refresh}
        resource={editing}
      />
    </div>
  );
}
