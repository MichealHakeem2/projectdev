"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import BusinessProfile from '@/components/business/BusinessProfile';

export default function BusinessDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="flex">
        <Sidebar className="hidden lg:block" />
        <main className="flex-1 max-w-5xl mx-auto px-4 py-8">
          <BusinessProfile businessId={id} />
        </main>
      </div>
    </div>
  );
}
