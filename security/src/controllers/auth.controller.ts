import { Request, Response, NextFunction } from "express";
import AuthService, { AuthService as AuthServiceClass } from "../services/auth.service";

export class AuthController {
  constructor(private readonly service: AuthServiceClass = new AuthService()) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body ?? {};
      const result = await this.service.login(username, password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body ?? {};
      const user = await this.service.register(username, password);
      res.status(201).json({ user });
    } catch (err) {
      next(err);
    }
  };
}

// Default export for routes using `import controller from ...`
const controller = new AuthController();
export default controller;