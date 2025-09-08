import { Schema, model, Document } from 'mongoose';

export interface IMessage extends Document {
  room: string; // room name
  user: string; // username
  content: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  room: { type: String, required: true },
  user: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default model<IMessage>('Message', MessageSchema);
