import { Link, useLocation } from "wouter";
import { LayoutDashboard, Inbox, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onLogout?: () => void;
}

export function BottomNav({ onLogout }: BottomNavProps) {
  const [location] = useLocation();

  const NAV_ITEMS = [
    { path: "/", icon: LayoutDashboard, label: "Дашборд" },
    { path: "/requests", icon: Inbox, label: "Заявки" },
    { path: "/participants", icon: Users, label: "Участники" },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 px-4 pb-6 pt-2 bg-gradient-to-t from-[#0B1F3A] via-[#0B1F3A]/90 to-transparent pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <nav className="glass-panel flex items-center justify-around p-2 rounded-2xl shadow-2xl shadow-black/50 border border-white/10 bg-[#0B1F3A]/60">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;

            return (
              <Link key={item.path} href={item.path} className="flex-1">
                <div className="flex flex-col items-center justify-center gap-1 w-full py-2 cursor-pointer group">
                  <div className={cn(
                    "relative flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300",
                    isActive ? "bg-primary/20 text-primary" : "text-white/50 group-hover:text-white/80"
                  )}>
                    <Icon className={cn("w-5 h-5 transition-transform duration-300", isActive && "scale-110")} />
                    {isActive && (
                      <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium transition-colors duration-300",
                    isActive ? "text-primary" : "text-white/50 group-hover:text-white/80"
                  )}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}

          {/* Logout */}
          {onLogout && (
            <button onClick={onLogout} className="flex-1">
              <div className="flex flex-col items-center justify-center gap-1 w-full py-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 text-white/30 group-hover:text-red-400">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium text-white/30 group-hover:text-red-400 transition-colors duration-300">
                  Выйти
                </span>
              </div>
            </button>
          )}
        </nav>
      </div>
    </div>
  );
}
