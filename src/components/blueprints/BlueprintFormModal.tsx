'use client';

import { useState, useEffect } from 'react';
import type { Blueprint, Resource } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import MaterialsEditor, { type MaterialRow } from './MaterialsEditor';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  blueprint?: Blueprint | null;
  resources: Resource[];
  onResourceCreated: (r: Resource) => void;
}

export default function BlueprintFormModal({ open, onClose, onSaved, blueprint, resources, onResourceCreated }: Props) {
  const isEdit = !!blueprint;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [outputQty, setOutputQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(blueprint?.name ?? '');
      setDescription(blueprint?.description ?? '');
      setOutputQty(blueprint?.output_quantity ?? 1);
      setNotes(blueprint?.notes ?? '');
      setMaterials(
        blueprint?.materials?.map((m) => ({
          resource_id: m.resource_id,
          material_name: m.material_name ?? m.resource?.name ?? '',
          weight_kg: m.weight_kg,
        })) ?? []
      );
      setError('');
    }
  }, [open, blueprint]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');

    let blueprintId = blueprint?.id;

    if (isEdit) {
      const { error: err } = await supabase
        .from('blueprints')
        .update({ name: name.trim(), description: description.trim() || null, output_quantity: outputQty, notes: notes.trim() || null })
        .eq('id', blueprintId!);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { data, error: err } = await supabase
        .from('blueprints')
        .insert({ name: name.trim(), description: description.trim() || null, output_quantity: outputQty, notes: notes.trim() || null })
        .select()
        .single();
      if (err || !data) { setError(err?.message ?? 'Failed to create blueprint.'); setSaving(false); return; }
      blueprintId = data.id;
    }

    // Replace all materials: delete existing then insert new
    await supabase.from('blueprint_materials').delete().eq('blueprint_id', blueprintId!);

    const validMaterials = materials.filter((m) => m.resource_id || m.material_name.trim());
    if (validMaterials.length > 0) {
      const { error: matErr } = await supabase.from('blueprint_materials').insert(
        validMaterials.map((m) => ({
          blueprint_id: blueprintId!,
          resource_id: m.resource_id || null,
          material_name: m.resource_id ? null : m.material_name.trim() || null,
          weight_kg: m.weight_kg,
        }))
      );
      if (matErr) { setError(matErr.message); setSaving(false); return; }
    }

    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Blueprint' : 'New Blueprint'} size="lg">
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Advanced Reactor" required />
          </div>
          <div>
            <Input label="Output Quantity" type="number" min={1} value={outputQty} onChange={(e) => setOutputQty(Math.max(1, parseInt(e.target.value) || 1))} />
          </div>
        </div>
        <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this blueprint produce?" />
        <div className="border-t border-gray-700/50 pt-4">
          <MaterialsEditor
            rows={materials}
            onChange={setMaterials}
            resources={resources}
            onResourceCreated={onResourceCreated}
          />
        </div>
        <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{isEdit ? 'Save changes' : 'Create blueprint'}</Button>
        </div>
      </form>
    </Modal>
  );
}
