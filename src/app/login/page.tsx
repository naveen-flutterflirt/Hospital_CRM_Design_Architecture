"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Plus, Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect to dashboard immediately
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const storedToken = localStorage.getItem('hospital_crm_token');
      if (storedToken && typeof document !== 'undefined') {
        document.cookie = `hospital_crm_token=${storedToken}; path=/; max-age=604800; SameSite=Lax`;
      }
      router.replace("/");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
      router.push("/");
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid email or password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillAdminCredentials = () => {
    setEmail("admin@gmail.com");
    setPassword("admin123");
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F3F6F5] p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#0B5E5E]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#9CCFC8]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Container */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-300">

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 bg-[#0B5E5E] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#0B5E5E]/25 mb-4 group transition-transform hover:scale-105 duration-200">
            <Plus size={28} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Hospital CRM
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Enterprise Clinical Operations & Patient Management
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sm:p-8">

          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Sign In to Your Account</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Enter your authorized staff credentials to continue
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/60 text-red-700 text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
              <span className="shrink-0 font-bold">⚠️</span>
              <p className="flex-1 leading-relaxed">{errorMessage}</p>
            </div>
          )}



          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20 focus:border-[#0B5E5E] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  Password
                </label>

              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20 focus:border-[#0B5E5E] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center pt-1">
              <input
                id="remember-me"
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-[#0B5E5E] border-gray-300 rounded focus:ring-[#0B5E5E]/30 cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 text-xs text-gray-600 cursor-pointer">
                Remember this workstation for 7 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-[#0B5E5E] hover:bg-[#0B5E5E]/90 active:scale-[0.99] text-white rounded-xl text-sm font-semibold shadow-md shadow-[#0B5E5E]/20 hover:shadow-lg hover:shadow-[#0B5E5E]/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>



      </div>
    </div>
  );
}
