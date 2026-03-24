import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, MessageCircle, Send, Gift, ShieldCheck } from "lucide-react";
import { useTelegram } from "@/hooks/use-telegram";
import { cn } from "@/lib/utils";

const SERVICES = [
  {
    id: "trial",
    title: "Пробный VPN на 1 день",
    desc: "Попробуй SofxVPN бесплатно в течение одного дня — без ограничений.",
    price: "Бесплатно",
    icon: Gift,
    trialOnly: true,
  },
  {
    id: "monthly",
    title: "Ежемесячная подписка",
    desc: "Полный доступ к SofxVPN на 30 дней — быстро, безопасно и без ограничений.",
    price: "119 ₽ / мес",
    icon: ShieldCheck,
    trialOnly: true,
  },
];

export function Services() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useTelegram();

  const handleContact = (action: string) => {
    switch (action) {
      case "chat":
        window.location.href = "/chat";
        break;
      case "request":
        // Navigate to chat to send the request
        window.location.href = "/chat";
        break;
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <header className="pt-2">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Наши услуги</h1>
        <p className="text-sm text-white/60">Выбирайте SofxVPN — с нами безопасно!</p>
      </header>

      <div className="flex flex-col gap-4 flex-1">
        {SERVICES.map((service, i) => {
          const isSelected = selectedId === service.id;
          const Icon = service.icon;
          
          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelectedId(isSelected ? null : service.id)}
              className={cn(
                "glass-panel p-5 rounded-3xl cursor-pointer transition-all duration-300 relative overflow-hidden",
                isSelected ? "border-primary bg-primary/10 shadow-lg shadow-primary/10" : "hover:bg-white/5"
              )}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              )}
              
              <div className="flex items-start justify-between gap-4 relative z-10">
                <div className="flex gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-white/10 text-white"
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{service.title}</h3>
                    <p className="text-sm text-white/60 mt-1 line-clamp-2 leading-relaxed">{service.desc}</p>
                    <div className="mt-3 inline-block px-3 py-1 rounded-full bg-white/10 border border-white/5 text-xs font-semibold text-primary">
                      {service.price}
                    </div>
                  </div>
                </div>
                
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-all duration-300",
                  isSelected ? "bg-primary border-primary" : "border-white/20"
                )}>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                </div>
              </div>

              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: "auto", opacity: 1, marginTop: 24 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    className="overflow-hidden relative z-10"
                  >
                    <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                      <p className="text-xs text-white/50 text-center uppercase tracking-wider font-semibold">Следующий шаг</p>
                      <div className="flex gap-3">
                        {!service.trialOnly && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleContact('dm'); }}
                            className="flex-1 glass-button bg-white/10 hover:bg-white/20 py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 border border-white/5"
                          >
                            <MessageCircle className="w-5 h-5 text-white/80" />
                            <span className="text-xs font-medium text-white/80">Написать</span>
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleContact('request'); }}
                          className="flex-1 glass-button bg-primary hover:bg-primary/90 py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 text-primary-foreground shadow-lg shadow-primary/20"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-xs font-bold">Написать в чат</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
