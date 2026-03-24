import { Link, useLocation } from "wouter";
import { Home, Layers, User, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", label: "Главная", icon: Home },
  { path: "/services", label: "Услуги", icon: Layers },
  { path: "/chat", label: "Чат", icon: MessageCircle },
  { path: "/profile", label: "Профиль", icon: User },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe pt-2">
      <div className="glass-panel mx-auto mb-4 flex max-w-md items-center justify-around rounded-2xl px-2 py-3">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;

          return (
            <Link key={item.path} href={item.path} className="relative flex flex-col items-center justify-center w-16 h-12 outline-none">
              <div className="relative z-10 flex flex-col items-center justify-center gap-1">
                <Icon
                  size={22}
                  className={cn(
                    "transition-colors duration-300",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors duration-300",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </div>

              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute inset-0 z-0 rounded-xl bg-primary/10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
