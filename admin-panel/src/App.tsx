import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, LogOut } from "lucide-react";

import { Layout } from "@/components/layout/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Requests } from "@/pages/Requests";
import { Participants } from "@/pages/Participants";
import NotFound from "@/pages/not-found";
import { getAdminSecret, setAdminSecret, clearAdminSecret } from "@/hooks/use-admin-data";

const queryClient = new QueryClient();

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!secret.trim()) return;
    setIsLoading(true);
    setError("");

    // Test the secret by making a real API call
    try {
      const res = await fetch("/api/admin/users-public", {
        headers: { "x-admin-secret": secret.trim(), "Content-Type": "application/json" },
      });

      if (res.ok) {
        setAdminSecret(secret.trim());
        onLogin();
      } else if (res.status === 403) {
        setError("Неверный секретный ключ. Проверьте ADMIN_SECRET_KEY в настройках.");
      } else {
        setError(`Ошибка сервера: ${res.status}`);
      }
    } catch {
      setError("Не удалось подключиться к серверу.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6" style={{ background: "linear-gradient(135deg, #0B1F3A 0%, #0d2644 60%, #0B1F3A 100%)" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">SofxVPN Admin</h1>
          <p className="text-sm text-white/50 mt-2 text-center">Введите секретный ключ для доступа к панели</p>
        </div>

        <div
          className="p-6 rounded-3xl border border-white/10"
          style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)" }}
        >
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="password"
                placeholder="Секретный ключ..."
                value={secret}
                onChange={e => setSecret(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              onClick={handleLogin}
              disabled={!secret.trim() || isLoading}
              className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-primary/90"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Войти в панель
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-white/25 text-center mt-4">
            Ключ задаётся через переменную ADMIN_SECRET_KEY на сервере
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────

function AppRouter({ onLogout }: { onLogout: () => void }) {
  return (
    <Layout onLogout={onLogout}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/requests" component={Requests} />
        <Route path="/participants" component={Participants} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if a secret is already stored
    const existing = getAdminSecret();
    if (existing) setIsAuthenticated(true);
  }, []);

  const handleLogout = () => {
    clearAdminSecret();
    setIsAuthenticated(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {isAuthenticated ? (
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRouter onLogout={handleLogout} />
          </WouterRouter>
        ) : (
          <LoginScreen onLogin={() => setIsAuthenticated(true)} />
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
