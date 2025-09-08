import axios from "axios";
import { clientEnv } from "../config/env";

export const api = axios.create({
  baseURL: clientEnv.VITE_API_URL,
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

export async function loginApi(identifier: string, password: string) {
  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Login failed');
  return res.json();
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
