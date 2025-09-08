// src/lib/rooms.ts
export interface Room {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}


import { ROOMS_URL } from '../config/env';

async function http<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${ROOMS_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
export const RoomsAPI = {
  getAll: async () => {
    const res = await http<any>("");
    return Array.isArray(res) ? res : res.data;
  },
  create: (name: string, username: string) =>
    http<Room>("", { method: "POST", body: JSON.stringify({ name, username }) }),
  getById: (id: string) => http<Room>(`/${id}`),
  update: (roomName: string, data: Partial<Room>, username: string) =>
    http<Room>(`/${roomName}`, { method: "PUT", body: JSON.stringify({ ...data, username }) }),
  delete: (roomName: string, username: string) =>
    http<{ deleted: boolean }>(`/${roomName}`, { method: "DELETE", body: JSON.stringify({ username }) }),
};
