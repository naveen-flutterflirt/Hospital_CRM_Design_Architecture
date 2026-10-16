import React, { Suspense } from "react";
import Sidebar from "@/components/layout/Sidebar";
import AuthGuard from "@/components/auth/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex flex-col md:flex-row h-[100dvh] overflow-hidden bg-canvas font-sans text-gray-900 w-full">
        {/* Sidebar with Suspense to resolve usePathname SSR bailout */}
        <Suspense fallback={<div className="hidden md:block w-64 bg-nav shrink-0 h-full border-r border-nav/20" />}>
          <Sidebar />
        </Suspense>
        
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-canvas min-w-0 w-full relative z-0">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
