import { User } from '../schemas/auth.schema';
import { sign, verify } from 'jsonwebtoken';

export class AuthService {
    private secretKey: string;

    constructor(secretKey: string) {
        this.secretKey = secretKey;
    }

    public async validateUser(credentials: { username: string; password: string }): Promise<User | null> {
        // Logic to validate user credentials against the database
        // Return user object if valid, otherwise return null
    }

    public generateToken(user: User): string {
        const payload = { id: user.id, username: user.username };
        return sign(payload, this.secretKey, { expiresIn: '1h' });
    }

    public verifyToken(token: string): any {
        try {
            return verify(token, this.secretKey);
        } catch (error) {
            return null;
        }
    }
}