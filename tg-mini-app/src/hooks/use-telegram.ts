import { useEffect, useState } from "react";
import { authWithTelegram, getAuthToken, setAuthToken, type UserRecord } from "@/lib/api";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
  is_premium?: boolean;
}

const FIRST_NAMES = [
  "Алексей", "Дмитрий", "Максим", "Иван", "Артём",
  "Михаил", "Никита", "Андрей", "Сергей", "Кирилл",
  "Анна", "Мария", "Екатерина", "Ольга", "Татьяна",
  "Наталья", "Юлия", "Елена", "Виктория", "Дарья",
];

const LAST_NAMES = [
  "Иванов", "Смирнов", "Кузнецов", "Попов", "Соколов",
  "Лебедев", "Козлов", "Новиков", "Морозов", "Петров",
  "Волков", "Соловьёв", "Васильев", "Зайцев", "Павлов",
  "Семёнов", "Голубев", "Виноградов", "Богданов", "Воробьёв",
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateUserId(): number {
  return Math.floor(100000 + Math.random() * 900000);
}

function getOrCreateLocalUser(): TelegramUser {
  const stored = localStorage.getItem("sofxvpn_user");
  if (stored) return JSON.parse(stored);

  const user: TelegramUser = {
    id: generateUserId(),
    first_name: randomFrom(FIRST_NAMES),
    last_name: randomFrom(LAST_NAMES),
    username: undefined,
    language_code: "ru",
    is_premium: false,
  };

  localStorage.setItem("sofxvpn_user", JSON.stringify(user));
  return user;
}

export function useTelegram() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [dbUser, setDbUser] = useState<UserRecord | null>(null);

  useEffect(() => {
    async function init() {
      const tg = window.Telegram?.WebApp;

      let telegramUser: TelegramUser;
      let initData: string | undefined;

      if (tg) {
        tg.ready();
        tg.expand();
        initData = tg.initData;

        if (tg.initDataUnsafe?.user) {
          telegramUser = tg.initDataUnsafe.user as TelegramUser;
        } else {
          telegramUser = getOrCreateLocalUser();
        }
      } else {
        telegramUser = getOrCreateLocalUser();
      }

      setUser(telegramUser);

      // Authenticate with backend
      try {
        const payload = initData
          ? { initData }
          : {
              telegramId: telegramUser.id,
              firstName: telegramUser.first_name,
              lastName: telegramUser.last_name,
              username: telegramUser.username,
              photoUrl: telegramUser.photo_url,
            };

        const { user: record, token } = await authWithTelegram(payload);
        setAuthToken(token);
        setDbUser(record);
      } catch (err) {
        // If auth fails (e.g. no backend), continue with local user only
        console.warn("Backend auth failed, continuing offline:", err);
      }

      setIsReady(true);
    }

    init();
  }, []);

  const openTelegramLink = (url: string) => {
    const tg = window.Telegram?.WebApp;
    if (tg && tg.openTelegramLink) {
      tg.openTelegramLink(url);
    } else {
      window.open(url, "_blank");
    }
  };

  return {
    isReady,
    user,
    dbUser,
    tg: window.Telegram?.WebApp,
    openTelegramLink,
    isAuthenticated: !!getAuthToken(),
  };
}
