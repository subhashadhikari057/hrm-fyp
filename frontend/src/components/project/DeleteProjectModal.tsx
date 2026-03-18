'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface DeleteProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  loading?: boolean;
  onConfirm: () => Promise<void> | void;
}

export function DeleteProjectModal({
  open,
  onOpenChange,
  projectName,
  loading = false,
  onConfirm,
}: DeleteProjectModalProps) {
  const [confirmationText, setConfirmationText] = useState('');

  useEffect(() => {
    if (open) {
      setConfirmationText('');
    }
  }, [open]);

  const canDelete = confirmationText.trim() === projectName.trim() && !loading;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            This permanently deletes the project, its members, tasks, and comments. This action cannot be undone.
          </p>
          <p className="text-sm text-slate-600">
            To confirm, type <span className="font-semibold text-slate-900">{projectName}</span> below.
          </p>
          <Input
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="Type project name to confirm"
            disabled={loading}
          />
        </div>

        <DialogFooter>
          <Button variant="cancel" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="red" onClick={() => void onConfirm()} disabled={!canDelete}>
            {loading ? 'Deleting...' : 'Delete Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
