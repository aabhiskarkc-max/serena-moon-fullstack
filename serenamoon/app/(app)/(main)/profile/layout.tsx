import Sidebar from '@/components/profile/sidebar';
import React from 'react';


export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    return (
      <div className="min-h-[calc(100vh-4rem)] w-full">
        <div className="w-full px-1 sm:px-2 lg:px-3 xl:px-4 py-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Sidebar />
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </div>
      </div>
    );
}