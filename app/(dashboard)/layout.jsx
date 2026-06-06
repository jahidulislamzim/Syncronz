'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/context/AuthContext.jsx';
import { Sidebar } from '../../src/layout/Sidebar.jsx';
import { Header } from '../../src/components/Header.jsx';

const LoadingScreen = () => (
  <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 relative overflow-hidden">
    <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
    <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
    <div className="relative flex flex-col items-center space-y-6">
      <div className="relative">
        <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20">
          <span className="text-white font-extrabold text-xl tracking-tight">S</span>
        </div>
        <div className="absolute -inset-2 bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 rounded-3xl blur-xl animate-pulse" />
      </div>
      <div className="text-center space-y-1.5">
        <h1 className="text-lg font-extrabold text-white tracking-tight">Syncronz</h1>
        <p className="text-sm text-slate-400 font-medium">Loading your workspace...</p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

export default function DashboardLayout({ children }) {
  const { user, loading, isAllowed } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login');
      else if (!isAllowed) router.replace('/access-denied');
    }
  }, [user, loading, isAllowed, router]);

  if (loading) return <LoadingScreen />;
  if (!user || !isAllowed) return null;

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(v => !v)} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-[#F8FAFC] subtle-scroll flex flex-col justify-start">
          {children}
        </main>
      </div>
    </div>
  );
}
