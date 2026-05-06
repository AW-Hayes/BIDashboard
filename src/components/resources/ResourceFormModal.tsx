'use client';

import { useState, useEffect } from 'react';
import type { Resource } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  resource?: Resource | null;
}

export default function ResourceFormModal({ open, onClose, onSaved, resource }: Props) {
  const isEdit = !!resource;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(resource?.name ?? '');
      setDescription(resource?.description ?? '');
      setCategory(resource?.category ?? '');
      setWeightKg(resource?.weight_kg?.toString() ?? '');
      setError('');
    }
  }, [open, resource]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      category: category.trim() || null,
      weight_kg: weightKg ? parseFloat(weightKg) : null,
    };

    const { error: err } = isEdit
      ? await supabase.from('resources').update(payload).eq('id', resource!.id)
      : await supabase.from('resources').insert(payload);

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Resource' : 'New Resource'}>
      <form onSubmit={handleSave} className="space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Titanium Ore" required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Metal, Gas, Composite" />
          <Input
            label="Weight per unit (KG)"
            type="number"
            min={0}
            step={0.001}
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="e.g. 1.500"
          />
        </div>
        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description..." />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{isEdit ? 'Save changes' : 'Create resource'}</Button>
        </div>
      </form>
    </Modal>
  );
}
