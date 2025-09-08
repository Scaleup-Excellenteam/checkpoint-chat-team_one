// src/lib/rooms.ts
export interface Room {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";
const ROOMS_BASE = `${API_BASE}/rooms`;

async function http<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${ROOMS_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const RoomsAPI = {
  getAll: () => http<Room[]>(""),
  create: (name: string) =>
    http<Room>("", { method: "POST", body: JSON.stringify({ name }) }),
  getById: (id: string) => http<Room>(`/${id}`),
  update: (id: string, data: Partial<Room>) =>
    http<Room>(`/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    http<{ deleted: boolean }>(`/${id}`, { method: "DELETE" }),
};
