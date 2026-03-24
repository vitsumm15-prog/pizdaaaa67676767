// Admin API — connects to the shared api-server at /api
const API_BASE = "/api";

export function getAdminSecret(): string {
  return localStorage.getItem("sofxvpn_admin_secret") || "";
}

export function setAdminSecret(secret: string): void {
  localStorage.setItem("sofxvpn_admin_secret", secret);
}

export function clearAdminSecret(): void {
  localStorage.removeItem("sofxvpn_admin_secret");
}

function adminHeaders(): HeadersInit {
  return {
    "x-admin-secret": getAdminSecret(),
    "Content-Type": "application/json",
  };
}

async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...adminHeaders(), ...options?.headers },
  });

  if (res.status === 403) throw new Error("UNAUTHORIZED");
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: number;
  telegram_id: number;
  first_name: string;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  is_subscribed: boolean;
  last_seen: string;
  created_at?: string;
  // Dialog-specific fields
  last_message?: string;
  last_from_admin?: boolean;
  last_message_at?: string;
  unread_count?: number | string;
}

export interface ChatMessage {
  id: number;
  userId: number;
  text: string;
  fromAdmin: boolean;
  createdAt: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function fetchUsers(): Promise<AdminUser[]> {
  const data = await adminFetch<{ users: AdminUser[] }>("/admin/users-public");
  return data.users;
}

export async function fetchDialogs(): Promise<AdminUser[]> {
  const data = await adminFetch<{ dialogs: AdminUser[] }>("/admin/dialogs-public");
  return data.dialogs;
}

export async function fetchMessages(userId: number): Promise<{ messages: ChatMessage[]; user: AdminUser | null }> {
  return adminFetch<{ messages: ChatMessage[]; user: AdminUser | null }>(`/admin/messages-public/${userId}`);
}

export async function sendAdminMessage(userId: number, text: string): Promise<ChatMessage> {
  const data = await adminFetch<{ message: ChatMessage }>("/admin/messages-public", {
    method: "POST",
    body: JSON.stringify({ userId, text }),
  });
  return data.message;
}

// ─── Mock Fallback (for display while loading) ────────────────────────────────

export type RequestStatus = 'pending' | 'completed' | 'rejected';
export type RequestType = 'trial' | 'subscription';

export interface Activity {
  id: string;
  type: 'request' | 'purchase' | 'message' | 'join';
  desc: string;
  time: string;
}

export interface AdminRequest {
  id: string;
  user: { name: string; avatar: string; id: string };
  type: RequestType;
  status: RequestStatus;
  date: string;
}

export const MOCK_REQUESTS: AdminRequest[] = [
  { id: 'req-1', user: { name: 'Иван Петров', avatar: '👨', id: '492817' }, type: 'trial', status: 'pending', date: 'Сегодня, 14:30' },
  { id: 'req-2', user: { name: 'Анна Смирнова', avatar: '👩', id: '837192' }, type: 'subscription', status: 'completed', date: 'Сегодня, 12:15' },
  { id: 'req-3', user: { name: 'Михаил Козлов', avatar: '🧔', id: '102938' }, type: 'trial', status: 'rejected', date: 'Вчера, 18:45' },
  { id: 'req-4', user: { name: 'Елена Соколова', avatar: '👱‍♀️', id: '564738' }, type: 'trial', status: 'pending', date: 'Вчера, 16:20' },
  { id: 'req-5', user: { name: 'Дмитрий Волков', avatar: '👨‍🦱', id: '918273' }, type: 'subscription', status: 'completed', date: 'Вчера, 11:10' },
  { id: 'req-6', user: { name: 'Ольга Попова', avatar: '👩‍🦰', id: '273645' }, type: 'trial', status: 'pending', date: '2 дня назад' },
];

export const MOCK_ACTIVITIES: Activity[] = [
  { id: '1', type: 'request', desc: 'Иван Петров оставил заявку на пробный VPN', time: '10 мин назад' },
  { id: '2', type: 'purchase', desc: 'Анна Смирнова купила подписку 119₽', time: '25 мин назад' },
  { id: '3', type: 'join', desc: 'Новый участник присоединился', time: '1 час назад' },
  { id: '4', type: 'message', desc: 'Михаил отправил сообщение в поддержку', time: '2 часа назад' },
  { id: '5', type: 'request', desc: 'Елена оставила заявку на пробный VPN', time: '3 часа назад' },
];
