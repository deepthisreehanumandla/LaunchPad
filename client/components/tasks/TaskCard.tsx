'use client';

import type { Task } from '@/types/task';
import { Badge } from '@/components/ui/Badge';
import { CloseIcon } from '@/components/ui/icons';

interface TaskCardProps {
  task: Task;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

const PRIORITY_TONE: Record<Task['priority'], 'neutral' | 'amber' | 'red'> = {
  low: 'neutral',
  medium: 'amber',
  high: 'red',
};

function isOverdue(dueDate?: string, status?: string): boolean {
  if (!dueDate || status === 'done') return false;
  return new Date(dueDate).getTime() < Date.now();
}

export function TaskCard({ task, canEdit, canDelete, onEdit, onDelete, onDragStart }: TaskCardProps) {
  return (
    <div
      draggable={canEdit}
      onDragStart={onDragStart}
      className={`group flex flex-col gap-2.5 rounded-lg border border-neutral-200 bg-white p-3.5 text-sm shadow-xs transition hover:border-neutral-300 hover:shadow-soft ${
        canEdit ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onEdit}
          disabled={!canEdit}
          className="text-left font-medium leading-snug text-neutral-900 transition hover:text-brand-600 disabled:cursor-default disabled:hover:text-neutral-900"
        >
          {task.title}
        </button>
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete task"
            className="shrink-0 rounded-md p-0.5 text-neutral-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {task.description && <p className="line-clamp-2 text-xs text-neutral-500">{task.description}</p>}

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={PRIORITY_TONE[task.priority]} className="capitalize">
          {task.priority}
        </Badge>
        {task.dueDate && (
          <span
            className={`text-xs ${
              isOverdue(task.dueDate, task.status) ? 'font-medium text-red-600' : 'text-neutral-400'
            }`}
          >
            Due {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {task.assignee && (
        <div className="flex items-center gap-1.5 border-t border-neutral-100 pt-2 text-xs text-neutral-500">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-50 text-[10px] font-semibold text-brand-700">
            {task.assignee.name.charAt(0).toUpperCase()}
          </span>
          {task.assignee.name}
        </div>
      )}
    </div>
  );
}
