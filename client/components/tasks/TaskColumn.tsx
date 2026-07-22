'use client';

import { useState } from 'react';
import { TaskCard } from './TaskCard';
import type { Task, TaskStatus } from '@/types/task';
import { cn } from '@/lib/cn';

interface TaskColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  currentUserId?: string;
  isOwner: boolean;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onDropTask: (taskId: string, targetStatus: TaskStatus, targetOrder: number) => void;
}

const STATUS_DOT: Record<TaskStatus, string> = {
  todo: 'bg-neutral-400',
  'in-progress': 'bg-blue-500',
  review: 'bg-amber-500',
  done: 'bg-emerald-500',
};

export function TaskColumn({
  status,
  title,
  tasks,
  currentUserId,
  isOwner,
  onEditTask,
  onDeleteTask,
  onDropTask,
}: TaskColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  function canEditTask(task: Task): boolean {
    return isOwner || (Boolean(task.assignee) && String(task.assignee?._id) === String(currentUserId));
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onDropTask(taskId, status, tasks.length);
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        'flex min-h-[16rem] flex-1 flex-col gap-3 rounded-xl border p-3 transition-colors sm:min-w-[15rem]',
        isDragOver ? 'border-brand-300 bg-brand-50/50' : 'border-neutral-200 bg-neutral-50',
      )}
    >
      <h3 className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[status])} />
        {title}
        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-neutral-500 shadow-xs">
          {tasks.length}
        </span>
      </h3>

      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            canEdit={canEditTask(task)}
            canDelete={isOwner}
            onEdit={() => onEditTask(task)}
            onDelete={() => onDeleteTask(task)}
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', task._id);
              e.dataTransfer.effectAllowed = 'move';
            }}
          />
        ))}
        {tasks.length === 0 && (
          <p className="rounded-lg border border-dashed border-neutral-200 px-3 py-6 text-center text-xs text-neutral-400">
            No tasks here
          </p>
        )}
      </div>
    </div>
  );
}
