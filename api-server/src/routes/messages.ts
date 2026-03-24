import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { messagesTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";

const router: IRouter = Router();

// POST /api/messages — user sends a message
router.post("/messages", authMiddleware, async (req, res): Promise<void> => {
  const { text } = req.body;
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    res.status(400).json({ error: "Текст сообщения не может быть пустым" });
    return;
  }

  const [message] = await db
    .insert(messagesTable)
    .values({
      userId: req.user!.id,
      text: text.trim(),
      fromAdmin: false,
    })
    .returning();

  req.log.info({ userId: req.user!.id, messageId: message.id }, "Message sent");
  res.status(201).json({ message });
});

// GET /api/messages — get current user's messages
router.get("/messages", authMiddleware, async (req, res): Promise<void> => {
  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.userId, req.user!.id))
    .orderBy(messagesTable.createdAt);

  res.json({ messages });
});

// GET /api/admin/users — list users (admin only), filter by last 24h or subscribed
router.get("/admin/users", authMiddleware, adminMiddleware, async (req, res): Promise<void> => {
  const { subscribed, recent } = req.query;

  let query = db.select().from(usersTable);

  if (subscribed === "true") {
    const results = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.isSubscribed, true))
      .orderBy(desc(usersTable.lastSeen));
    res.json({ users: results });
    return;
  }

  if (recent === "true") {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { sql } = await import("drizzle-orm");
    const results = await db
      .select()
      .from(usersTable)
      .where(sql`${usersTable.lastSeen} >= ${oneDayAgo}`)
      .orderBy(desc(usersTable.lastSeen));
    res.json({ users: results });
    return;
  }

  const results = await db.select().from(usersTable).orderBy(desc(usersTable.lastSeen));
  res.json({ users: results });
});

// GET /api/admin/dialogs — list all dialogs (last message per user)
router.get("/admin/dialogs", authMiddleware, adminMiddleware, async (req, res): Promise<void> => {
  // Get all users who have sent at least one message, with their latest message
  const { sql } = await import("drizzle-orm");

  const dialogs = await db.execute(sql`
    SELECT 
      u.id,
      u.telegram_id,
      u.first_name,
      u.last_name,
      u.username,
      u.photo_url,
      u.is_subscribed,
      u.last_seen,
      m.text as last_message,
      m.from_admin as last_from_admin,
      m.created_at as last_message_at,
      (SELECT COUNT(*) FROM messages WHERE user_id = u.id AND from_admin = false AND created_at > COALESCE((SELECT MAX(created_at) FROM messages WHERE user_id = u.id AND from_admin = true), '1970-01-01')) as unread_count
    FROM users u
    INNER JOIN messages m ON m.id = (
      SELECT id FROM messages WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1
    )
    ORDER BY m.created_at DESC
  `);

  res.json({ dialogs: dialogs.rows });
});

// GET /api/admin/messages/:userId — get all messages for a specific user
router.get("/admin/messages/:userId", authMiddleware, adminMiddleware, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const userId = parseInt(raw, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Неверный ID пользователя" });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.userId, userId))
    .orderBy(messagesTable.createdAt);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  res.json({ messages, user: user || null });
});

// POST /api/admin/messages — admin sends message to a user
router.post("/admin/messages", authMiddleware, adminMiddleware, async (req, res): Promise<void> => {
  const { userId, text } = req.body;

  if (!userId || !text || typeof text !== "string" || text.trim().length === 0) {
    res.status(400).json({ error: "Необходимы userId и текст" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, Number(userId)));
  if (!user) {
    res.status(404).json({ error: "Пользователь не найден" });
    return;
  }

  const [message] = await db
    .insert(messagesTable)
    .values({
      userId: Number(userId),
      text: text.trim(),
      fromAdmin: true,
    })
    .returning();

  req.log.info({ userId, messageId: message.id }, "Admin sent message");
  res.status(201).json({ message });
});

// Admin-only route without user auth (for web admin panel with secret key)
router.get("/admin/users-public", async (req, res): Promise<void> => {
  const secret = req.headers["x-admin-secret"];
  if (!secret || secret !== process.env.ADMIN_SECRET_KEY) {
    res.status(403).json({ error: "Доступ запрещён" });
    return;
  }

  const results = await db.select().from(usersTable).orderBy(desc(usersTable.lastSeen));
  res.json({ users: results });
});

router.get("/admin/dialogs-public", async (req, res): Promise<void> => {
  const secret = req.headers["x-admin-secret"];
  if (!secret || secret !== process.env.ADMIN_SECRET_KEY) {
    res.status(403).json({ error: "Доступ запрещён" });
    return;
  }

  const { sql } = await import("drizzle-orm");

  const dialogs = await db.execute(sql`
    SELECT 
      u.id,
      u.telegram_id,
      u.first_name,
      u.last_name,
      u.username,
      u.photo_url,
      u.is_subscribed,
      u.last_seen,
      m.text as last_message,
      m.from_admin as last_from_admin,
      m.created_at as last_message_at,
      (SELECT COUNT(*) FROM messages WHERE user_id = u.id AND from_admin = false AND created_at > COALESCE((SELECT MAX(created_at) FROM messages WHERE user_id = u.id AND from_admin = true), '1970-01-01')) as unread_count
    FROM users u
    INNER JOIN messages m ON m.id = (
      SELECT id FROM messages WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1
    )
    ORDER BY m.created_at DESC
  `);

  res.json({ dialogs: dialogs.rows });
});

router.get("/admin/messages-public/:userId", async (req, res): Promise<void> => {
  const secret = req.headers["x-admin-secret"];
  if (!secret || secret !== process.env.ADMIN_SECRET_KEY) {
    res.status(403).json({ error: "Доступ запрещён" });
    return;
  }

  const raw = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const userId = parseInt(raw, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Неверный ID пользователя" });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.userId, userId))
    .orderBy(messagesTable.createdAt);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  res.json({ messages, user: user || null });
});

router.post("/admin/messages-public", async (req, res): Promise<void> => {
  const secret = req.headers["x-admin-secret"];
  if (!secret || secret !== process.env.ADMIN_SECRET_KEY) {
    res.status(403).json({ error: "Доступ запрещён" });
    return;
  }

  const { userId, text } = req.body;
  if (!userId || !text || typeof text !== "string" || text.trim().length === 0) {
    res.status(400).json({ error: "Необходимы userId и текст" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, Number(userId)));
  if (!user) {
    res.status(404).json({ error: "Пользователь не найден" });
    return;
  }

  const [message] = await db
    .insert(messagesTable)
    .values({
      userId: Number(userId),
      text: text.trim(),
      fromAdmin: true,
    })
    .returning();

  res.status(201).json({ message });
});

export default router;
