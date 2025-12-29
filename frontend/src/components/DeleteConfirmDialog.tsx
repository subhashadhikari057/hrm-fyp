'use client';

import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import type { ReactNode } from 'react';

export interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  loading?: boolean;
  confirmLabel?: string;
  confirmVariant?: 'red' | 'blue' | 'cancel';
  warningText?: string;
  icon?: ReactNode;
  iconBgClassName?: string;
  iconTextClassName?: string;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  loading = false,
  confirmLabel = 'Delete',
  confirmVariant = 'red',
  warningText = 'This action cannot be undone.',
  icon,
  iconBgClassName = 'bg-red-100',
  iconTextClassName = 'text-red-600',
}: DeleteConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${iconBgClassName} ${iconTextClassName}`}
            >
              {icon || <AlertTriangle className="h-5 w-5" />}
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-gray-600">{message}</p>
          {itemName && (
            <p className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
              {itemName}
            </p>
          )}
          {warningText && (
            <p className="text-sm text-red-600 font-medium">
              {warningText}
            </p>
          )}
        </div>

        <div className="pt-6">
          <DialogFooter>
            <Button
              type="button"
              variant="cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={confirmVariant}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? 'Working...' : confirmLabel}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
