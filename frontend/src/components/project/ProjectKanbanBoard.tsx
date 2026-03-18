'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, MessageSquare, MoveRight } from 'lucide-react';
import {
  type ProjectTaskRecord,
  type ProjectTaskStatus,
} from '../../lib/api/projects';

const COLUMNS: Array<{ key: ProjectTaskStatus; label: string }> = [
  { key: 'TODO', label: 'To Do' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'REVIEW', label: 'Review' },
  { key: 'DONE', label: 'Done' },
];

interface ProjectKanbanBoardProps {
  tasks: ProjectTaskRecord[];
  loading?: boolean;
  canUpdateStatus?: boolean;
  canMoveTask?: (task: ProjectTaskRecord) => boolean;
  onMoveTask?: (task: ProjectTaskRecord, nextStatus: ProjectTaskStatus) => Promise<void> | void;
  onOpenTask?: (task: ProjectTaskRecord) => void;
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

function columnShellClass(status: ProjectTaskStatus) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'border-sky-200/80 bg-sky-50/70';
    case 'REVIEW':
      return 'border-amber-200/80 bg-amber-50/70';
    case 'DONE':
      return 'border-emerald-200/80 bg-emerald-50/70';
    default:
      return 'border-slate-200/80 bg-slate-50/80';
  }
}

function columnCountClass(status: ProjectTaskStatus) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'bg-sky-100 text-sky-700';
    case 'REVIEW':
      return 'bg-amber-100 text-amber-700';
    case 'DONE':
      return 'bg-emerald-100 text-emerald-700';
    default:
      return 'bg-slate-200 text-slate-700';
  }
}

function statusLabel(status: ProjectTaskStatus) {
  return COLUMNS.find((column) => column.key === status)?.label || status;
}

export function ProjectKanbanBoard({
  tasks,
  loading = false,
  canUpdateStatus = true,
  canMoveTask,
  onMoveTask,
  onOpenTask,
}: ProjectKanbanBoardProps) {
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map: Record<ProjectTaskStatus, ProjectTaskRecord[]> = {
      TODO: [],
      IN_PROGRESS: [],
      REVIEW: [],
      DONE: [],
    };

    tasks.forEach((task) => {
      map[task.status].push(task);
    });

    return map;
  }, [tasks]);

  const handleDrop = async (status: ProjectTaskStatus) => {
    if (!dragTaskId || !onMoveTask || !canUpdateStatus) {
      setDragTaskId(null);
      return;
    }

    const task = tasks.find((item) => item.id === dragTaskId);
    setDragTaskId(null);

    if (!task || task.status === status) {
      return;
    }

    if (canMoveTask && !canMoveTask(task)) {
      return;
    }

    await onMoveTask(task, status);
  };

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white/80 px-4 py-8 text-sm text-slate-600">Loading task board...</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
      {COLUMNS.map((column) => (
        <div
          key={column.key}
          className={`rounded-[28px] border p-3 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.55)] ${columnShellClass(column.key)}`}
          onDragOver={(e) => {
            if (canUpdateStatus) {
              e.preventDefault();
            }
          }}
          onDrop={() => {
            void handleDrop(column.key);
          }}
        >
          <div className="flex items-center justify-between gap-3 rounded-[22px] border border-white/70 bg-white/80 px-4 py-3 backdrop-blur">
            <div>
              <p className="text-sm font-semibold text-slate-900">{column.label}</p>
              <p className="text-xs text-slate-500">
                {grouped[column.key].length === 1 ? '1 task' : `${grouped[column.key].length} tasks`}
              </p>
            </div>
            <span className={`inline-flex min-w-8 items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${columnCountClass(column.key)}`}>
              {grouped[column.key].length}
            </span>
          </div>

          <div className="space-y-3 pt-3">
            {grouped[column.key].length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-slate-300/80 bg-white/80 px-4 py-8 text-center text-xs text-slate-500">
                Drop a task here or use the status selector.
              </div>
            ) : (
              grouped[column.key].map((task) => {
                const taskCanMove =
                  canUpdateStatus && (!canMoveTask || canMoveTask(task));
                const assigneeName = task.assigneeEmployee
                  ? `${task.assigneeEmployee.firstName || ''} ${task.assigneeEmployee.lastName || ''}`.trim() ||
                    task.assigneeEmployee.employeeCode ||
                    'Assigned'
                  : 'Unassigned';

                return (
                  <div
                    key={task.id}
                    className="rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.75)] transition-transform duration-200 hover:-translate-y-0.5"
                    draggable={taskCanMove}
                    onDragStart={() => {
                      if (taskCanMove) {
                        setDragTaskId(task.id);
                      }
                    }}
                    onDragEnd={() => setDragTaskId(null)}
                  >
                    <button
                      type="button"
                      onClick={() => onOpenTask?.(task)}
                      className="block w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="line-clamp-2 text-sm font-semibold text-slate-900">{task.title}</p>
                        {taskCanMove ? <MoveRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" /> : null}
                      </div>
                    </button>

                    {task.description ? (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{task.description}</p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${priorityBadgeClass(task.priority)}`}
                      >
                        {task.priority}
                      </span>
                      {task.dueDate ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString('en-GB')}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-xs font-medium text-slate-600">{assigneeName}</p>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <MessageSquare className="h-3 w-3" />
                        {task._count?.comments || 0}
                      </span>
                    </div>

                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                      <select
                        className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-0"
                        value={task.status}
                        disabled={!taskCanMove || !onMoveTask}
                        onChange={(e) => {
                          const next = e.target.value as ProjectTaskStatus;
                          if (next !== task.status) {
                            void onMoveTask?.(task, next);
                          }
                        }}
                      >
                        {COLUMNS.map((option) => (
                          <option key={option.key} value={option.key}>
                            {statusLabel(option.key)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
