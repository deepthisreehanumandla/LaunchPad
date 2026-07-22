'use client';

import { useEffect, useState } from 'react';
import { tasksApi } from '@/lib/api/tasks';
import { useSocket } from '@/lib/socket/useSocket';
import { TaskColumn } from './TaskColumn';
import { TaskFormModal } from './TaskFormModal';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { PlusIcon } from '@/components/ui/icons';
import type { Task, TaskStatus, TaskMovedPayload } from '@/types/task';
import type { ProjectMemberRef } from '@/types/project';

interface TaskBoardProps {
  projectId: string;
  members: ProjectMemberRef[];
  currentUserId?: string;
  isOwner: boolean;
}

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'todo', title: 'To Do' },
  { status: 'in-progress', title: 'In Progress' },
  { status: 'review', title: 'Review' },
  { status: 'done', title: 'Done' },
];

export function TaskBoard({ projectId, members, currentUserId, isOwner }: TaskBoardProps) {
  const socket = useSocket();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null | undefined>(undefined); // undefined = closed, null = create mode
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    tasksApi
      .list(projectId)
      .then((results) => {
        if (!cancelled) setTasks(results);
      })
      .catch(() => {
        if (!cancelled) setError('Only project members can view the task board.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    if (!socket) return;

    function handleCreated(task: Task) {
      if (task.project !== projectId) return;
      setTasks((prev) => (prev.some((t) => t._id === task._id) ? prev : [...prev, task]));
    }

    function handleUpdated(task: Task) {
      if (task.project !== projectId) return;
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
    }

    function handleMoved(payload: TaskMovedPayload) {
      setTasks((prev) =>
        prev.map((t) => (t._id === payload._id ? { ...t, status: payload.status, order: payload.order } : t)),
      );
    }

    function handleDeleted(payload: { _id: string }) {
      setTasks((prev) => prev.filter((t) => t._id !== payload._id));
    }

    socket.on('task:created', handleCreated);
    socket.on('task:updated', handleUpdated);
    socket.on('task:moved', handleMoved);
    socket.on('task:deleted', handleDeleted);

    return () => {
      socket.off('task:created', handleCreated);
      socket.off('task:updated', handleUpdated);
      socket.off('task:moved', handleMoved);
      socket.off('task:deleted', handleDeleted);
    };
  }, [socket, projectId]);

  async function handleDropTask(taskId: string, targetStatus: TaskStatus, targetOrder: number) {
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;
    if (task.status === targetStatus) return; // dropped back in the same column — no-op

    // Optimistic update; the server broadcast (or a REST error) reconciles it.
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: targetStatus, order: targetOrder } : t)),
    );

    try {
      await tasksApi.move(projectId, taskId, { status: targetStatus, order: targetOrder });
    } catch {
      // Revert on failure.
      setTasks((prev) => prev.map((t) => (t._id === taskId ? task : t)));
    }
  }

  async function handleDeleteTask(task: Task) {
    const confirmed = window.confirm(`Delete task "${task.title}"?`);
    if (!confirmed) return;

    setDeletingId(task._id);
    try {
      await tasksApi.remove(projectId, task._id);
      setTasks((prev) => prev.filter((t) => t._id !== task._id));
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <section className="mb-8 rounded-xl border border-neutral-200 bg-white py-10">
        <PageSpinner label="Loading task board…" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-8 rounded-xl border border-dashed border-neutral-200 bg-white px-5 py-8 text-center text-sm text-neutral-400">
        {error}
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Task board</h2>
        <Button onClick={() => setEditingTask(null)} size="sm">
          <PlusIcon className="h-4 w-4" />
          Add task
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:overflow-x-auto sm:pb-1">
        {COLUMNS.map((column) => (
          <TaskColumn
            key={column.status}
            status={column.status}
            title={column.title}
            tasks={tasks
              .filter((t) => t.status === column.status)
              .sort((a, b) => a.order - b.order)}
            currentUserId={currentUserId}
            isOwner={isOwner}
            onEditTask={setEditingTask}
            onDeleteTask={handleDeleteTask}
            onDropTask={handleDropTask}
          />
        ))}
      </div>

      {deletingId && <p className="mt-2 text-xs text-neutral-400">Deleting task…</p>}

      {editingTask !== undefined && (
        <TaskFormModal
          members={members}
          task={editingTask ?? undefined}
          canAssign={isOwner}
          onClose={() => setEditingTask(undefined)}
          onSubmit={async (input) => {
            if (editingTask) {
              const updated = await tasksApi.update(projectId, editingTask._id, input);
              // Apply directly rather than waiting on the task:updated socket
              // broadcast — the REST response is already authoritative, and
              // this keeps the editor's own UI correct even if the socket
              // event is delayed, missed, or the socket hasn't finished
              // joining the workspace room yet.
              setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
            } else {
              const { assignee, ...rest } = input;
              const created = await tasksApi.create(projectId, { ...rest, assignee: assignee ?? undefined });
              setTasks((prev) => (prev.some((t) => t._id === created._id) ? prev : [...prev, created]));
            }
          }}
        />
      )}
    </section>
  );
}
