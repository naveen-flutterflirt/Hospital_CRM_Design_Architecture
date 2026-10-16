"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Plus } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (typeof document !== 'undefined') {
        document.cookie = 'hospital_crm_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F3F6F5] text-gray-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-[#0B5E5E] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#0B5E5E]/20 animate-pulse">
            <Plus size={24} strokeWidth={3} />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
            <Loader2 size={16} className="animate-spin text-[#0B5E5E]" />
            <span>{!isAuthenticated && !isLoading ? "Redirecting to login..." : "Verifying session security..."}</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
