export interface User {
  id: string;
  username: string;
  roles?: string[];
}

export class AuthService {
  constructor(_opts?: unknown) {}

  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    if (!username || !password) throw new Error("Missing credentials");
    const user: User = { id: `u_${username}`, username, roles: ["user"] };
    const token = `mock.${Buffer.from(username).toString("base64")}.token`;
    return { token, user };
  }

  async register(username: string, password: string): Promise<User> {
    if (!username || !password) throw new Error("Missing payload");
    return { id: `u_${username}`, username, roles: ["user"] };
  }
}

export default AuthService;