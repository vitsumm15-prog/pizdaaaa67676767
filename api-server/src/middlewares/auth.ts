import { createHmac } from "crypto";
import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      user?: typeof usersTable.$inferSelect;
      telegramId?: number;
    }
  }
}

// Validate Telegram initData signature per official spec
export function validateInitData(initData: string, botToken: string): Record<string, string> | null {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    if (!hash) return null;

    urlParams.delete("hash");

    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
    const calculatedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

    if (calculatedHash !== hash) return null;

    const result: Record<string, string> = {};
    urlParams.forEach((v, k) => { result[k] = v; });
    result.hash = hash;
    return result;
  } catch {
    return null;
  }
}

// Extract telegram_id from initData or fallback token
export function extractTelegramId(token: string): number | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (botToken) {
    const data = validateInitData(token, botToken);
    if (!data || !data.user) return null;
    try {
      const user = JSON.parse(data.user);
      return typeof user.id === "number" ? user.id : null;
    } catch {
      return null;
    }
  }

  // Development fallback: token is just the telegramId as string
  const id = parseInt(token, 10);
  return isNaN(id) ? null : id;
}

// Middleware: validates auth, attaches req.user
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Требуется авторизация" });
    return;
  }

  const token = authHeader.slice(7);
  const telegramId = extractTelegramId(token);

  if (!telegramId) {
    res.status(401).json({ error: "Неверный токен авторизации" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.telegramId, telegramId));
  if (!user) {
    res.status(401).json({ error: "Пользователь не найден" });
    return;
  }

  req.user = user;
  req.telegramId = telegramId;
  next();
}

// Middleware: checks admin access
export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  const adminId = process.env.ADMIN_TELEGRAM_ID;
  const adminSecret = req.headers["x-admin-secret"];

  // Admin can authenticate via secret key header (for admin panel web app)
  if (adminSecret && adminSecret === process.env.ADMIN_SECRET_KEY) {
    next();
    return;
  }

  // Or via Telegram ID if authenticated as user
  if (adminId && req.telegramId && String(req.telegramId) === adminId) {
    next();
    return;
  }

  res.status(403).json({ error: "Доступ запрещён" });
}
