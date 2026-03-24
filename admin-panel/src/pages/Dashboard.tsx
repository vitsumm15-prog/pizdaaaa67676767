import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { 
  Users, 
  Inbox, 
  CreditCard, 
  MessageSquare,
  ArrowRight,
  Zap,
  ShoppingBag,
  UserPlus,
  MessageCircle
} from "lucide-react";
import { fetchUsers, fetchDialogs, MOCK_ACTIVITIES, type AdminUser, type Activity } from "@/hooks/use-admin-data";

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин назад`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ч назад`;
  return `${Math.floor(hrs / 24)} дн назад`;
}

function getActivityIcon(type: string) {
  switch(type) {
    case 'request': return <Zap className="w-4 h-4 text-blue-400" />;
    case 'purchase': return <ShoppingBag className="w-4 h-4 text-emerald-400" />;
    case 'join': return <UserPlus className="w-4 h-4 text-purple-400" />;
    case 'message': return <MessageCircle className="w-4 h-4 text-amber-400" />;
    default: return <Zap className="w-4 h-4 text-primary" />;
  }
}

export function Dashboard() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [dialogs, setDialogs] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [u, d] = await Promise.all([fetchUsers(), fetchDialogs()]);
        setUsers(u);
        setDialogs(d);
      } catch {
        // Keep empty arrays on error
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const totalMembers = users.length;
  const subscribedCount = users.filter(u => u.is_subscribed).length;
  const totalUnread = dialogs.reduce((acc, d) => acc + Number(d.unread_count || 0), 0);
  const recentCount = dialogs.length;

  const STAT_CARDS = [
    { title: "Новые диалоги", value: isLoading ? "—" : recentCount, icon: Inbox, color: "text-blue-400", bg: "bg-blue-400/10" },
    { title: "Подписок", value: isLoading ? "—" : subscribedCount, icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { title: "Непрочитанных", value: isLoading ? "—" : totalUnread, icon: MessageSquare, color: "text-amber-400", bg: "bg-amber-400/10" },
    { title: "Участников", value: isLoading ? "—" : totalMembers, icon: Users, color: "text-purple-400", bg: "bg-purple-400/10" },
  ];

  // Build activity from real data
  const activities: Activity[] = dialogs.slice(0, 5).map((d, i) => ({
    id: String(i),
    type: "message" as const,
    desc: `${d.first_name}${d.last_name ? " " + d.last_name : ""}: ${d.last_message || "написал сообщение"}`,
    time: d.last_message_at ? relativeTime(d.last_message_at) : "",
  }));

  const displayActivities = activities.length > 0 ? activities : MOCK_ACTIVITIES;

  return (
    <div className="flex flex-col gap-6 p-4 pt-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">SofxVPN Admin</h1>
          <p className="text-sm text-white/60 mt-1">Панель управления сервисом</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
          <span className="text-lg">🛡️</span>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 gap-3 mt-2">
        {STAT_CARDS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel p-4 rounded-3xl relative overflow-hidden"
            >
              <div className={`w-10 h-10 rounded-2xl ${stat.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <h3 className="text-3xl font-display font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-xs font-medium text-white/50">{stat.title}</p>
            </motion.div>
          );
        })}
      </section>

      {/* Quick Actions */}
      <section className="flex gap-3">
        <Link href="/participants" className="flex-1 glass-button bg-primary/20 hover:bg-primary/30 border border-primary/30 py-3 rounded-2xl flex items-center justify-center gap-2 text-primary font-semibold text-sm">
          Диалоги
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link href="/participants" className="flex-1 glass-button bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-2xl flex items-center justify-center gap-2 text-white font-semibold text-sm">
          Участники
          <Users className="w-4 h-4" />
        </Link>
      </section>

      {/* Recent Activity */}
      <section className="mt-2">
        <h2 className="text-lg font-bold text-white/90 mb-4 px-1">Последняя активность</h2>
        <div className="glass-panel rounded-3xl overflow-hidden flex flex-col">
          {displayActivities.map((activity, i) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className={`flex items-start gap-4 p-4 ${i !== displayActivities.length - 1 ? 'border-b border-white/5' : ''}`}
            >
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/90 leading-snug truncate">{activity.desc}</p>
                <p className="text-[11px] text-white/40 mt-1.5">{activity.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
