'use client';

import { useState, useEffect } from 'react';
import type { Member, MemberAssignment, Facility, Storefront } from '@/lib/types';
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
  member?: Member | null;
  facilities: Facility[];
  storefronts: Storefront[];
}

export default function MemberFormModal({ open, onClose, onSaved, member, facilities, storefronts }: Props) {
  const isEdit = !!member;
  const [name, setName] = useState('');
  const [rank, setRank] = useState('');
  const [discord, setDiscord] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Assignments
  const [assignments, setAssignments] = useState<MemberAssignment[]>([]);
  const [newAssignType, setNewAssignType] = useState<'facility' | 'storefront'>('facility');
  const [newAssignId, setNewAssignId] = useState('');
  const [newAssignNotes, setNewAssignNotes] = useState('');

  useEffect(() => {
    if (open) {
      setName(member?.name ?? '');
      setRank(member?.rank ?? '');
      setDiscord(member?.discord ?? '');
      setNotes(member?.notes ?? '');
      setAssignments(member?.assignments ?? []);
      setNewAssignId('');
      setNewAssignNotes('');
      setError('');
    }
  }, [open, member]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');

    const payload = {
      name: name.trim(),
      rank: rank.trim() || null,
      discord: discord.trim() || null,
      notes: notes.trim() || null,
    };

    const { error: err } = isEdit
      ? await supabase.from('members').update(payload).eq('id', member!.id)
      : await supabase.from('members').insert(payload);

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
    onClose();
  }

  async function handleAddAssignment() {
    if (!member || !newAssignId) return;
    const payload = {
      member_id: member.id,
      facility_id: newAssignType === 'facility' ? newAssignId : null,
      storefront_id: newAssignType === 'storefront' ? newAssignId : null,
      role_notes: newAssignNotes.trim() || null,
    };
    const { data, error: err } = await supabase
      .from('member_assignments')
      .insert(payload)
      .select('*, facility:facilities(id,name), storefront:storefronts(id,name)')
      .single();
    if (!err && data) {
      setAssignments((prev) => [...prev, data as MemberAssignment]);
      setNewAssignId('');
      setNewAssignNotes('');
      onSaved();
    }
  }

  async function handleRemoveAssignment(id: string) {
    await supabase.from('member_assignments').delete().eq('id', id);
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    onSaved();
  }

  const assignOptions = newAssignType === 'facility'
    ? facilities.map((f) => ({ value: f.id, label: f.name }))
    : storefronts.map((s) => ({ value: s.id, label: s.name }));

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Member' : 'New Member'} size="lg">
      <div className="space-y-5">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="In-game name" required />
            <Input label="Rank / Title" value={rank} onChange={(e) => setRank(e.target.value)} placeholder="e.g. Lord, Commander" />
          </div>
          <Input label="Discord" value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="e.g. username#0000" />
          <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Contributions, activity, context..." />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={saving}>{isEdit ? 'Save changes' : 'Add member'}</Button>
          </div>
        </form>

        {isEdit && (
          <div className="border-t border-gray-700/50 pt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Assignments</p>

            {assignments.length > 0 ? (
              <div className="space-y-2">
                {assignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between bg-surface-700 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Badge color={a.facility_id ? 'blue' : 'purple'}>
                        {a.facility_id ? 'Facility' : 'Storefront'}
                      </Badge>
                      <span className="text-sm text-gray-200">
                        {a.facility?.name ?? a.storefront?.name ?? 'Unknown'}
                      </span>
                      {a.role_notes && <span className="text-xs text-gray-500">{a.role_notes}</span>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveAssignment(a.id)}>Remove</Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-600 italic">No assignments yet.</p>
            )}

            <div className="bg-surface-700/50 rounded-lg p-3 space-y-2">
              <p className="text-xs text-gray-400">Add assignment:</p>
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={newAssignType}
                  onChange={(e) => { setNewAssignType(e.target.value as 'facility' | 'storefront'); setNewAssignId(''); }}
                  options={[{ value: 'facility', label: 'Facility' }, { value: 'storefront', label: 'Storefront' }]}
                />
                <Select
                  value={newAssignId}
                  onChange={(e) => setNewAssignId(e.target.value)}
                  options={assignOptions}
                  placeholder="Select..."
                />
                <Input value={newAssignNotes} onChange={(e) => setNewAssignNotes(e.target.value)} placeholder="Role notes" />
              </div>
              <Button type="button" size="sm" onClick={handleAddAssignment} disabled={!newAssignId}>
                Add assignment
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
