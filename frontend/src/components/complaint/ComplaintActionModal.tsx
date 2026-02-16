'use client';

import { useEffect, useState } from 'react';
import type { ComplaintRecord } from '../../lib/api/complaints';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

interface ComplaintActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaint: ComplaintRecord | null;
  loading?: boolean;
  onMarkInProgress: (id: string, note?: string) => Promise<void>;
  onResolve: (id: string, note?: string) => Promise<void>;
  onAddNote: (id: string, note: string) => Promise<void>;
}

export function ComplaintActionModal({
  open,
  onOpenChange,
  complaint,
  loading = false,
  onMarkInProgress,
  onResolve,
  onAddNote,
}: ComplaintActionModalProps) {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) {
      setNote('');
    }
  }, [open]);

  const handleInProgress = async () => {
    if (!complaint) return;
    await onMarkInProgress(complaint.id, note.trim() || undefined);
    setNote('');
    onOpenChange(false);
  };

  const handleResolve = async () => {
    if (!complaint) return;
    await onResolve(complaint.id, note.trim() || undefined);
    setNote('');
    onOpenChange(false);
  };

  const handleAddNote = async () => {
    if (!complaint) return;
    if (!note.trim()) return;
    await onAddNote(complaint.id, note.trim());
    setNote('');
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Complaint Actions</DialogTitle>
        </DialogHeader>

        {!complaint ? (
          <div className="text-sm text-gray-600">Select a complaint first.</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Complaint</p>
              <p className="text-sm font-semibold text-gray-900">{complaint.title}</p>
              <p className="mt-1 text-xs text-gray-600">Current status: {complaint.status}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Public Note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="Add action note"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button
                variant="blue"
                onClick={handleInProgress}
                disabled={loading || complaint.status !== 'OPEN'}
              >
                Set In Progress
              </Button>
              <Button
                variant="green"
                onClick={handleResolve}
                disabled={loading || complaint.status === 'CLOSED'}
              >
                Resolve & Close
              </Button>
              <Button
                variant="default"
                onClick={handleAddNote}
                disabled={loading || !note.trim()}
              >
                Add Note
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="cancel" onClick={() => onOpenChange(false)} disabled={loading}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
