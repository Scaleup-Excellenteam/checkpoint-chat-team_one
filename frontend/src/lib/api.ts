import axios from "axios";
import { getApiUrl } from "../config/env";

// Dynamically determine the base URL based on environment or current location
const baseURL = getApiUrl();

// Log the API URL for debugging purposes
console.log("🔌 API connecting to:", baseURL);

export const api = axios.create({
  baseURL: baseURL,
});

// ---- LOGIN ----
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type LoginRequest = { identifier: string; password: string };
export type User = { id: string; username: string; email: string; createdAt: string };
export type LoginResponse = { message?: string; token: string; user: User };

export async function login(req: LoginRequest): Promise<LoginResponse> {
  try {
    console.log("Sending login request:", req);
    const response = await api.post<LoginResponse>("/auth/login", req);
    console.log("Login response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("Server response:", error.response.data);
      throw new Error(error.response.data.message || "Login failed");
    }
    throw error;
  }
}

// ---- REGISTER ----
export type RegisterRequest = { username: string; email: string; password: string };
export type RegisterResponse = { user: User; token: string; message?: string };

export async function register(req: RegisterRequest): Promise<RegisterResponse> {
  try {
    console.log("Sending registration request:", req);
    const response = await api.post<RegisterResponse>("/auth/register", req);
    console.log("Registration response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Registration error:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("Server response:", error.response.data);
      throw new Error(error.response.data.message || "Registration failed");
    }
    throw error;
  }
}


// ---- CHAT ----
export type ChatHistoryItem = { role: "user" | "assistant"; content: string };
export type ChatRequest = { message: string; history?: ChatHistoryItem[] };
export type ChatResponse = { reply: string };

export async function chat(req: ChatRequest): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>("/chat", req);
  return data;
}
