'use client';

import { useState } from 'react';
import { useDiplomacy } from '@/lib/hooks/useDiplomacy';
import { useRole } from '@/lib/context/RoleContext';
import type { Faction, RelationStatus } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import Table, { type Column } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import FactionFormModal from '@/components/diplomacy/FactionFormModal';

const statusColor: Record<RelationStatus, 'green' | 'blue' | 'gray' | 'yellow' | 'red'> = {
  allied: 'green',
  trade_partner: 'blue',
  neutral: 'gray',
  hostile: 'yellow',
  at_war: 'red',
};

const statusLabel: Record<RelationStatus, string> = {
  allied: 'Allied',
  trade_partner: 'Trade Partner',
  neutral: 'Neutral',
  hostile: 'Hostile',
  at_war: 'At War',
};

export default function DiplomacyPage() {
  const { factions, loading, refresh } = useDiplomacy();
  const role = useRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Faction | null>(null);

  async function handleDelete(f: Faction) {
    if (!confirm(`Remove faction "${f.name}"? All treaties will also be deleted.`)) return;
    await supabase.from('factions').delete().eq('id', f.id);
    refresh();
  }

  const columns: Column<Faction>[] = [
    {
      key: 'name',
      header: 'Faction',
      render: (f) => <span className="font-medium text-gray-100">{f.name}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '140px',
      render: (f) => <Badge color={statusColor[f.status]}>{statusLabel[f.status]}</Badge>,
    },
    {
      key: 'treaties',
      header: 'Treaties',
      width: '100px',
      render: (f) => (
        <span className="text-gray-400">
          {f.treaties && f.treaties.length > 0
            ? `${f.treaties.length} treaty${f.treaties.length !== 1 ? 'ies' : ''}`
            : <span className="text-gray-600">None</span>}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (f) => <span className="text-gray-400 text-xs">{f.description ?? '—'}</span>,
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (f) => <span className="text-gray-500 text-xs">{f.notes ?? '—'}</span>,
    },
    ...(role === 'editor'
      ? [{
          key: 'actions',
          header: '',
          width: '140px',
          render: (f: Faction) => (
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setEditing(f); setModalOpen(true); }}>Edit</Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(f)}>Delete</Button>
            </div>
          ),
        }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Diplomacy</h2>
          <p className="text-sm text-gray-400 mt-1">External factions, alliances, and treaties</p>
        </div>
        {role === 'editor' && (
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>+ Add Faction</Button>
        )}
      </div>

      <Table
        columns={columns}
        data={factions}
        loading={loading}
        keyExtractor={(f) => f.id}
        emptyMessage="No factions tracked yet. Add external kingdoms or groups."
      />

      <FactionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refresh}
        faction={editing}
      />
    </div>
  );
}
