'use client';

import { useState } from 'react';
import { useMembers } from '@/lib/hooks/useMembers';
import { useFacilities } from '@/lib/hooks/useFacilities';
import { useStorefronts } from '@/lib/hooks/useStorefronts';
import { useRole } from '@/lib/context/RoleContext';
import type { Member } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import Table, { type Column } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import MemberFormModal from '@/components/members/MemberFormModal';

export default function MembersPage() {
  const { members, loading, refresh } = useMembers();
  const { facilities } = useFacilities();
  const { storefronts } = useStorefronts();
  const role = useRole();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);

  async function handleDelete(m: Member) {
    if (!confirm(`Remove member "${m.name}"? This cannot be undone.`)) return;
    await supabase.from('members').delete().eq('id', m.id);
    refresh();
  }

  const columns: Column<Member>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (m) => <span className="font-medium text-gray-100">{m.name}</span>,
    },
    {
      key: 'rank',
      header: 'Rank',
      width: '130px',
      render: (m) => m.rank ? <Badge color="yellow">{m.rank}</Badge> : <span className="text-gray-600">—</span>,
    },
    {
      key: 'discord',
      header: 'Discord',
      width: '160px',
      render: (m) => <span className="text-gray-400 text-xs font-mono">{m.discord ?? '—'}</span>,
    },
    {
      key: 'assignments',
      header: 'Assigned To',
      render: (m) => (
        <div className="flex flex-wrap gap-1">
          {m.assignments && m.assignments.length > 0 ? (
            m.assignments.map((a) => (
              <Badge key={a.id} color={a.facility_id ? 'blue' : 'purple'}>
                {a.facility?.name ?? a.storefront?.name ?? 'Unknown'}
              </Badge>
            ))
          ) : (
            <span className="text-gray-600 text-xs">Unassigned</span>
          )}
        </div>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (m) => <span className="text-gray-500 text-xs">{m.notes ?? '—'}</span>,
    },
    ...(role === 'editor'
      ? [{
          key: 'actions',
          header: '',
          width: '140px',
          render: (m: Member) => (
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setEditing(m); setModalOpen(true); }}>Edit</Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(m)}>Remove</Button>
            </div>
          ),
        }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Members</h2>
          <p className="text-sm text-gray-400 mt-1">Kingdom roster — ranks, assignments, and contact info</p>
        </div>
        {role === 'editor' && (
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>+ Add Member</Button>
        )}
      </div>

      <Table
        columns={columns}
        data={members}
        loading={loading}
        keyExtractor={(m) => m.id}
        emptyMessage="No members yet. Add players to the kingdom roster."
      />

      <MemberFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refresh}
        member={editing}
        facilities={facilities}
        storefronts={storefronts}
      />
    </div>
  );
}
