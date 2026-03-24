import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ExternalLink, MessageSquare, User, ArrowLeft, Send } from "lucide-react";
import { fetchUsers, fetchDialogs, fetchMessages, sendAdminMessage, type AdminUser, type ChatMessage } from "@/hooks/use-admin-data";
import { cn } from "@/lib/utils";

type TabType = 'participants' | 'messages';

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function formatFullTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function getUserInitials(user: AdminUser): string {
  return `${user.first_name[0]}${user.last_name ? user.last_name[0] : ""}`.toUpperCase();
}

// ─── Chat View ────────────────────────────────────────────────────────────────

function ChatView({ user, onBack }: { user: AdminUser; onBack: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      const { messages: msgs } = await fetchMessages(user.id);
      setMessages(msgs);
    } catch {
      // ignore polling errors
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadMessages();
    intervalRef.current = setInterval(loadMessages, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;
    setIsSending(true);
    setInputText("");
    try {
      await sendAdminMessage(user.id, text);
      await loadMessages();
    } catch {
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/10 mb-4 shrink-0">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
          <ArrowLeft className="w-4 h-4 text-white/70" />
        </button>
        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
          {getUserInitials(user)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-sm truncate">
            {user.first_name} {user.last_name || ""}
          </h3>
          {user.username && <p className="text-xs text-primary truncate">@{user.username}</p>}
        </div>
        {user.username && (
          <a href={`https://t.me/${user.username}`} target="_blank" rel="noreferrer"
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-primary/20 border border-white/10 flex items-center justify-center transition-colors">
            <ExternalLink className="w-4 h-4 text-white/50 hover:text-primary" />
          </a>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-2" style={{ maxHeight: "calc(100vh - 22rem)" }}>
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && messages.length === 0 && (
          <div className="text-center py-10 text-white/30 text-sm">Нет сообщений</div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={cn("flex", msg.fromAdmin ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
              msg.fromAdmin
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-white/8 border border-white/10 text-white rounded-tl-sm"
            )}>
              <p>{msg.text}</p>
              <span className={cn("text-[10px] mt-1 block text-right", msg.fromAdmin ? "text-primary-foreground/60" : "text-white/30")}>
                {formatFullTime(msg.createdAt)}
              </span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 mt-3">
        <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2">
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Написать пользователю..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none resize-none leading-relaxed max-h-24 py-1.5"
          />
          <button onClick={handleSend} disabled={!inputText.trim() || isSending}
            className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all",
              inputText.trim() && !isSending ? "bg-primary text-primary-foreground" : "bg-white/5 text-white/20 cursor-not-allowed"
            )}>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function Participants() {
  const [activeTab, setActiveTab] = useState<TabType>('participants');
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [dialogs, setDialogs] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [u, d] = await Promise.all([fetchUsers(), fetchDialogs()]);
        setUsers(u);
        setDialogs(d);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filteredParticipants = users.filter(u =>
    `${u.first_name} ${u.last_name || ""}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.username || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDialogs = dialogs.filter(d =>
    `${d.first_name} ${d.last_name || ""}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.last_message || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedUser) {
    return (
      <div className="flex flex-col h-full pt-8 px-4 pb-4">
        <ChatView user={selectedUser} onBack={() => setSelectedUser(null)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full pt-8 px-4 pb-4">
      <header className="mb-4">
        <h1 className="text-2xl font-display font-bold text-white">Пользователи</h1>
      </header>

      {/* Search & Tabs */}
      <div className="sticky top-0 z-20 pb-4 bg-[#0B1F3A]/80 backdrop-blur-xl">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input type="text" placeholder="Поиск..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
          {([['participants', 'Участники', User], ['messages', 'Диалоги', MessageSquare]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn("flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2",
                activeTab === id ? "bg-primary text-primary-foreground shadow-lg" : "text-white/60 hover:text-white"
              )}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3">
        {isLoading && (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <AnimatePresence mode="wait">
          {!isLoading && activeTab === 'participants' && (
            <motion.div key="participants" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-3">
              {filteredParticipants.map(u => (
                <div key={u.id} className="glass-panel p-4 rounded-3xl flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 border border-white/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {getUserInitials(u)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{u.first_name} {u.last_name || ""}</h3>
                      {u.username && <p className="text-xs text-primary mt-0.5">@{u.username}</p>}
                      <p className="text-[10px] text-white/40 mt-1">ID: {u.telegram_id} {u.is_subscribed ? "· Подписан" : ""}</p>
                    </div>
                  </div>
                  {u.username && (
                    <a href={`https://t.me/${u.username}`} target="_blank" rel="noreferrer"
                      className="w-10 h-10 rounded-full bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/30 flex items-center justify-center text-white/60 hover:text-primary transition-all duration-300">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
              {filteredParticipants.length === 0 && !isLoading && (
                <div className="text-center py-10 text-white/40 text-sm">Нет участников</div>
              )}
            </motion.div>
          )}

          {!isLoading && activeTab === 'messages' && (
            <motion.div key="messages" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-3">
              {filteredDialogs.map(d => (
                <button key={d.id} onClick={() => setSelectedUser(d)}
                  className="glass-panel p-4 rounded-3xl flex items-start gap-4 cursor-pointer hover:bg-white/5 transition-colors w-full text-left">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-white/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {getUserInitials(d)}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-white text-sm truncate">{d.first_name} {d.last_name || ""}</h3>
                      <span className="text-[10px] text-white/40 whitespace-nowrap ml-2">
                        {d.last_message_at ? formatTime(d.last_message_at) : ""}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 line-clamp-1">
                      {d.last_from_admin ? "Вы: " : ""}{d.last_message || ""}
                    </p>
                  </div>
                  {Number(d.unread_count) > 0 && (
                    <div className="min-w-[20px] h-5 rounded-full bg-primary flex items-center justify-center px-1.5 shrink-0 mt-1">
                      <span className="text-[10px] font-bold text-primary-foreground">{d.unread_count}</span>
                    </div>
                  )}
                </button>
              ))}
              {filteredDialogs.length === 0 && !isLoading && (
                <div className="text-center py-10 text-white/40 text-sm">Нет диалогов</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
