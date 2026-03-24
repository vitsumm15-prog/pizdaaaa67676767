import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
      <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
      <h1 className="text-4xl font-display font-bold text-white mb-2">404</h1>
      <p className="text-white/60 mb-8 max-w-xs">
        Страница не найдена. Возможно, она была удалена или перемещена.
      </p>
      <Link 
        href="/" 
        className="glass-button bg-primary text-primary-foreground px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/25"
      >
        На главную
      </Link>
    </div>
  );
}
