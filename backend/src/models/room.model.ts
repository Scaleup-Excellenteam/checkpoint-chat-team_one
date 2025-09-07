import { Schema, model, Document } from 'mongoose';

export interface IUserInRoom {
  userId: any;
  username: string;
  joinedAt: Date;
}

export interface IRoom extends Document {
  name: string;
  users: IUserInRoom[];
  admins: string[]; // usernames
  createdAt: Date;
}

const UserInRoomSchema = new Schema<IUserInRoom>({
  username: { type: String, required: true },
  joinedAt: { type: Date, required: true },
}, { _id: false });

const RoomSchema = new Schema<IRoom>({
  name: { type: String, required: true, unique: true },
  users: [UserInRoomSchema],
  admins: [{ type: String, required: true }],
  createdAt: { type: Date, default: Date.now },
});

export default model<IRoom>('Room', RoomSchema);
