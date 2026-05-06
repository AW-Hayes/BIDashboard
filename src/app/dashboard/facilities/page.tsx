'use client';

import { useState } from 'react';
import { useFacilities } from '@/lib/hooks/useFacilities';
import { useResources } from '@/lib/hooks/useResources';
import { useBlueprints } from '@/lib/hooks/useBlueprints';
import { useTerritory } from '@/lib/hooks/useTerritory';
import { useRole } from '@/lib/context/RoleContext';
import type { Facility } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import Table, { type Column } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import FacilityFormModal from '@/components/facilities/FacilityFormModal';
import AssignResourceModal from '@/components/facilities/AssignResourceModal';
import AssignBlueprintModal from '@/components/facilities/AssignBlueprintModal';

type ModalState = 'none' | 'form' | 'assignResource' | 'assignBlueprint';

export default function FacilitiesPage() {
  const { facilities, loading, refresh } = useFacilities();
  const { resources } = useResources();
  const { blueprints } = useBlueprints();
  const { territories } = useTerritory();
  const role = useRole();

  const [modal, setModal] = useState<ModalState>('none');
  const [selected, setSelected] = useState<Facility | null>(null);

  function openForm(f: Facility | null) { setSelected(f); setModal('form'); }
  function openAssignResource(f: Facility) { setSelected(f); setModal('assignResource'); }
  function openAssignBlueprint(f: Facility) { setSelected(f); setModal('assignBlueprint'); }
  function closeModal() { setModal('none'); setSelected(null); }

  async function handleDelete(f: Facility) {
    if (!confirm(`Delete facility "${f.name}"? This cannot be undone.`)) return;
    await supabase.from('facilities').delete().eq('id', f.id);
    refresh();
  }

  const columns: Column<Facility>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (f) => <span className="font-medium text-gray-100">{f.name}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      width: '160px',
      render: (f) => (
        <Badge color={f.type === 'manufacturing' ? 'blue' : 'green'}>
          {f.type === 'manufacturing' ? 'Manufacturing' : 'Material Production'}
        </Badge>
      ),
    },
    {
      key: 'assignment',
      header: 'Current Assignment',
      render: (f) => {
        if (f.type === 'material_production') {
          return f.resource_assignment ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Producing:</span>
              <Badge color="green">{f.resource_assignment.resource?.name ?? 'Unknown'}</Badge>
              {f.resource_assignment.production_rate && (
                <span className="text-xs text-gray-500">@ {f.resource_assignment.production_rate}/hr</span>
              )}
            </div>
          ) : (
            <span className="text-gray-600 text-xs italic">Unassigned</span>
          );
        }
        return f.blueprint_assignments && f.blueprint_assignments.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {f.blueprint_assignments.map((a) => (
              <Badge key={a.id} color="purple">
                {a.blueprint?.name ?? 'Unknown'} ×{a.quantity_per_run}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-gray-600 text-xs italic">No blueprints assigned</span>
        );
      },
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
          width: '200px',
          render: (f: Facility) => (
            <div className="flex gap-1.5 justify-end flex-wrap">
              {f.type === 'material_production' && (
                <Button variant="secondary" size="sm" onClick={() => openAssignResource(f)}>Assign Resource</Button>
              )}
              {f.type === 'manufacturing' && (
                <Button variant="secondary" size="sm" onClick={() => openAssignBlueprint(f)}>Assign Blueprint</Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => openForm(f)}>Edit</Button>
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
          <h2 className="text-2xl font-bold text-gray-100">Facilities</h2>
          <p className="text-sm text-gray-400 mt-1">Production and manufacturing sites</p>
        </div>
        {role === 'editor' && (
          <Button onClick={() => openForm(null)}>+ New Facility</Button>
        )}
      </div>

      <Table
        columns={columns}
        data={facilities}
        loading={loading}
        keyExtractor={(f) => f.id}
        emptyMessage="No facilities yet. Add one to start tracking production."
      />

      <FacilityFormModal
        open={modal === 'form'}
        onClose={closeModal}
        onSaved={refresh}
        facility={selected}
        territories={territories}
      />
      <AssignResourceModal
        open={modal === 'assignResource'}
        onClose={closeModal}
        onSaved={refresh}
        facility={selected}
        resources={resources}
      />
      <AssignBlueprintModal
        open={modal === 'assignBlueprint'}
        onClose={closeModal}
        onSaved={refresh}
        facility={selected}
        blueprints={blueprints}
      />
    </div>
  );
}
