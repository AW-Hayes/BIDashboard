'use client';

import { useState, useEffect } from 'react';
import type { Faction, RelationStatus, Treaty } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  faction?: Faction | null;
}

const statusOptions = [
  { value: 'allied', label: 'Allied' },
  { value: 'trade_partner', label: 'Trade Partner' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'hostile', label: 'Hostile' },
  { value: 'at_war', label: 'At War' },
];

const statusColor: Record<RelationStatus, 'green' | 'blue' | 'gray' | 'yellow' | 'red'> = {
  allied: 'green',
  trade_partner: 'blue',
  neutral: 'gray',
  hostile: 'yellow',
  at_war: 'red',
};

export default function FactionFormModal({ open, onClose, onSaved, faction }: Props) {
  const isEdit = !!faction;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<RelationStatus>('neutral');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Treaties
  const [treaties, setTreaties] = useState<Treaty[]>([]);
  const [newTreatyTitle, setNewTreatyTitle] = useState('');
  const [newTreatyDesc, setNewTreatyDesc] = useState('');

  useEffect(() => {
    if (open) {
      setName(faction?.name ?? '');
      setDescription(faction?.description ?? '');
      setStatus(faction?.status ?? 'neutral');
      setNotes(faction?.notes ?? '');
      setTreaties(faction?.treaties ?? []);
      setNewTreatyTitle('');
      setNewTreatyDesc('');
      setError('');
    }
  }, [open, faction]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      status,
      notes: notes.trim() || null,
    };

    const { error: err } = isEdit
      ? await supabase.from('factions').update(payload).eq('id', faction!.id)
      : await supabase.from('factions').insert(payload);

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
    onClose();
  }

  async function handleAddTreaty() {
    if (!faction || !newTreatyTitle.trim()) return;
    const { data, error: err } = await supabase
      .from('treaties')
      .insert({ faction_id: faction.id, title: newTreatyTitle.trim(), description: newTreatyDesc.trim() || null })
      .select()
      .single();
    if (!err && data) {
      setTreaties((prev) => [...prev, data as Treaty]);
      setNewTreatyTitle('');
      setNewTreatyDesc('');
      onSaved();
    }
  }

  async function handleRemoveTreaty(id: string) {
    await supabase.from('treaties').delete().eq('id', id);
    setTreaties((prev) => prev.filter((t) => t.id !== id));
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Faction' : 'New Faction'} size="lg">
      <div className="space-y-5">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Faction Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Iron Pact" required />
            <Select
              label="Relationship Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as RelationStatus)}
              options={statusOptions}
            />
          </div>
          <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Who are they?" />
          <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="History, contact, context..." />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={saving}>{isEdit ? 'Save changes' : 'Add faction'}</Button>
          </div>
        </form>

        {isEdit && (
          <div className="border-t border-gray-700/50 pt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Treaties & Agreements</p>

            {treaties.length > 0 ? (
              <div className="space-y-2">
                {treaties.map((t) => (
                  <div key={t.id} className="flex items-start justify-between bg-surface-700 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-100">{t.title}</p>
                      {t.description && <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveTreaty(t.id)} className="ml-3 flex-shrink-0">
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-600 italic">No treaties on record.</p>
            )}

            <div className="bg-surface-700/50 rounded-lg p-3 space-y-2">
              <p className="text-xs text-gray-400">Add treaty:</p>
              <Input value={newTreatyTitle} onChange={(e) => setNewTreatyTitle(e.target.value)} placeholder="Treaty title" />
              <Textarea value={newTreatyDesc} onChange={(e) => setNewTreatyDesc(e.target.value)} placeholder="Description (optional)" />
              <Button type="button" size="sm" onClick={handleAddTreaty} disabled={!newTreatyTitle.trim()}>
                Add treaty
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
