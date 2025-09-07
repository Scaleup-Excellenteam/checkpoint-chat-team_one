import { Schema, model, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  room: Types.ObjectId;
  user: Types.ObjectId;
  content: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default model<IMessage>('Message', MessageSchema);
