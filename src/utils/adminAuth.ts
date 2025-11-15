// src/utils/adminAuth.ts

// This is the ONLY place where the admin password is stored
// You can change it anytime
const ADMIN_PASSWORD = "$@#P4a2r6k8y$@#";

// Storage key
const ADMIN_TOKEN_KEY = "calculatorhub_admin_token";

// Login function
export function loginAdmin(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    // Create login session (until tab or browser is closed)
    localStorage.setItem(ADMIN_TOKEN_KEY, "LOGGED_IN");
    return true;
  }
  return false;
}

// Check if admin is authenticated
export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_TOKEN_KEY) === "LOGGED_IN";
}

// Logout function
export function logoutAdmin(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}
