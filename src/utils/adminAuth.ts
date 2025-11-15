// src/utils/adminAuth.ts

// ❗ TEMP FRONTEND-ONLY AUTH ❗
// Replace this with a real backend-auth later.
// For now, password is read from VITE_ADMIN_PASSWORD (or fallback).
const ADMIN_KEY = "calculatorhub_admin_token";

const FRONTEND_ADMIN_PASSWORD =
  import.meta.env.VITE_ADMIN_PASSWORD || "CHANGE_ME_NOW_987";

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_KEY) === "true";
}

export function loginAdmin(password: string): boolean {
  if (password === FRONTEND_ADMIN_PASSWORD) {
    localStorage.setItem(ADMIN_KEY, "true");
    return true;
  }
  return false;
}

export function logoutAdmin() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_KEY);
}
