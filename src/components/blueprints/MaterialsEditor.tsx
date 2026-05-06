'use client';

import { useState } from 'react';
import type { Resource } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export interface MaterialRow {
  resource_id: string | null;
  material_name: string;
  weight_kg: number;
}

interface MaterialsEditorProps {
  rows: MaterialRow[];
  onChange: (rows: MaterialRow[]) => void;
  resources: Resource[];
  onResourceCreated: (resource: Resource) => void;
}

export default function MaterialsEditor({ rows, onChange, resources, onResourceCreated }: MaterialsEditorProps) {
  const [newResourceName, setNewResourceName] = useState('');
  const [creatingResource, setCreatingResource] = useState<number | null>(null);

  function addRow() {
    onChange([...rows, { resource_id: null, material_name: '', weight_kg: 1 }]);
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  function updateRow(index: number, patch: Partial<MaterialRow>) {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  async function createAndAssignResource(index: number) {
    const name = newResourceName.trim();
    if (!name) return;
    setCreatingResource(index);
    const { data, error } = await supabase
      .from('resources')
      .insert({ name })
      .select()
      .single();
    setCreatingResource(null);
    setNewResourceName('');
    if (!error && data) {
      onResourceCreated(data as Resource);
      updateRow(index, { resource_id: data.id, material_name: data.name });
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">Materials Required</span>
        <Button variant="ghost" size="sm" type="button" onClick={addRow}>
          + Add material
        </Button>
      </div>

      {rows.length === 0 && (
        <p className="text-xs text-gray-500 italic py-2">No materials added yet.</p>
      )}

      {rows.map((row, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="flex-1">
            <select
              value={row.resource_id ?? '__custom__'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__custom__') {
                  updateRow(i, { resource_id: null });
                } else {
                  const res = resources.find((r) => r.id === val);
                  updateRow(i, { resource_id: val, material_name: res?.name ?? '' });
                }
              }}
              className="w-full rounded-md bg-surface-700 border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              <option value="">Select resource...</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
              <option value="__custom__">+ Type custom name</option>
            </select>

            {row.resource_id === null && (
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="New resource name"
                  value={row.material_name || newResourceName}
                  onChange={(e) => {
                    setNewResourceName(e.target.value);
                    updateRow(i, { material_name: e.target.value });
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={creatingResource === i}
                  onClick={() => createAndAssignResource(i)}
                >
                  Save to list
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">KG</label>
            <Input
              type="number"
              min={0.001}
              step={0.001}
              value={row.weight_kg}
              onChange={(e) => updateRow(i, { weight_kg: Math.max(0.001, parseFloat(e.target.value) || 0.001) })}
              className="w-24"
              placeholder="0.000"
            />
          </div>

          <button
            type="button"
            onClick={() => removeRow(i)}
            className="mt-2 text-gray-600 hover:text-red-400 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
