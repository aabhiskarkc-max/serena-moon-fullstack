'use client';

import { User, FileText, CreditCard, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', path: '/profile', icon: User },
    { name: 'Basic Information', path: '/profile/basic-information', icon: FileText },
    { name: 'Plans', path: '/profile/plan', icon: CreditCard },
    { name: 'Settings', path: '/profile/settings', icon: Settings },
  ];

  return (
<div className="w-full md:w-64 md:shrink-0 bg-white dark:bg-zinc-950 border border-black/5 dark:border-white/5 md:border-r md:border-l-0 md:border-t-0 md:border-b-0 flex flex-col md:sticky md:top-16 md:max-h-[calc(100vh-4rem)] md:overflow-auto rounded-2xl md:rounded-none">   
   <div className="p-8 ">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Account
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.path ||
            pathname.startsWith(item.path + "/"); // for nested routes

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md'
                  : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-black/5 dark:border-white/5">
        <button className="flex items-center gap-3 w-full px-4 py-3 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all duration-200">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Log out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;