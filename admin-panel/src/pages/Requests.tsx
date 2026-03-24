import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Clock, ShieldCheck, Gift } from "lucide-react";
import { MOCK_REQUESTS, AdminRequest, RequestStatus } from "@/hooks/use-admin-data";
import { cn } from "@/lib/utils";

type FilterType = 'all' | 'trial' | 'subscription';

export function Requests() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [requests, setRequests] = useState<AdminRequest[]>(MOCK_REQUESTS);

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.type === filter;
  });

  const handleStatusChange = (id: string, newStatus: RequestStatus) => {
    setRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: newStatus } : req
    ));
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> Ожидает</span>;
      case 'completed':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Check className="w-3 h-3" /> Выполнено</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><X className="w-3 h-3" /> Отклонено</span>;
    }
  };

  return (
    <div className="flex flex-col h-full pt-8 px-4 pb-4">
      <header className="mb-6">
        <h1 className="text-2xl font-display font-bold text-white">Заявки</h1>
        <p className="text-sm text-white/60 mt-1">Управление запросами и покупками</p>
      </header>

      {/* Tabs */}
      <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 mb-6">
        {[
          { id: 'all', label: 'Все' },
          { id: 'trial', label: 'Пробные' },
          { id: 'subscription', label: 'Покупки' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as FilterType)}
            className={cn(
              "flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-300",
              filter === tab.id 
                ? "bg-primary text-primary-foreground shadow-lg" 
                : "text-white/60 hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-4">
        <AnimatePresence mode="popLayout">
          {filteredRequests.map((req) => (
            <motion.div
              key={req.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="glass-panel p-4 rounded-3xl flex flex-col gap-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xl shrink-0">
                    {req.user.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{req.user.name}</h3>
                    <p className="text-[11px] text-white/40 font-mono mt-0.5">ID: {req.user.id}</p>
                  </div>
                </div>
                {getStatusBadge(req.status)}
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    req.type === 'trial' ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                  )}>
                    {req.type === 'trial' ? <Gift className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white/80">
                      {req.type === 'trial' ? 'Пробный VPN' : 'Подписка 119₽'}
                    </p>
                    <p className="text-[10px] text-white/40 mt-0.5">{req.date}</p>
                  </div>
                </div>

                {req.status === 'pending' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleStatusChange(req.id, 'rejected')}
                      className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleStatusChange(req.id, 'completed')}
                      className="w-8 h-8 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {filteredRequests.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="py-12 text-center text-white/40"
            >
              <Inbox className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Нет заявок в этой категории</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
