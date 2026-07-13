// ------------------------------------------------
// Authentication Types
// 
// This file describes the shape of login-related 
// data.
//
// TypeScript uses these types to catch mistakes 
// before the app runs in the browser.
// ------------------------------------------------

// Data we send to the backend when logging in.
export type LoginRequest = {
    email: string;
    password: string;
};

// Data we receive back from the backend after login
export type LoginResponse = {
    access_token: string;
    token_type: string;
};

// Basic logged-in user data.
// We will expand this later when we add "current user" support.
export type AuthUser = {
    id: number;
    name: string;
    email: string;
    role: string;
    department_id: number | null;
};