'use client';

import type { PendingPolicy } from '../../lib/api/policy';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface PolicyAcceptanceModalProps {
  open: boolean;
  policy: PendingPolicy | null;
  loading?: boolean;
  onAccept: () => Promise<void>;
}

export function PolicyAcceptanceModal({
  open,
  policy,
  loading = false,
  onAccept,
}: PolicyAcceptanceModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-h-[85vh] max-w-3xl overflow-y-auto"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Policy Acceptance Required</DialogTitle>
        </DialogHeader>

        {!policy ? (
          <div className="text-sm text-gray-600">Loading policy...</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              You must accept this policy to continue using the dashboard.
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-500">Title</p>
              <p className="text-sm font-semibold text-gray-900">{policy.title}</p>
              <p className="text-xs text-gray-500">Version {policy.version}</p>
            </div>

            <div className="max-h-[45vh] overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-3">
              <pre className="whitespace-pre-wrap text-sm text-gray-800">{policy.content}</pre>
            </div>

            <div className="flex justify-end">
              <Button variant="blue" onClick={onAccept} disabled={loading}>
                {loading ? 'Accepting...' : 'I Accept'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
