'use client';

import { useState } from 'react';
import { useBlueprints } from '@/lib/hooks/useBlueprints';
import { useResources } from '@/lib/hooks/useResources';
import { useRole } from '@/lib/context/RoleContext';
import type { Blueprint, Resource } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import Table, { type Column } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import BlueprintFormModal from '@/components/blueprints/BlueprintFormModal';

export default function BlueprintsPage() {
  const { blueprints, loading, refresh } = useBlueprints();
  const { resources, refresh: refreshResources } = useResources();
  const role = useRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Blueprint | null>(null);

  function handleResourceCreated(r: Resource) {
    refreshResources();
  }

  async function handleDelete(bp: Blueprint) {
    if (!confirm(`Delete blueprint "${bp.name}"? This cannot be undone.`)) return;
    await supabase.from('blueprints').delete().eq('id', bp.id);
    refresh();
  }

  const columns: Column<Blueprint>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (bp) => <span className="font-medium text-gray-100">{bp.name}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (bp) => <span className="text-gray-400">{bp.description ?? '—'}</span>,
    },
    {
      key: 'output',
      header: 'Output Qty',
      width: '100px',
      render: (bp) => <Badge color="blue">{bp.output_quantity}x</Badge>,
    },
    {
      key: 'materials',
      header: 'Materials',
      render: (bp) => (
        <div className="flex flex-wrap gap-1">
          {bp.materials && bp.materials.length > 0 ? (
            bp.materials.map((m) => (
              <Badge key={m.id} color="purple">
                {m.resource?.name ?? m.material_name} ×{m.quantity}
              </Badge>
            ))
          ) : (
            <span className="text-gray-600 text-xs">None</span>
          )}
        </div>
      ),
    },
    ...(role === 'editor'
      ? [{
          key: 'actions',
          header: '',
          width: '120px',
          render: (bp: Blueprint) => (
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setEditing(bp); setModalOpen(true); }}>Edit</Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(bp)}>Delete</Button>
            </div>
          ),
        }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Blueprints</h2>
          <p className="text-sm text-gray-400 mt-1">Manufacturing recipes and their required materials</p>
        </div>
        {role === 'editor' && (
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            + New Blueprint
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        data={blueprints}
        loading={loading}
        keyExtractor={(bp) => bp.id}
        emptyMessage="No blueprints yet. Create one to get started."
      />

      <BlueprintFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refresh}
        blueprint={editing}
        resources={resources}
        onResourceCreated={handleResourceCreated}
      />
    </div>
  );
}
