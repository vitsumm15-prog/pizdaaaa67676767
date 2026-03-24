import { useState } from "react";
import { Bell, BellOff, Hash, User, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useTelegram } from "@/hooks/use-telegram";

export function Profile() {
  const { user, isReady } = useTelegram();
  const [notificationsOn, setNotificationsOn] = useState(true);

  const fullName = user
    ? `${user.first_name}${user.last_name ? " " + user.last_name : ""}`
    : "Загрузка...";

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-6">

      {/* Avatar + Name */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 rounded-3xl flex flex-col items-center text-center relative overflow-hidden mt-2"
      >
        <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-b from-primary/25 to-transparent" />

        {/* Owl Avatar */}
        <div className="relative z-10 mb-4 w-24 h-24 rounded-full border-4 border-primary/40 bg-gradient-to-br from-[#0d2847] to-[#0B1F3A] flex items-center justify-center shadow-xl shadow-black/40">
          {user?.photo_url ? (
            <img
              src={user.photo_url}
              alt={fullName}
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-5xl select-none">🦉</span>
          )}
        </div>

        {/* Name */}
        <h2 className="text-2xl font-bold text-white relative z-10">{fullName}</h2>

        {/* Username */}
        {user?.username && (
          <p className="text-primary font-medium text-sm mt-1 relative z-10">
            @{user.username}
          </p>
        )}

        {/* Telegram badge */}
        <div className="mt-3 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-semibold relative z-10">
          Привязан через Telegram
        </div>
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel rounded-3xl overflow-hidden"
      >
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider px-5 pt-4 pb-2">
          Данные аккаунта
        </h3>

        {/* ID */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Hash className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[11px] text-white/40 uppercase tracking-wider">ID</p>
            <p className="text-sm font-semibold text-white mt-0.5">{user?.id ?? "—"}</p>
          </div>
        </div>

        {/* Full name */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[11px] text-white/40 uppercase tracking-wider">Имя</p>
            <p className="text-sm font-semibold text-white mt-0.5">{fullName}</p>
          </div>
        </div>

        {/* Language */}
        <div className="flex items-center gap-3 px-5 py-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[11px] text-white/40 uppercase tracking-wider">Язык</p>
            <p className="text-sm font-semibold text-white mt-0.5">Русский</p>
          </div>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-5 rounded-3xl"
      >
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Настройки</h3>

        <button
          onClick={() => setNotificationsOn((v) => !v)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {notificationsOn
                ? <Bell className="w-5 h-5 text-primary" />
                : <BellOff className="w-5 h-5 text-white/30" />}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Уведомления</p>
              <p className="text-xs text-white/50 mt-0.5">
                {notificationsOn ? "Включены" : "Отключены"}
              </p>
            </div>
          </div>

          <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${notificationsOn ? "bg-primary" : "bg-white/10"}`}>
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${notificationsOn ? "left-7" : "left-1"}`} />
          </div>
        </button>
      </motion.div>

    </div>
  );
}
