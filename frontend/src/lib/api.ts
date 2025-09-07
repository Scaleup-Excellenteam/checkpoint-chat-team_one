import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/",
});


// ---- LOGIN ----
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type LoginRequest = { email: string; password: string };
export type User = { _id: string; username: string; email: string };
export type LoginResponse = { message: string; user: User };

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/login", req);
  return data;
}


// ---- REGISTER ----
export type RegisterRequest = { username: string; email: string; password: string };
export type RegisterResponse = { user: User; token?: string; message?: string };

export async function register(req: RegisterRequest): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>("/register", req);
  return data;
}


// ---- CHAT ----
export type ChatHistoryItem = { role: "user" | "assistant"; content: string };
export type ChatRequest = { message: string; history?: ChatHistoryItem[] };
export type ChatResponse = { reply: string };

export async function chat(req: ChatRequest): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>("/chat", req);
  return data;
}
