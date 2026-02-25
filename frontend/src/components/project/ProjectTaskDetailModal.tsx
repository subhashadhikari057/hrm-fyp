'use client';

import { useMemo, useState } from 'react';
import {
  type ProjectTaskCommentRecord,
  type ProjectTaskRecord,
  type ProjectTaskStatus,
} from '../../lib/api/projects';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

const TASK_STATUSES: ProjectTaskStatus[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

interface ProjectTaskDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: ProjectTaskRecord | null;
  comments: ProjectTaskCommentRecord[];
  loading?: boolean;
  loadingComments?: boolean;
  submittingComment?: boolean;
  updatingStatus?: boolean;
  canUpdateStatus?: boolean;
  onUpdateStatus?: (status: ProjectTaskStatus) => Promise<void> | void;
  onAddComment?: (comment: string) => Promise<void> | void;
}

export function ProjectTaskDetailModal({
  open,
  onOpenChange,
  task,
  comments,
  loading = false,
  loadingComments = false,
  submittingComment = false,
  updatingStatus = false,
  canUpdateStatus = true,
  onUpdateStatus,
  onAddComment,
}: ProjectTaskDetailModalProps) {
  const [commentText, setCommentText] = useState('');

  const commentDisabled = useMemo(
    () => submittingComment || !commentText.trim() || !onAddComment,
    [submittingComment, commentText, onAddComment],
  );

  const handleAddComment = async () => {
    if (!onAddComment || !commentText.trim()) {
      return;
    }

    await onAddComment(commentText.trim());
    setCommentText('');
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Task Detail</DialogTitle>
        </DialogHeader>

        {!task ? (
          <div className="text-sm text-gray-600">No task selected.</div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3 rounded-lg border border-gray-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-gray-900">{task.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{task.description || 'No description provided.'}</p>
                </div>
                <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
                  {task.priority}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Project</p>
                  <p className="font-medium">{task.project?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Assignee</p>
                  <p className="font-medium">
                    {task.assigneeEmployee
                      ? `${task.assigneeEmployee.firstName || ''} ${task.assigneeEmployee.lastName || ''}`.trim() ||
                        task.assigneeEmployee.employeeCode ||
                        task.assigneeEmployee.id
                      : 'Unassigned'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Due Date</p>
                  <p className="font-medium">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : 'Not set'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-gray-500">Status</label>
                <select
                  className="block h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={task.status}
                  disabled={!canUpdateStatus || updatingStatus || !onUpdateStatus}
                  onChange={(e) => {
                    const nextStatus = e.target.value as ProjectTaskStatus;
                    if (nextStatus !== task.status && onUpdateStatus) {
                      void onUpdateStatus(nextStatus);
                    }
                  }}
                >
                  {TASK_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Comments</h3>
                {loadingComments ? <span className="text-xs text-gray-500">Loading...</span> : null}
              </div>

              <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
                {comments.length === 0 ? (
                  <p className="text-sm text-gray-600">No comments yet.</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="rounded-md border border-gray-200 bg-white p-3">
                      <p className="text-sm text-gray-800">{comment.comment}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {(comment.authorUser?.fullName || comment.authorUser?.email || 'User')}
                        {' • '}
                        {new Date(comment.createdAt).toLocaleString('en-GB')}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Add Comment</label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Write a project update..."
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={submittingComment || !onAddComment}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="cancel" onClick={() => onOpenChange(false)} disabled={loading}>
            Close
          </Button>
          <Button variant="blue" onClick={handleAddComment} disabled={commentDisabled}>
            {submittingComment ? 'Adding...' : 'Add Comment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
