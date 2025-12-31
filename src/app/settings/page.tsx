"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, User, Bell, Shield, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import Card from '@/components/common/Card';
import ProfileEditForm from '@/components/profile/ProfileEditForm';
import NotificationSettings from '@/components/settings/NotificationSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import AccountSettings from '@/components/settings/AccountSettings';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/common/Spinner';
import userService, { User as UserType } from '@/services/userService';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'account';

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, user: authUser, isLoading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [userProfile, setUserProfile] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && authUser) {
      loadProfile();
    }
  }, [isAuthenticated, authUser]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await userService.getCurrentUser();
      setUserProfile(data);
    } catch (error) {
      console.error('Failed to load profile settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSuccess = (updatedUser: UserType) => {
    setUserProfile(updatedUser);
    // Optionally show a toast notification here
  };

  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const tabs = [
    { id: 'profile', label: 'Edit Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'account', label: 'Account', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-500">
      <Navbar />
      
      <div className="flex">
        <Sidebar className="hidden lg:block" />
        
        <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Settings Navigation */}
            <div className="w-full md:w-64 space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Settings</h1>
              <div className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as SettingsTab)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 dark:shadow-none'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-900 hover:shadow-sm'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'profile' && userProfile && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Public Profile</h2>
                      <p className="text-gray-600 dark:text-gray-400">Manage your public information and how others see you.</p>
                    </div>
                    <ProfileEditForm 
                      user={userProfile} 
                      onSuccess={handleUpdateSuccess}
                    />
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Notifications</h2>
                      <p className="text-gray-600 dark:text-gray-400">Control how and when you receive updates.</p>
                    </div>
                    <NotificationSettings />
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Security</h2>
                      <p className="text-gray-600 dark:text-gray-400">Manage your account protection and login activity.</p>
                    </div>
                    <SecuritySettings />
                  </div>
                )}

                {activeTab === 'account' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Account</h2>
                      <p className="text-gray-600 dark:text-gray-400">Manage your account status and general preferences.</p>
                    </div>
                    <AccountSettings />
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}
