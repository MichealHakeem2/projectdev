"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Building2, MessageSquare, TrendingUp, Settings, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import Avatar from '../common/Avatar';

interface SidebarProps {
  className?: string;
  'aria-label'?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className, 'aria-label': ariaLabel }) => {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { href: '/feed', label: 'Feed', icon: Home },
    { href: '/communities', label: 'Communities', icon: Users },
    { href: '/business', label: 'Business', icon: Building2 },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
    { href: '/trending', label: 'Trending', icon: TrendingUp },
  ];

  return (
    <aside className={`hidden lg:block w-64 h-screen sticky top-0 border-r border-gray-100 dark:border-gray-800/50 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm ${className || ''}`} aria-label={ariaLabel}>
      <div className="h-full flex flex-col p-4 space-y-4">
        {/* User Profile Section */}
        {user && (
          <Link
            href={`/profile/${user.id || user._id}`}
            className="glass-effect rounded-xl p-4 hover:shadow-lg transition-all duration-200 mb-4"
          >
            <div className="flex items-center gap-3">
              <Avatar src={user.avatar} alt={user.username || 'User'} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{user.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </Link>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold shadow-sm shadow-primary-500/10'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 w-1 h-8 bg-primary-600 rounded-r-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Settings Link */}
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
            pathname === '/settings'
              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold shadow-sm shadow-primary-500/10'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-400'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;



