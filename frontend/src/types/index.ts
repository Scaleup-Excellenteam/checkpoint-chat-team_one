export interface Message {
  _id?: string;
  content: string;
  username: string;
  timestamp: string | Date;
  room?: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface Room {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
}