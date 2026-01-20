'use client';

import { usePathname } from 'next/navigation';
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import AuthProvider from "@/components/auth/AuthProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col md:flex-row">
        {!isLoginPage && <Sidebar />}
        <main className={`flex-1 w-full p-4 md:p-8 ${!isLoginPage ? 'pb-20 md:ml-64 md:pb-8' : ''}`}>
          {children}
        </main>
        {!isLoginPage && <BottomNav />}
      </div>
    </AuthProvider>
  );
}
