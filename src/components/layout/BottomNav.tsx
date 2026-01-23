'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Refrigerator, BookOpen, List, Settings, Users } from 'lucide-react';

const navItems = [
  { name: '홈', href: '/', icon: LayoutDashboard },
  { name: '재고', href: '/inventory', icon: Refrigerator },
  { name: '레시피', href: '/recipes', icon: BookOpen },
  { name: '커뮤니티', href: '/community', icon: Users },
  { name: '식재료', href: '/products', icon: List },
  { name: '설정', href: '/settings', icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-zinc-800 bg-zinc-950 md:hidden pb-safe">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 text-[10px] font-medium transition-colors ${
              isActive
                ? 'text-blue-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon size={20} className={isActive ? 'stroke-blue-500' : 'stroke-zinc-500'} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
