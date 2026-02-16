'use client';

import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

interface PolicyFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'update';
  loading?: boolean;
  initialTitle?: string;
  initialVersion?: string;
  onSubmit: (payload: { title?: string; content: string; version?: string; effectiveFrom?: string }) => Promise<void>;
}

export function PolicyFormModal({
  open,
  onOpenChange,
  mode,
  loading = false,
  initialTitle = '',
  initialVersion = '',
  onSubmit,
}: PolicyFormModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState('');
  const [version, setVersion] = useState(initialVersion);
  const [effectiveFrom, setEffectiveFrom] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setContent('');
      setVersion(initialVersion);
      setEffectiveFrom('');
    }
  }, [open, initialTitle, initialVersion]);

  const handleSubmit = async () => {
    const payload = {
      ...(mode === 'create' ? { title: title.trim() } : { title: title.trim() || undefined }),
      content: content.trim(),
      ...(mode === 'update' ? { version: version.trim() } : {}),
      effectiveFrom: effectiveFrom || undefined,
    };

    await onSubmit(payload);
  };

  const isCreateInvalid = mode === 'create' && !title.trim();
  const isUpdateVersionInvalid =
    mode === 'update' && !/^\d+(\.\d+)*$/.test(version.trim());
  const isInvalid = isCreateInvalid || !content.trim() || isUpdateVersionInvalid;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add Policy' : 'Update Policy'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Policy title"
              disabled={loading}
            />
          </div>

          {mode === 'update' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Version</label>
              <Input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. 1.0.1"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Use dotted numeric format like 1.0.1</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Effective From (optional)</label>
            <Input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Policy Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              placeholder="Write policy content..."
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="cancel" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="blue" onClick={handleSubmit} disabled={loading || isInvalid}>
            {loading ? 'Saving...' : mode === 'create' ? 'Create Policy' : 'Publish New Version'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
