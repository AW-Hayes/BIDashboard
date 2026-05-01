'use client';

import { useState, useEffect } from 'react';
import type { Facility, FacilityType } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  facility?: Facility | null;
}

const typeOptions = [
  { value: 'material_production', label: 'Material Production' },
  { value: 'manufacturing', label: 'Manufacturing' },
];

export default function FacilityFormModal({ open, onClose, onSaved, facility }: Props) {
  const isEdit = !!facility;
  const [name, setName] = useState('');
  const [type, setType] = useState<FacilityType>('material_production');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(facility?.name ?? '');
      setType(facility?.type ?? 'material_production');
      setNotes(facility?.notes ?? '');
      setError('');
    }
  }, [open, facility]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');

    const payload = { name: name.trim(), type, notes: notes.trim() || null };

    const { error: err } = isEdit
      ? await supabase.from('facilities').update(payload).eq('id', facility!.id)
      : await supabase.from('facilities').insert(payload);

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Facility' : 'New Facility'}>
      <form onSubmit={handleSave} className="space-y-4">
        <Input label="Facility Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Outpost Alpha Smelter" required />
        <Select
          label="Facility Type"
          value={type}
          onChange={(e) => setType(e.target.value as FacilityType)}
          options={typeOptions}
        />
        <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Location, shift info, capacity..." />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{isEdit ? 'Save changes' : 'Create facility'}</Button>
        </div>
      </form>
    </Modal>
  );
}
