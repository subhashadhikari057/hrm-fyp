'use client';

import { useEffect, useMemo, useState } from 'react';
import { type ProjectTaskPriority } from '../../lib/api/projects';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

export interface ProjectTaskFormPayload {
  title: string;
  description?: string;
  priority: ProjectTaskPriority;
  dueDate?: string;
  assigneeEmployeeId?: string;
}

export interface TaskAssigneeOption {
  id: string;
  label: string;
}

interface ProjectTaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
  assignees: TaskAssigneeOption[];
  initialValues?: Partial<ProjectTaskFormPayload>;
  onSubmit: (payload: ProjectTaskFormPayload) => Promise<void> | void;
}

export function ProjectTaskFormModal({
  open,
  onOpenChange,
  loading = false,
  mode = 'create',
  assignees,
  initialValues,
  onSubmit,
}: ProjectTaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ProjectTaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [assigneeEmployeeId, setAssigneeEmployeeId] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    setTitle(initialValues?.title ?? '');
    setDescription(initialValues?.description ?? '');
    setPriority(initialValues?.priority ?? 'MEDIUM');
    setDueDate(initialValues?.dueDate ?? '');
    setAssigneeEmployeeId(initialValues?.assigneeEmployeeId ?? '');
  }, [open, initialValues]);

  const isValid = useMemo(() => title.trim().length > 0, [title]);

  const handleSubmit = async () => {
    if (!isValid) {
      return;
    }

    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      assigneeEmployeeId: assigneeEmployeeId || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Task' : 'Update Task'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Task Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Implement login screen"
              maxLength={200}
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
              placeholder="Add detailed task context"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <select
                className="block h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={priority}
                onChange={(e) => setPriority(e.target.value as ProjectTaskPriority)}
                disabled={loading}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Assignee</label>
              <select
                className="block h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={assigneeEmployeeId}
                onChange={(e) => setAssigneeEmployeeId(e.target.value)}
                disabled={loading}
              >
                <option value="">Unassigned</option>
                {assignees.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="cancel" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="blue" onClick={handleSubmit} disabled={loading || !isValid}>
            {loading ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
