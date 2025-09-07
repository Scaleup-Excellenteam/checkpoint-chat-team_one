import { Schema, model, Document, Types } from 'mongoose';


export interface IUserInRoom {
  user: Types.ObjectId;
  joinedAt: Date;
}

export interface IRoom extends Document {
  name: string;
  users: IUserInRoom[];
  admins: Types.ObjectId[];
  createdAt: Date;
}


const UserInRoomSchema = new Schema<IUserInRoom>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  joinedAt: { type: Date, required: true },
}, { _id: false });

const RoomSchema = new Schema<IRoom>({
  name: { type: String, required: true, unique: true },
  users: [UserInRoomSchema],
  admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

export default model<IRoom>('Room', RoomSchema);
