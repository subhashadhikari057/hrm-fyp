'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, MessageSquare, UserRound } from 'lucide-react';
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

function statusLabel(status: ProjectTaskStatus) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'In Progress';
    default:
      return status.replace('_', ' ');
  }
}

function priorityBadgeClass(priority: string) {
  switch (priority) {
    case 'HIGH':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    case 'LOW':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    default:
      return 'border-amber-200 bg-amber-50 text-amber-700';
  }
}

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
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto border-slate-200 bg-[linear-gradient(180deg,#fff_0%,#f8fafc_100%)]">
        <DialogHeader>
          <DialogTitle className="text-xl text-slate-900">Task Detail</DialogTitle>
        </DialogHeader>

        {!task ? (
          <div className="text-sm text-slate-600">No task selected.</div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.8)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{task.title}</p>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{task.description || 'No description provided.'}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityBadgeClass(task.priority)}`}>
                  {task.priority}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Project</p>
                  <p className="mt-1 font-medium text-slate-900">{task.project?.name || '-'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-slate-400"><UserRound className="h-3 w-3" />Assignee</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {task.assigneeEmployee
                      ? `${task.assigneeEmployee.firstName || ''} ${task.assigneeEmployee.lastName || ''}`.trim() ||
                        task.assigneeEmployee.employeeCode ||
                        task.assigneeEmployee.id
                      : 'Unassigned'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-slate-400"><CalendarDays className="h-3 w-3" />Due Date</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : 'Not set'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</label>
                <select
                  className="block h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-0"
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
                      {statusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900"><MessageSquare className="h-4 w-4 text-slate-400" />Comments</h3>
                {loadingComments ? <span className="text-xs text-slate-500">Loading...</span> : null}
              </div>

              <div className="max-h-56 space-y-2 overflow-y-auto rounded-[24px] border border-slate-200 bg-white/80 p-3">
                {comments.length === 0 ? (
                  <p className="text-sm text-slate-600">No comments yet.</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm leading-6 text-slate-800">{comment.comment}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {(comment.authorUser?.fullName || comment.authorUser?.email || 'User')}
                        {' • '}
                        {new Date(comment.createdAt).toLocaleString('en-GB')}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Add Comment</label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Write a project update..."
                  className="block w-full rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-0"
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
