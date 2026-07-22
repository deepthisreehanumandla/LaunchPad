import { Schema, model, Document, Types } from 'mongoose';

export const TASK_STATUSES = ['todo', 'in-progress', 'review', 'done'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface ITask extends Document {
  _id: Types.ObjectId;
  project: Types.ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: Types.ObjectId;
  createdBy: Types.ObjectId;
  dueDate?: Date;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 3000 },
    status: { type: String, enum: TASK_STATUSES, default: 'todo' },
    priority: { type: String, enum: TASK_PRIORITIES, default: 'medium' },
    assignee: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date },
    // Position within its status column, for stable drag-and-drop ordering.
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

taskSchema.index({ project: 1, status: 1, order: 1 });
taskSchema.index({ assignee: 1 });

export const Task = model<ITask>('Task', taskSchema);
