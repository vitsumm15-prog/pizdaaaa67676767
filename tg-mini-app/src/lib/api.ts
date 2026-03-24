// Base API URL — the API server handles /api/* routes
const API_BASE = "/api";

// Get auth token from localStorage
export function getAuthToken(): string | null {
  return localStorage.getItem("sofxvpn_auth_token");
}

// Save auth token
export function setAuthToken(token: string): void {
  localStorage.setItem("sofxvpn_auth_token", token);
}

// Build auth headers
function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Generic fetch wrapper
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface UserRecord {
  id: number;
  telegramId: number;
  username: string | null;
  firstName: string;
  lastName: string | null;
  photoUrl: string | null;
  isSubscribed: boolean;
  lastSeen: string;
  createdAt: string;
}

export interface AuthResponse {
  user: UserRecord;
  token: string;
}

// Authenticate with Telegram initData or dev fallback
export async function authWithTelegram(payload: {
  initData?: string;
  telegramId?: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Get current user
export async function getMe(): Promise<{ user: UserRecord }> {
  return apiFetch<{ user: UserRecord }>("/me");
}

// Subscribe current user
export async function subscribe(): Promise<{ user: UserRecord }> {
  return apiFetch<{ user: UserRecord }>("/subscribe", { method: "POST" });
}

// ─── Messages ────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: number;
  userId: number;
  text: string;
  fromAdmin: boolean;
  createdAt: string;
}

// Send a message
export async function sendMessage(text: string): Promise<{ message: ChatMessage }> {
  return apiFetch<{ message: ChatMessage }>("/messages", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

// Get all messages for current user
export async function getMessages(): Promise<{ messages: ChatMessage[] }> {
  return apiFetch<{ messages: ChatMessage[] }>("/messages");
}

// ─── Admin ───────────────────────────────────────────────────────────────────

const ADMIN_SECRET = () => localStorage.getItem("sofxvpn_admin_secret") || "";

function adminHeaders(): HeadersInit {
  return { "x-admin-secret": ADMIN_SECRET(), "Content-Type": "application/json" };
}

async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...adminHeaders(),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export interface AdminUser extends UserRecord {
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

export async function adminGetUsers(): Promise<{ users: AdminUser[] }> {
  return adminFetch<{ users: AdminUser[] }>("/admin/users-public");
}

export async function adminGetDialogs(): Promise<{ dialogs: AdminUser[] }> {
  return adminFetch<{ dialogs: AdminUser[] }>("/admin/dialogs-public");
}

export async function adminGetMessages(userId: number): Promise<{ messages: ChatMessage[]; user: UserRecord | null }> {
  return adminFetch<{ messages: ChatMessage[]; user: UserRecord | null }>(`/admin/messages-public/${userId}`);
}

export async function adminSendMessage(userId: number, text: string): Promise<{ message: ChatMessage }> {
  return adminFetch<{ message: ChatMessage }>("/admin/messages-public", {
    method: "POST",
    body: JSON.stringify({ userId, text }),
  });
}
