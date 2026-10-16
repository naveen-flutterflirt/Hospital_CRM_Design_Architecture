"use client";

import React, { useState } from "react";
import { Plus, LayoutDashboard, Users, CalendarCheck, PhoneCall, Bed, Receipt, Megaphone, Stethoscope, MessageSquareHeart, BarChart2, Settings, Menu, X, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { label: "Dashboard", href: "/", icon: <LayoutDashboard size={18} /> },
    { label: "Patients", href: "/patients", icon: <Users size={18} /> },
    { label: "Doctors", href: "/doctors", icon: <Stethoscope size={18} /> },
    { label: "Appointments", href: "/appointments", icon: <CalendarCheck size={18} /> },
    { label: "Leads & Enquiries", href: "/leads", icon: <PhoneCall size={18} /> },
    { label: "Beds / IPD", href: "/beds", icon: <Bed size={18} /> },
    { label: "Billing & TPA", href: "/billing", icon: <Receipt size={18} /> },
    { label: "Campaigns", href: "/campaigns", icon: <Megaphone size={18} /> },
    { label: "Doctor Referrals", href: "/referrals", icon: <Stethoscope size={18} /> },
    { label: "Feedback & NPS", href: "/feedback", icon: <MessageSquareHeart size={18} /> },
    { label: "Reports", href: "/reports", icon: <BarChart2 size={18} /> },
    { label: "Settings", href: "/settings", icon: <Settings size={18} /> },
  ];

  const userInitials = user?.name
    ? user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
    : "AD";

  return (
    <>
      {/* Mobile Top Header (Visible only on mobile) */}
      <div className="md:hidden flex items-center justify-between bg-white text-gray-900 p-4 border-b border-gray-100 shrink-0 shadow-sm relative z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center text-white font-bold text-xs">
              <Plus size={14} />
            </div>
            <span className="font-bold text-lg tracking-tight">[Hospital]</span>
          </div>
        </div>

        {/* Mobile quick actions */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-soft/30 flex items-center justify-center text-primary font-bold text-xs">
            {userInitials}
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Mobile Backdrop with Blur effect */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-nav/60 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer (Mobile & Desktop) */}
      <aside className={`fixed inset-y-0 left-0 md:relative z-50 ${isCollapsed ? 'md:w-20' : 'md:w-64'} w-[280px] bg-nav text-white flex flex-col shrink-0 h-full transform transition-all duration-300 ease-in-out shadow-2xl md:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

        {/* Close Button inside Drawer (Mobile Only) */}
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-6 pb-4 relative mt-2 md:mt-0 shrink-0">
          <div className={`flex items-center gap-3 mb-6 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-primary-soft rounded-lg flex items-center justify-center text-nav font-bold text-sm shrink-0 shadow-inner">
              <Plus size={18} />
            </div>
            {!isCollapsed && <span className="font-semibold text-lg tracking-tight truncate">Hospital CRM</span>}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex absolute top-7 -right-3.5 w-7 h-7 bg-white border border-gray-200 rounded-full items-center justify-center text-gray-700 hover:bg-gray-100 hover:text-primary transition-all shadow-md z-50 cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 px-3 overflow-y-auto scrollbar-hide">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || (pathname?.startsWith('/patient') && item.href.startsWith('/patient'));
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                      ? "bg-primary text-white font-semibold shadow-md shadow-primary/20"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                      } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className={`shrink-0 transition-transform ${!isActive && 'group-hover:scale-110'}`}>{item.icon}</div>
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile & Logout Bottom Bar */}
        <div className="p-3 border-t border-white/10 shrink-0 bg-nav/50">
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors ${isCollapsed ? 'justify-center p-1.5' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-primary-soft/20 text-primary-soft flex items-center justify-center font-bold text-xs shrink-0 border border-primary-soft/30">
              {userInitials}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name || "Administrator"}</p>
                <p className="text-[10px] text-gray-400 truncate">{user?.role || "ADMIN"}</p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>

      </aside>
    </>
  );
}
