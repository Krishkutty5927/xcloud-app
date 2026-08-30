import Link from 'next/link';
import { Cloud, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-6 text-center">
      <div className="w-24 h-24 bg-primary-container text-primary rounded-[2rem] flex items-center justify-center mb-8 shadow-inner animate-pulse">
        <Cloud size={48} />
      </div>
      <h1 className="text-4xl font-black text-on-surface tracking-tighter mb-4">404: Vault Not Found</h1>
      <p className="text-on-surface-variant font-medium max-w-md mb-10 leading-relaxed">
        The resource you are looking for has been moved or does not exist in this encrypted sector.
      </p>
      <Link
        href="/dashboard"
        className="flex items-center gap-3 px-8 py-4 bg-primary text-on-primary rounded-3xl font-black shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest text-xs"
      >
        <Home size={20} />
        Return to Dashboard
      </Link>
    </div>
  );
}
