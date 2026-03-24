import { Link } from "wouter";
import { ArrowRight, Zap, Shield, Sparkles, Star } from "lucide-react";
import { motion } from "framer-motion";

const FEATURES = [
  { icon: Zap, title: "Молниеносная скорость", desc: "Оптимизировано для скорости и минимальной задержки." },
  { icon: Shield, title: "Безопасно и приватно", desc: "Ваши данные зашифрованы от начала до конца." },
  { icon: Star, title: "Премиум качество", desc: "Надёжный VPN, который выделяется среди остальных." },
];

export function Home() {
  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center mt-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring" }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/30 mb-6"
        >
          <Sparkles className="text-white w-8 h-8" />
        </motion.div>
        
        <h1 className="text-4xl font-display font-bold mb-3 text-gradient">
          SofxVPN
        </h1>
        <p className="text-muted-foreground text-base max-w-[280px] leading-relaxed">
          VPN создан для помощи людям получать полный доступ в интернет
        </p>
      </section>

      {/* Main Banner */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-6 rounded-3xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10" />
        <h2 className="text-2xl font-bold mb-4 relative z-10 text-white leading-snug">
          SofxVPN Даёт 1 бесплатный день
        </h2>
        
        <div className="grid grid-cols-2 gap-3 relative z-10 mt-6">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <h3 className="text-2xl font-display font-bold text-primary">99%</h3>
            <p className="text-xs text-white/60 mt-1">Удовлетворённость</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <h3 className="text-2xl font-display font-bold text-primary">24/7</h3>
            <p className="text-xs text-white/60 mt-1">Поддержка</p>
          </div>
        </div>
      </motion.div>

      {/* Features List */}
      <section className="flex flex-col gap-4">
        <h3 className="text-lg font-bold px-1 text-white/90">Ключевые преимущества</h3>
        <div className="flex flex-col gap-3">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div 
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + (i * 0.1) }}
                className="glass-panel p-4 rounded-2xl flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="text-primary w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white">{feature.title}</h4>
                  <p className="text-xs text-white/60 mt-0.5">{feature.desc}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* CTA Button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-4"
      >
        <Link 
          href="/services" 
          className="glass-button w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
        >
          Перейти к услугам
          <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.div>
    </div>
  );
}
