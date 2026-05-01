'use client';

import { useState, useEffect } from 'react';
import type { Facility, Resource } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  facility: Facility | null;
  resources: Resource[];
}

export default function AssignResourceModal({ open, onClose, onSaved, facility, resources }: Props) {
  const [resourceId, setResourceId] = useState('');
  const [productionRate, setProductionRate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && facility) {
      const existing = facility.resource_assignment;
      setResourceId(existing?.resource_id ?? '');
      setProductionRate(existing?.production_rate?.toString() ?? '');
      setNotes(existing?.notes ?? '');
      setError('');
    }
  }, [open, facility]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!resourceId) { setError('Please select a resource.'); return; }
    if (!facility) return;
    setSaving(true);
    setError('');

    const payload = {
      facility_id: facility.id,
      resource_id: resourceId,
      production_rate: productionRate ? parseFloat(productionRate) : null,
      notes: notes.trim() || null,
    };

    // Upsert: if assignment exists update it, otherwise insert
    const { error: err } = await supabase
      .from('facility_resource_assignments')
      .upsert(payload, { onConflict: 'facility_id' });

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
    onClose();
  }

  async function handleUnassign() {
    if (!facility || !confirm('Remove the current resource assignment?')) return;
    await supabase.from('facility_resource_assignments').delete().eq('facility_id', facility.id);
    onSaved();
    onClose();
  }

  const resourceOptions = resources.map((r) => ({ value: r.id, label: r.name }));

  return (
    <Modal open={open} onClose={onClose} title={`Assign Resource — ${facility?.name ?? ''}`}>
      <form onSubmit={handleSave} className="space-y-4">
        <Select
          label="Resource to Produce"
          value={resourceId}
          onChange={(e) => setResourceId(e.target.value)}
          options={resourceOptions}
          placeholder="Select a resource..."
        />
        <Input
          label="Production Rate (optional)"
          type="number"
          min={0}
          step="0.01"
          value={productionRate}
          onChange={(e) => setProductionRate(e.target.value)}
          placeholder="Units per hour / cycle"
        />
        <Input
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes..."
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-between pt-2">
          {facility?.resource_assignment && (
            <Button type="button" variant="danger" size="sm" onClick={handleUnassign}>
              Unassign
            </Button>
          )}
          <div className="flex gap-3 ml-auto">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={saving}>Assign</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
