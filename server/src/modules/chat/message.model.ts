import { Schema, model, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  _id: Types.ObjectId;
  project: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 4000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Powers cursor/offset pagination through a project's chat history, newest last.
messageSchema.index({ project: 1, createdAt: -1 });

export const Message = model<IMessage>('Message', messageSchema);
