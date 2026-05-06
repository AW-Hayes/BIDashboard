'use client';

import { useState, useEffect } from 'react';
import type { Territory, TerritoryResource, Resource, TerritoryStatus } from '@/lib/types';
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
  territory?: Territory | null;
  resources: Resource[];
}

const statusOptions = [
  { value: 'controlled', label: 'Controlled' },
  { value: 'developing', label: 'Developing' },
  { value: 'contested', label: 'Contested' },
  { value: 'lost', label: 'Lost' },
];

const statusColor: Record<TerritoryStatus, 'green' | 'yellow' | 'red' | 'gray'> = {
  controlled: 'green',
  developing: 'yellow',
  contested: 'red',
  lost: 'gray',
};

export default function TerritoryFormModal({ open, onClose, onSaved, territory, resources }: Props) {
  const isEdit = !!territory;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TerritoryStatus>('controlled');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Resource nodes
  const [nodes, setNodes] = useState<TerritoryResource[]>([]);
  const [newNodeResourceId, setNewNodeResourceId] = useState('');
  const [newNodeNotes, setNewNodeNotes] = useState('');

  useEffect(() => {
    if (open) {
      setName(territory?.name ?? '');
      setDescription(territory?.description ?? '');
      setStatus(territory?.status ?? 'controlled');
      setNotes(territory?.notes ?? '');
      setNodes(territory?.resource_nodes ?? []);
      setNewNodeResourceId('');
      setNewNodeNotes('');
      setError('');
    }
  }, [open, territory]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');

    const payload = { name: name.trim(), description: description.trim() || null, status, notes: notes.trim() || null };
    const { error: err } = isEdit
      ? await supabase.from('territories').update(payload).eq('id', territory!.id)
      : await supabase.from('territories').insert(payload);

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
    onClose();
  }

  async function handleAddNode() {
    if (!territory || !newNodeResourceId) return;
    const { data, error: err } = await supabase
      .from('territory_resources')
      .insert({ territory_id: territory.id, resource_id: newNodeResourceId, notes: newNodeNotes.trim() || null })
      .select('*, resource:resources(*)')
      .single();
    if (!err && data) {
      setNodes((prev) => [...prev, data as TerritoryResource]);
      setNewNodeResourceId('');
      setNewNodeNotes('');
      onSaved();
    }
  }

  async function handleRemoveNode(nodeId: string) {
    await supabase.from('territory_resources').delete().eq('id', nodeId);
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    onSaved();
  }

  const assignedResourceIds = new Set(nodes.map((n) => n.resource_id));
  const availableResources = resources.filter((r) => !assignedResourceIds.has(r.id));

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Territory' : 'New Territory'} size="lg">
      <div className="space-y-5">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Northern Reach" required />
            <Select
              label="Control Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TerritoryStatus)}
              options={statusOptions}
            />
          </div>
          <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this region?" />
          <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Strategic notes, access info..." />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={saving}>{isEdit ? 'Save changes' : 'Create territory'}</Button>
          </div>
        </form>

        {isEdit && (
          <div className="border-t border-gray-700/50 pt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Resource Nodes</p>
            {nodes.length > 0 ? (
              <div className="space-y-2">
                {nodes.map((n) => (
                  <div key={n.id} className="flex items-center justify-between bg-surface-700 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Badge color="green">{n.resource?.name ?? 'Unknown'}</Badge>
                      {n.notes && <span className="text-xs text-gray-500">{n.notes}</span>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveNode(n.id)}>Remove</Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-600 italic">No resource nodes assigned.</p>
            )}

            {availableResources.length > 0 && (
              <div className="bg-surface-700/50 rounded-lg p-3 space-y-2">
                <p className="text-xs text-gray-400">Add resource node:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={newNodeResourceId}
                    onChange={(e) => setNewNodeResourceId(e.target.value)}
                    options={availableResources.map((r) => ({ value: r.id, label: r.name }))}
                    placeholder="Select resource..."
                  />
                  <Input value={newNodeNotes} onChange={(e) => setNewNodeNotes(e.target.value)} placeholder="Notes (optional)" />
                </div>
                <Button type="button" size="sm" onClick={handleAddNode} disabled={!newNodeResourceId}>
                  Add node
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
