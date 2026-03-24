import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { validateInitData, extractTelegramId, authMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

// POST /api/auth — validate Telegram initData, create or update user
router.post("/auth", async (req, res): Promise<void> => {
  const { initData, telegramId: devTelegramId, firstName, lastName, username, photoUrl } = req.body;

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  let telegramUser: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
  } | null = null;

  if (botToken && initData) {
    // Production: validate initData signature
    const data = validateInitData(initData, botToken);
    if (!data || !data.user) {
      res.status(401).json({ error: "Неверный initData" });
      return;
    }
    try {
      telegramUser = JSON.parse(data.user);
    } catch {
      res.status(401).json({ error: "Неверный формат данных пользователя" });
      return;
    }
  } else if (!botToken && devTelegramId) {
    // Development mode: accept direct user data
    telegramUser = {
      id: Number(devTelegramId),
      first_name: firstName || "Разработчик",
      last_name: lastName,
      username: username,
      photo_url: photoUrl,
    };
  } else if (initData && !botToken) {
    // Dev mode with initData: extract telegramId from it directly
    const id = extractTelegramId(initData);
    if (!id) {
      res.status(401).json({ error: "Не удалось извлечь ID" });
      return;
    }
    telegramUser = {
      id,
      first_name: firstName || "Пользователь",
    };
  } else {
    res.status(400).json({ error: "Необходим initData или telegramId" });
    return;
  }

  if (!telegramUser) {
    res.status(400).json({ error: "Не удалось получить данные пользователя" });
    return;
  }

  const now = new Date();

  // Create or update user record
  const [user] = await db
    .insert(usersTable)
    .values({
      telegramId: telegramUser.id,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name ?? null,
      username: telegramUser.username ?? null,
      photoUrl: telegramUser.photo_url ?? null,
      lastSeen: now,
    })
    .onConflictDoUpdate({
      target: usersTable.telegramId,
      set: {
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name ?? null,
        username: telegramUser.username ?? null,
        photoUrl: telegramUser.photo_url ?? null,
        lastSeen: now,
      },
    })
    .returning();

  req.log.info({ telegramId: telegramUser.id }, "User authenticated");

  // Return user + auth token (telegramId as string for MVP)
  res.json({
    user,
    token: String(telegramUser.id),
  });
});

// GET /api/me — get current user
router.get("/me", authMiddleware, async (req, res): Promise<void> => {
  res.json({ user: req.user });
});

// POST /api/subscribe — mark user as subscribed
router.post("/subscribe", authMiddleware, async (req, res): Promise<void> => {
  const [user] = await db
    .update(usersTable)
    .set({ isSubscribed: true })
    .where(eq(usersTable.id, req.user!.id))
    .returning();

  req.log.info({ userId: req.user!.id }, "User subscribed");
  res.json({ user });
});

export default router;
