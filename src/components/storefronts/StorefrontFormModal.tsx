'use client';

import { useState, useEffect } from 'react';
import type { Blueprint, Storefront, StorefrontListing } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  storefront?: Storefront | null;
  blueprints: Blueprint[];
}

interface ListingDraft {
  blueprint_id: string;
  price: string;
  quantity_available: string;
  notes: string;
}

export default function StorefrontFormModal({ open, onClose, onSaved, storefront, blueprints }: Props) {
  const isEdit = !!storefront;
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Listings management
  const [existingListings, setExistingListings] = useState<StorefrontListing[]>([]);
  const [newListing, setNewListing] = useState<ListingDraft>({ blueprint_id: '', price: '', quantity_available: '', notes: '' });

  useEffect(() => {
    if (open) {
      setName(storefront?.name ?? '');
      setLocation(storefront?.location ?? '');
      setNotes(storefront?.notes ?? '');
      setIsOpen(storefront?.is_open ?? true);
      setExistingListings(storefront?.listings ?? []);
      setNewListing({ blueprint_id: '', price: '', quantity_available: '', notes: '' });
      setError('');
    }
  }, [open, storefront]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');

    const payload = {
      name: name.trim(),
      location: location.trim() || null,
      notes: notes.trim() || null,
      is_open: isOpen,
    };

    const { error: err } = isEdit
      ? await supabase.from('storefronts').update(payload).eq('id', storefront!.id)
      : await supabase.from('storefronts').insert(payload);

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
    onClose();
  }

  async function handleAddListing() {
    if (!storefront || !newListing.blueprint_id) return;
    const { error: err } = await supabase.from('storefront_listings').upsert(
      {
        storefront_id: storefront.id,
        blueprint_id: newListing.blueprint_id,
        price: newListing.price ? parseFloat(newListing.price) : null,
        quantity_available: newListing.quantity_available ? parseInt(newListing.quantity_available) : null,
        notes: newListing.notes.trim() || null,
      },
      { onConflict: 'storefront_id,blueprint_id' }
    );
    if (!err) {
      onSaved();
      // Re-fetch listings
      const { data } = await supabase
        .from('storefront_listings')
        .select('*, blueprint:blueprints(*)')
        .eq('storefront_id', storefront.id);
      setExistingListings((data as StorefrontListing[]) ?? []);
      setNewListing({ blueprint_id: '', price: '', quantity_available: '', notes: '' });
    }
  }

  async function handleRemoveListing(listingId: string) {
    await supabase.from('storefront_listings').delete().eq('id', listingId);
    setExistingListings((prev) => prev.filter((l) => l.id !== listingId));
    onSaved();
  }

  const assignedBlueprintIds = new Set(existingListings.map((l) => l.blueprint_id));
  const availableBlueprints = blueprints.filter((b) => !assignedBlueprintIds.has(b.id));

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Storefront' : 'New Storefront'} size="lg">
      <div className="space-y-5">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Storefront Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Crossroads Market" required />
            <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Sector 7" />
          </div>
          <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Operating hours, contact, etc." />
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isOpen}
              onChange={(e) => setIsOpen(e.target.checked)}
              className="h-4 w-4 rounded border-gray-600 bg-surface-700 text-accent-500 focus:ring-accent-500"
            />
            <span className="text-sm text-gray-300">Storefront is open / active</span>
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={saving}>{isEdit ? 'Save changes' : 'Create storefront'}</Button>
          </div>
        </form>

        {isEdit && (
          <div className="border-t border-gray-700/50 pt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Listings</p>

            {existingListings.length > 0 ? (
              <div className="space-y-2">
                {existingListings.map((l) => (
                  <div key={l.id} className="flex items-center justify-between bg-surface-700 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge color="purple">{l.blueprint?.name ?? 'Unknown'}</Badge>
                      {l.price != null && <span className="text-xs text-gray-400">${l.price.toLocaleString()}</span>}
                      {l.quantity_available != null && <span className="text-xs text-gray-500">Qty: {l.quantity_available}</span>}
                      {l.notes && <span className="text-xs text-gray-500">{l.notes}</span>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveListing(l.id)}>Remove</Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-600 italic">No listings yet.</p>
            )}

            {availableBlueprints.length > 0 && (
              <div className="bg-surface-700/50 rounded-lg p-3 space-y-2">
                <p className="text-xs text-gray-400">Add listing:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={newListing.blueprint_id}
                    onChange={(e) => setNewListing((d) => ({ ...d, blueprint_id: e.target.value }))}
                    options={availableBlueprints.map((b) => ({ value: b.id, label: b.name }))}
                    placeholder="Select blueprint..."
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={newListing.price}
                    onChange={(e) => setNewListing((d) => ({ ...d, price: e.target.value }))}
                    placeholder="Price"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={newListing.quantity_available}
                    onChange={(e) => setNewListing((d) => ({ ...d, quantity_available: e.target.value }))}
                    placeholder="Qty available"
                  />
                  <Input
                    value={newListing.notes}
                    onChange={(e) => setNewListing((d) => ({ ...d, notes: e.target.value }))}
                    placeholder="Notes"
                  />
                </div>
                <Button type="button" size="sm" onClick={handleAddListing} disabled={!newListing.blueprint_id}>
                  Add listing
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
