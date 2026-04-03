import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Image } from './Image';
import {
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ChevronDownIcon,
  BookOpenIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';

const nav = [
  { to: '/compare', label: 'Compare', icon: ArrowsRightLeftIcon },
  { href: 'https://code-explain-production.up.railway.app', label: 'Docs', icon: BookOpenIcon },
  { to: '/settings', label: 'Settings', icon: Cog6ToothIcon },
];

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const isActive = (path: string) => {
    if (path === '/compare') return location.pathname === '/compare';
    if (path === '/settings') return location.pathname === '/settings';
    return false;
  };

  return (
    <div className="min-h-screen bg-page flex">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 w-20 lg:w-56 flex flex-col bg-white border-r border-slate-200/80">
        <div className="flex h-16 lg:h-20 items-center px-3 lg:px-5 border-b border-slate-200/80">
          <Link to="/dashboard" className="flex items-center gap-2 lg:gap-3 min-w-0">
            <Image
              src="/codexplain-logo.png"
              alt="CodeXplain"
              className="object-contain flex-shrink-0"
              width={128}
              height={128}
            />
          </Link>
        </div>

        <nav className="flex-1 py-4 px-2 lg:px-3 space-y-0.5">
          {nav.map((item) => {
            const Icon = item.icon;
            const base =
              'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors';
            const active = 'to' in item && item.to !== undefined && isActive(item.to);
            const style = active
              ? 'bg-primary-50 text-primary-700'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';

            if ('href' in item) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${base} ${style}`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="hidden lg:inline">{item.label}</span>
                </a>
              );
            }
            return (
              <Link
                key={item.label}
                to={item.to!}
                className={`${base} ${style}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="relative p-2 lg:p-3 border-t border-slate-200/80" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <UserCircleIcon className="w-5 h-5 text-primary-600" />
            </div>
            <div className="hidden lg:block min-w-0 flex-1">
              <p className="font-semibold text-charcoal-950 truncate">{user?.username || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
            </div>
            <ChevronDownIcon
              className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {userMenuOpen && (
            <div className="absolute left-2 right-2 lg:left-3 lg:right-auto lg:w-52 bottom-20 lg:bottom-24 bg-white rounded-xl border border-slate-200 shadow-lg py-2 z-50 animate-fade-in">
              <div className="lg:hidden px-4 py-2 border-b border-slate-100">
                <p className="font-semibold text-charcoal-950 truncate">{user?.username || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
              </div>
              <Link
                to="/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Cog6ToothIcon className="w-5 h-5 text-slate-500" />
                Settings
              </Link>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 min-h-screen pl-20 lg:pl-56">
        <Outlet />
      </main>
    </div>
  );
}
