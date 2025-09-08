export interface RequestWithUser extends Express.Request {
    user?: any; // Replace 'any' with the actual user type
}

export interface AuthCredentials {
    username: string;
    password: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
    // Add other user properties as needed
}


export interface UrlScanResult {
    isSafe: boolean;
    category: string;
    score: number;
}