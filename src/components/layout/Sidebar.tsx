'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Refrigerator, BookOpen, Settings, List, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

const menuItems = [
  { name: '대시보드', href: '/', icon: LayoutDashboard },
  { name: '재고 관리', href: '/inventory', icon: Refrigerator },
  { name: '레시피 기록', href: '/recipes', icon: BookOpen },
  { name: '식재료 마스터', href: '/products', icon: List }, // Added
];

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut, user } = useAuthStore();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col border-r border-zinc-800 bg-zinc-950 p-6 z-40">
      <div className="mb-10 flex items-center gap-2">
        <div className="h-8 w-8 rounded-sm bg-blue-600 flex items-center justify-center">
          <span className="text-white font-bold text-lg">K</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight">Kitchen Log</h1>
      </div>
      
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600/10 text-blue-500'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="space-y-1 border-t border-zinc-800 pt-6">
        <div className="px-3 py-2 mb-2">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Account</p>
          <p className="text-xs text-zinc-300 truncate font-medium mt-1">
            {user?.user_metadata?.display_name || user?.email || 'Guest'}
          </p>
        </div>
        <Link 
          href="/settings"
          className={`flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
            pathname === '/settings' ? 'bg-blue-600/10 text-blue-500' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }`}
        >
          <Settings size={18} />
          설정
        </Link>
        <button 
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium text-red-500/70 transition-colors hover:bg-red-500/10 hover:text-red-500"
        >
          <LogOut size={18} />
          로그아웃
        </button>
      </div>
    </aside>
  );
}