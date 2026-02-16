'use client';

import { useEffect, useState } from 'react';
import type { ComplaintPriority } from '../../lib/api/complaints';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

interface EmployeeComplaintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  onSubmit: (payload: {
    title: string;
    description: string;
    priority: ComplaintPriority;
  }) => Promise<void> | void;
}

export function EmployeeComplaintModal({
  open,
  onOpenChange,
  loading = false,
  onSubmit,
}: EmployeeComplaintModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>('MEDIUM');

  useEffect(() => {
    if (!open) {
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    if (!description.trim()) return;

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Complaint Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short complaint title"
              maxLength={200}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Priority</label>
            <select
              className="block h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={priority}
              onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
              disabled={loading}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder="Describe your complaint clearly"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="cancel" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="blue"
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !description.trim()}
          >
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
