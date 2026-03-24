import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle, Lock } from "lucide-react";
import { useTelegram } from "@/hooks/use-telegram";
import { getMessages, sendMessage, type ChatMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const POLL_INTERVAL = 3000;

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Сегодня";
  if (d.toDateString() === yesterday.toDateString()) return "Вчера";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function groupByDate(messages: ChatMessage[]): { date: string; messages: ChatMessage[] }[] {
  const groups: { date: string; messages: ChatMessage[] }[] = [];
  let lastDate = "";

  for (const msg of messages) {
    const date = formatDate(msg.createdAt);
    if (date !== lastDate) {
      groups.push({ date, messages: [] });
      lastDate = date;
    }
    groups[groups.length - 1].messages.push(msg);
  }

  return groups;
}

export function Chat() {
  const { isReady, isAuthenticated, user } = useTelegram();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { messages: msgs } = await getMessages();
      setMessages(msgs);
    } catch {
      // silently fail polling
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Initial fetch + polling
  useEffect(() => {
    if (!isReady) return;
    fetchMessages();
    intervalRef.current = setInterval(fetchMessages, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isReady, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending || !isAuthenticated) return;

    setIsSending(true);
    setInputText("");

    // Optimistic update
    const optimistic: ChatMessage = {
      id: Date.now(),
      userId: 0,
      text,
      fromAdmin: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      await sendMessage(text);
      await fetchMessages();
    } catch {
      // Revert optimistic update on error
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-white/30" />
        </div>
        <h2 className="text-xl font-bold text-white">Нет соединения</h2>
        <p className="text-sm text-white/50 max-w-[220px]">
          Авторизация не выполнена. Откройте приложение через Telegram.
        </p>
      </div>
    );
  }

  const groups = groupByDate(messages);

  return (
    <div className="flex flex-col h-full" style={{ minHeight: "calc(100vh - 10rem)" }}>
      {/* Header */}
      <header className="pt-2 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Поддержка</h1>
            <p className="text-xs text-white/50">SofxVPN · обновляется каждые 3 сек.</p>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2" style={{ maxHeight: "calc(100vh - 22rem)" }}>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 gap-3 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-sm text-white/40 max-w-[200px]">
              Напишите нам — мы ответим как можно скорее
            </p>
          </motion.div>
        )}

        {groups.map((group) => (
          <div key={group.date}>
            {/* Date divider */}
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[11px] text-white/30 font-medium px-2">{group.date}</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <AnimatePresence initial={false}>
              {group.messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex mb-2", msg.fromAdmin ? "justify-start" : "justify-end")}
                >
                  {msg.fromAdmin && (
                    <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center shrink-0 mr-2 mt-1">
                      <span className="text-xs">🛡️</span>
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                      msg.fromAdmin
                        ? "bg-white/8 border border-white/10 text-white rounded-tl-sm"
                        : "bg-primary text-primary-foreground rounded-tr-sm shadow-lg shadow-primary/20"
                    )}
                  >
                    <p>{msg.text}</p>
                    <span
                      className={cn(
                        "text-[10px] mt-1 block text-right",
                        msg.fromAdmin ? "text-white/30" : "text-primary-foreground/60"
                      )}
                    >
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 mt-3">
        <div className="glass-panel flex items-end gap-2 px-3 py-2 rounded-2xl">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите сообщение..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none resize-none leading-relaxed max-h-24 py-1.5"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200",
              inputText.trim() && !isSending
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-white/20 text-center mt-2">
          Нажмите Enter для отправки
        </p>
      </div>
    </div>
  );
}
