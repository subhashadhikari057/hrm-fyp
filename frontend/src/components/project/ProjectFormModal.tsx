'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

export interface ProjectFormPayload {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

interface ProjectFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
  initialValues?: Partial<ProjectFormPayload>;
  onSubmit: (payload: ProjectFormPayload) => Promise<void> | void;
}

export function ProjectFormModal({
  open,
  onOpenChange,
  loading = false,
  mode = 'create',
  initialValues,
  onSubmit,
}: ProjectFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(initialValues?.name ?? '');
    setDescription(initialValues?.description ?? '');
    setStartDate(initialValues?.startDate ?? '');
    setEndDate(initialValues?.endDate ?? '');
  }, [open, initialValues]);

  const isValid = useMemo(() => {
    if (!name.trim()) return false;
    if (startDate && endDate && startDate > endDate) return false;
    return true;
  }, [name, startDate, endDate]);

  const handleSubmit = async () => {
    if (!isValid) {
      return;
    }

    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Project' : 'Update Project'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Project Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Website Revamp"
              maxLength={150}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Add project context and expected outcomes"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">End Date</label>
              <Input
                type="date"
                min={startDate || undefined}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={loading}
              />
              {startDate && endDate && startDate > endDate ? (
                <p className="text-xs text-red-600">End date must be after start date</p>
              ) : null}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="cancel" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="blue" onClick={handleSubmit} disabled={loading || !isValid}>
            {loading ? 'Saving...' : mode === 'create' ? 'Create Project' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
