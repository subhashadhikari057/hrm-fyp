'use client';

import { useMemo, useState } from 'react';
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
      return 'border-red-200 bg-red-50 text-red-700';
    case 'LOW':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    default:
      return 'border-amber-200 bg-amber-50 text-amber-700';
  }
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
    return <div className="text-sm text-gray-600">Loading task board...</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      {COLUMNS.map((column) => (
        <div
          key={column.key}
          className="rounded-lg border border-gray-200 bg-gray-50"
          onDragOver={(e) => {
            if (canUpdateStatus) {
              e.preventDefault();
            }
          }}
          onDrop={() => {
            void handleDrop(column.key);
          }}
        >
          <div className="border-b border-gray-200 px-3 py-2">
            <p className="text-sm font-semibold text-gray-800">{column.label}</p>
            <p className="text-xs text-gray-500">{grouped[column.key].length} task(s)</p>
          </div>

          <div className="space-y-2 p-3">
            {grouped[column.key].length === 0 ? (
              <div className="rounded-md border border-dashed border-gray-300 bg-white px-3 py-5 text-center text-xs text-gray-500">
                No tasks
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
                    className="rounded-md border border-gray-200 bg-white p-3 shadow-sm"
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
                      <p className="line-clamp-2 text-sm font-medium text-gray-900">{task.title}</p>
                    </button>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded border px-2 py-0.5 text-[11px] font-medium ${priorityBadgeClass(task.priority)}`}
                      >
                        {task.priority}
                      </span>
                      {task.dueDate ? (
                        <span className="text-[11px] text-gray-600">
                          Due {new Date(task.dueDate).toLocaleDateString('en-GB')}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 text-xs text-gray-600">{assigneeName}</p>

                    <div className="mt-2">
                      <select
                        className="h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                            {option.label}
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
