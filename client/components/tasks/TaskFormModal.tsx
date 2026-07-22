'use client';

import { FormEvent, useState } from 'react';
import { TextField } from '@/components/ui/TextField';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { SelectField } from '@/components/ui/SelectField';
import { Button } from '@/components/ui/Button';
import { FormErrors } from '@/components/ui/FormErrors';
import { getErrorMessages } from '@/lib/api/errors';
import type { Task, TaskPriority } from '@/types/task';
import type { ProjectMemberRef } from '@/types/project';

interface TaskFormModalProps {
  members: ProjectMemberRef[];
  task?: Task; // undefined => create mode
  canAssign: boolean; // only the project owner may set/change the assignee
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    description?: string;
    priority: TaskPriority;
    dueDate?: string;
    assignee?: string | null;
  }) => Promise<unknown>;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function TaskFormModal({ members, task, canAssign, onClose, onSubmit }: TaskFormModalProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.slice(0, 10) : '');
  const [assignee, setAssignee] = useState(task?.assignee?._id ?? '');
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);
    setIsSubmitting(true);

    try {
      await onSubmit({
        title,
        description: description || undefined,
        priority,
        dueDate: dueDate || undefined,
        ...(canAssign ? { assignee: assignee || null } : {}),
      });
      onClose();
    } catch (err) {
      setErrors(getErrorMessages(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-4 py-8 animate-fadeIn">
      <div className="max-h-full w-full max-w-md animate-scaleIn overflow-y-auto rounded-2xl bg-white p-6 shadow-popover">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">
          {task ? 'Edit task' : 'New task'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Title"
            name="title"
            required
            minLength={2}
            maxLength={150}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <TextAreaField
            label="Description (optional)"
            name="description"
            maxLength={3000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              label="Priority"
              name="priority"
              options={PRIORITY_OPTIONS}
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            />
            <TextField
              label="Due Date (optional)"
              name="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {canAssign ? (
            <SelectField
              label="Assignee"
              name="assignee"
              options={[
                { value: '', label: 'Unassigned' },
                ...members.map((m) => ({ value: m.user._id, label: m.user.name })),
              ]}
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            />
          ) : (
            task?.assignee && (
              <p className="text-sm text-neutral-500">
                Assigned to <span className="font-medium">{task.assignee.name}</span> — only the
                project owner can reassign tasks.
              </p>
            )
          )}

          <FormErrors messages={errors} />

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {task ? 'Save changes' : 'Create task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
