'use client';

import { useState, useEffect } from 'react';
import type { Blueprint, Facility, FacilityBlueprintAssignment } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  facility: Facility | null;
  blueprints: Blueprint[];
}

export default function AssignBlueprintModal({ open, onClose, onSaved, facility, blueprints }: Props) {
  const [blueprintId, setBlueprintId] = useState('');
  const [quantityPerRun, setQuantityPerRun] = useState(1);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setBlueprintId('');
      setQuantityPerRun(1);
      setNotes('');
      setError('');
    }
  }, [open]);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!blueprintId || !facility) { setError('Please select a blueprint.'); return; }
    setSaving(true);
    setError('');

    const { error: err } = await supabase.from('facility_blueprint_assignments').upsert(
      { facility_id: facility.id, blueprint_id: blueprintId, quantity_per_run: quantityPerRun, notes: notes.trim() || null },
      { onConflict: 'facility_id,blueprint_id' }
    );

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
    setBlueprintId('');
    setQuantityPerRun(1);
    setNotes('');
  }

  async function handleRemove(assignment: FacilityBlueprintAssignment) {
    await supabase.from('facility_blueprint_assignments').delete().eq('id', assignment.id);
    onSaved();
  }

  const alreadyAssigned = facility?.blueprint_assignments ?? [];
  const availableBlueprints = blueprints.filter(
    (b) => !alreadyAssigned.some((a) => a.blueprint_id === b.id)
  );

  return (
    <Modal open={open} onClose={onClose} title={`Assign Blueprints — ${facility?.name ?? ''}`} size="lg">
      <div className="space-y-5">
        {alreadyAssigned.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Currently Manufacturing</p>
            <div className="space-y-2">
              {alreadyAssigned.map((a) => (
                <div key={a.id} className="flex items-center justify-between bg-surface-700 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Badge color="purple">{a.blueprint?.name ?? 'Unknown'}</Badge>
                    <span className="text-xs text-gray-500">×{a.quantity_per_run} per run</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemove(a)}>Remove</Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleAssign} className="space-y-3 border-t border-gray-700/50 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Add Blueprint</p>
          <Select
            label="Blueprint"
            value={blueprintId}
            onChange={(e) => setBlueprintId(e.target.value)}
            options={availableBlueprints.map((b) => ({ value: b.id, label: b.name }))}
            placeholder="Select blueprint..."
          />
          <Input
            label="Quantity Per Run"
            type="number"
            min={1}
            value={quantityPerRun}
            onChange={(e) => setQuantityPerRun(Math.max(1, parseInt(e.target.value) || 1))}
          />
          <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional..." />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
            <Button type="submit" loading={saving}>Assign Blueprint</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
