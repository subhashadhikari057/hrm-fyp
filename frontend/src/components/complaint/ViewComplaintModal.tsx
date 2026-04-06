'use client';

import { useEffect, useState } from 'react';
import type { ComplaintRecord } from '../../lib/api/complaints';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { ComplaintDetailPanel } from './ComplaintDetailPanel';

interface ViewComplaintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaint: ComplaintRecord | null;
  loading?: boolean;
  showEmployee?: boolean;
  actionLoading?: boolean;
  onMarkInProgress?: (id: string, note?: string) => Promise<void>;
  onResolve?: (id: string, note?: string) => Promise<void>;
  onAddNote?: (id: string, note: string) => Promise<void>;
}

export function ViewComplaintModal({
  open,
  onOpenChange,
  complaint,
  loading = false,
  showEmployee = false,
  actionLoading = false,
  onMarkInProgress,
  onResolve,
  onAddNote,
}: ViewComplaintModalProps) {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) {
      setNote('');
    }
  }, [open]);

  const isAdminMode = !!onMarkInProgress || !!onResolve || !!onAddNote;

  const handleInProgress = async () => {
    if (!complaint || !onMarkInProgress) return;
    await onMarkInProgress(complaint.id, note.trim() || undefined);
    setNote('');
  };

  const handleResolve = async () => {
    if (!complaint || !onResolve) return;
    await onResolve(complaint.id, note.trim() || undefined);
    setNote('');
  };

  const handleAddNote = async () => {
    if (!complaint || !onAddNote || !note.trim()) return;
    await onAddNote(complaint.id, note.trim());
    setNote('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complaint Details</DialogTitle>
        </DialogHeader>

        <ComplaintDetailPanel
          complaint={complaint}
          loading={loading}
          showEmployee={showEmployee}
          asCard={false}
        />

        {isAdminMode && complaint && (
          <div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-3">
            <label className="text-sm font-medium text-gray-700">Action Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Add note for status update or public note"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={actionLoading}
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button
                variant="blue"
                onClick={handleInProgress}
                disabled={actionLoading || complaint.status !== 'OPEN'}
              >
                Set In Progress
              </Button>
              <Button
                variant="green"
                onClick={handleResolve}
                disabled={actionLoading || complaint.status === 'CLOSED'}
              >
                Resolve & Close
              </Button>
              <Button
                variant="default"
                onClick={handleAddNote}
                disabled={actionLoading || !note.trim()}
              >
                Add Note
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="cancel" onClick={() => onOpenChange(false)} disabled={actionLoading}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
