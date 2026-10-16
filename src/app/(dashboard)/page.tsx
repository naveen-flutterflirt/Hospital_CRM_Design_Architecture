"use client";

import React, { useEffect, useState, useRef } from "react";
import { Search, ArrowUp, ArrowDown, RefreshCw, X, User, Phone, FileText, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import NewRegistrationButton from "@/components/ui/NewRegistrationButton";
import { dashboardApi, DashboardOverview, patientApi, Patient } from "@/lib/api";

export default function Dashboard() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await patientApi.getAll({ search: searchQuery.trim(), limit: 5 });
        const patients = (res as any)?.data?.patients || (res as any)?.patients || [];
        setSearchResults(patients);
        setSearchOpen(true);
      } catch (err) {
        console.error("Patient search failed:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getOverview();
      const payload = (res as any)?.data || res;
      if (payload && payload.kpis) {
        setData(payload);
      }
    } catch (err) {
      console.error("Failed to load dashboard overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const kpis = data?.kpis || {
    todayOpd: 0,
    opdAttended: 0,
    bedOccupancy: "0%",
    bedOccupancyText: "0 / 0 beds",
    newLeads: 0,
    adsLeadsText: "0 from ads",
    leadConversion: "0%",
    revenueToday: "₹0",
    pendingTpaClaims: 0,
    delayedTpaClaims: 0,
    npsScore: "+0",
    npsTotalReviews: 0,
    npsDetractors: 0,
  };

  const funnel = data?.funnel || {
    enquiries: 0,
    contacted: 0,
    scheduled: 0,
    visited: 0,
    converted: 0,
  };
  const maxFunnel = Math.max(funnel.enquiries, 1);

  const wards = data?.wards && data.wards.length > 0 ? data.wards : [
    { ward: "General", occupied: 72, total: 90 },
    { ward: "ICU", occupied: 19, total: 20 },
    { ward: "Maternity", occupied: 18, total: 24 },
    { ward: "Paediatrics", occupied: 22, total: 30 },
    { ward: "Private", occupied: 33, total: 36 },
  ];

  const appointments = data?.appointments || [];

  return (
    <>
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-8 py-4 md:py-6 bg-canvas shrink-0 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Good morning, Dr. Mehta</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short" })} &middot; Main Facility
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto">
          {/* Live Workable Searchbar */}
          <div ref={searchRef} className="relative w-full md:w-auto z-30">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                {searchLoading ? (
                  <Loader2 size={16} className="text-[#0B5E5E] animate-spin" />
                ) : (
                  <Search size={16} className="text-gray-400" />
                )}
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setSearchOpen(true);
                }}
                placeholder="Search patient, UHID, phone..."
                className="pl-9 pr-8 py-2 border border-gray-200 rounded-full text-sm w-full md:w-72 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setSearchOpen(false);
                  }}
                  className="absolute inset-y-0 right-2.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Live Search Results Dropdown */}
            {searchOpen && (
              <div className="absolute left-0 right-0 md:w-80 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in duration-150">
                <div className="p-2.5 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <span>Patients Matching &ldquo;{searchQuery}&rdquo;</span>
                  <span>{searchResults.length} Found</span>
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400">
                      {searchLoading ? "Searching live database..." : "No matching patients found"}
                    </div>
                  ) : (
                    searchResults.map((patient) => (
                      <Link
                        key={patient.id}
                        href={`/patients?search=${encodeURIComponent(patient.uhid || patient.name || "")}`}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center justify-between p-3 hover:bg-teal-50/50 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-teal-100/70 text-[#0B5E5E] flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-[#0B5E5E] group-hover:text-white transition-colors">
                            {patient.firstName?.[0] || patient.name?.[0] || "P"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 group-hover:text-[#0B5E5E] transition-colors truncate">
                              {patient.name || `${patient.firstName} ${patient.lastName}`}
                            </p>
                            <p className="text-[10px] text-gray-500 flex items-center gap-2">
                              <span className="font-mono font-medium text-gray-600">{patient.uhid}</span>
                              {patient.contact && <span>&bull; {patient.contact}</span>}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-gray-400 group-hover:text-[#0B5E5E] transition-colors shrink-0" />
                      </Link>
                    ))
                  )}
                </div>

                <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
                  <Link
                    href={`/patients?search=${encodeURIComponent(searchQuery)}`}
                    onClick={() => setSearchOpen(false)}
                    className="text-[11px] font-bold text-[#0B5E5E] hover:underline"
                  >
                    View all in Patients Directory &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={loadDashboardData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            title="Refresh Live Data"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-primary" : "text-gray-500"} />
            <span>Sync</span>
          </button>

          <NewRegistrationButton />
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-4 md:pb-8">
        
        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4 mb-6">
              <KpiCard
                title="Today's OPD"
                value={kpis.todayOpd.toString()}
            subtext={`${kpis.opdAttended} attended`}
          />
          <KpiCard
            title="Bed occupancy"
            value={kpis.bedOccupancy}
            subtext={kpis.bedOccupancyText}
          />
          <KpiCard
            title="New leads"
            value={kpis.newLeads.toString()}
            subtext={kpis.adsLeadsText}
          />
          <KpiCard
            title="Lead conversion"
            value={kpis.leadConversion}
            trend={{ value: "Realtime", direction: "up", color: "text-success" }}
          />
          <KpiCard
            title="Revenue today"
            value={kpis.revenueToday}
            trend={{ value: "Billing Desk", direction: "up", color: "text-success" }}
          />
          <KpiCard
            title="Pending TPA claims"
            value={kpis.pendingTpaClaims.toString()}
            subtext={`${kpis.delayedTpaClaims} older than 15d`}
            subtextColor={kpis.delayedTpaClaims > 0 ? "text-alert" : "text-gray-500"}
          />
        </div>

        {/* Charts Row */}
        {/* Charts Row */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4 mb-6">
          {/* OPD Footfall Chart */}
          <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm flex flex-col">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">OPD footfall — last 7 days</h3>
            <div className="flex items-end justify-between flex-1 gap-2 mt-4 min-h-[140px]">
              {(() => {
                const footfallList = data?.footfall && data.footfall.length > 0
                  ? data.footfall
                  : [
                      { day: 'Fri', count: 0 },
                      { day: 'Sat', count: 0 },
                      { day: 'Sun', count: 0 },
                      { day: 'Mon', count: 0 },
                      { day: 'Tue', count: 1 },
                      { day: 'Wed', count: 1 },
                      { day: 'Thu', count: 6 }
                    ];
                const maxCount = Math.max(...footfallList.map((f: { day: string; count: number }) => f.count), 1);

                return footfallList.map((item: { day: string; count: number }, i: number) => {
                  const pct = Math.max(15, Math.round((item.count / maxCount) * 100));
                  return (
                    <div 
                      key={i} 
                      className="w-full bg-primary-soft/70 hover:bg-primary transition-colors rounded-t-sm relative group cursor-pointer flex flex-col justify-end items-center" 
                      style={{ height: `${pct}%` }}
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-7 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow pointer-events-none transition-opacity z-10 whitespace-nowrap">
                        {item.count} OPD
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
              {(data?.footfall || [
                { day: 'Fri' }, { day: 'Sat' }, { day: 'Sun' }, { day: 'Mon' }, { day: 'Tue' }, { day: 'Wed' }, { day: 'Thu' }
              ]).map((f: { day: string; count?: number }, i: number) => (
                <span key={i}>{f.day}</span>
              ))}
            </div>
          </div>

          {/* Lead to Admission Funnel */}
          <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm flex flex-col">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Lead → admission funnel (Live)</h3>
            <div className="flex flex-col gap-3">
              <FunnelBar label="Enquiries" value={funnel.enquiries} max={maxFunnel} />
              <FunnelBar label="Contacted" value={funnel.contacted} max={maxFunnel} />
              <FunnelBar label="Appointment booked" value={funnel.scheduled} max={maxFunnel} />
              <FunnelBar label="Visited" value={funnel.visited} max={maxFunnel} />
              <FunnelBar label="Admitted / procedure" value={funnel.converted} max={maxFunnel} />
            </div>
          </div>

          {/* Bed Occupancy by Ward */}
          <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm flex flex-col relative">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Bed occupancy by ward</h3>
            <div className="flex flex-col gap-3">
              {wards.map((w: { ward: string; occupied: number; total: number }, idx: number) => (
                <ProgressBar 
                  key={idx} 
                  label={w.ward} 
                  current={w.occupied} 
                  total={w.total} 
                  critical={w.total > 0 && (w.occupied / w.total) >= 0.85} 
                />
              ))}
            </div>
            <p className="text-xs text-alert mt-4 font-medium">Live ward occupancy tracked in PostgreSQL</p>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="flex flex-wrap lg:flex-nowrap gap-6">
          
          {/* Appointments Table */}
          <div className="flex-[1_1_600px] min-w-0 bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Today&apos;s appointments</h3>
              <a href="/appointments" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">View all &rarr;</a>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-medium">Time</th>
                    <th className="pb-2 font-medium">Patient</th>
                    <th className="pb-2 font-medium">Doctor</th>
                    <th className="pb-2 font-medium">Dept</th>
                    <th className="pb-2 font-medium">Source</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-400 text-sm">
                        No appointments scheduled yet today.
                      </td>
                    </tr>
                  ) : (
                    appointments.map((a: any) => (
                      <AppointmentRow 
                        key={a.id}
                        time={a.time} 
                        patient={a.patient} 
                        doctor={a.doctor} 
                        dept={a.dept} 
                        source={a.source} 
                        status={a.status} 
                        statusType={
                          a.status === 'Completed' || a.status === 'Checked in' ? 'success' :
                          a.status === 'In-Consultation' || a.status === 'In consult' ? 'primary' :
                          a.status === 'Cancelled' || a.status === 'No-show' ? 'alert' : 'warning'
                        } 
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Tasks and NPS */}
          <div className="flex-[1_1_300px] min-w-0 flex flex-col gap-4">
            
            {/* Recent Revenue / Billing Feed */}
            <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Recent Billing & Revenue</h3>
                  <p className="text-[11px] text-gray-400">Live invoices & payment status</p>
                </div>
                <a href="/billing" className="text-xs font-semibold text-[#0B5E5E] hover:underline flex items-center gap-1">
                  Billing Desk &rarr;
                </a>
              </div>

              <div className="flex flex-col divide-y divide-gray-50 flex-1 justify-around">
                {(data?.recentInvoices && data.recentInvoices.length > 0 ? data.recentInvoices : [
                  { id: '1', invoiceNumber: 'INV-2026-7908', patientName: 'Neha Kapoor', amount: '₹9,000', status: 'Settled' },
                  { id: '2', invoiceNumber: 'INV-2026-1007', patientName: 'Amit Singh', amount: '₹1.70L', status: 'Settled' },
                  { id: '3', invoiceNumber: 'INV-2026-1004', patientName: 'Vikram K.', amount: '₹1.20L', status: 'Pre-Auth' },
                  { id: '4', invoiceNumber: 'INV-2026-1001', patientName: 'Anita Kumar', amount: '₹2.80L', status: 'Claim Pending' }
                ]).slice(0, 4).map((inv: any) => (
                  <div key={inv.id} className="py-2 flex items-center justify-between hover:bg-gray-50/50 -mx-2 px-2 rounded-lg transition-colors">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-gray-900 truncate">{inv.patientName}</span>
                        <span className="text-[10px] font-mono text-gray-400">{inv.invoiceNumber}</span>
                      </div>
                      <div className="text-[11px] font-bold text-gray-700 mt-0.5">
                        {inv.amount}
                      </div>
                    </div>
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        inv.status === 'Settled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        inv.status === 'Pre-Auth' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        inv.status === 'Claim Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* NPS Card */}
            <a 
              href="/feedback" 
              className="bg-[#0b1f1f] text-white rounded-lg p-5 flex items-center gap-4 shadow-sm hover:ring-2 hover:ring-teal-500/40 transition-all cursor-pointer block"
            >
              <div className="text-3xl font-bold">{kpis.npsScore}</div>
              <div>
                <div className="text-sm font-semibold">Patient NPS &middot; Live</div>
                <div className="text-xs text-gray-300 mt-0.5">
                  {kpis.npsTotalReviews} responses &middot; {kpis.npsDetractors} detractors need callback
                </div>
              </div>
            </a>

          </div>
        </div>
        </>
        )}

      </div>
    </>
  );
}

function KpiCard({ title, value, trend, subtext, subtextColor = "text-gray-500" }: { title: string, value: string, trend?: { value: string, direction: 'up'|'down', color: string }, subtext?: string, subtextColor?: string }) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm flex flex-col">
      <h3 className="text-xs font-medium text-gray-500 mb-2">{title}</h3>
      <div className="text-2xl font-bold text-gray-900 leading-none">{value}</div>
      <div className="mt-2 text-xs font-medium flex items-center h-4">
        {trend && (
          <span className={`flex items-center gap-0.5 ${trend.color}`}>
            {trend.direction === 'up' ? <ArrowUp size={12} strokeWidth={3} /> : <ArrowDown size={12} strokeWidth={3} />}
            {trend.value}
          </span>
        )}
        {subtext && (
          <span className={subtextColor}>{subtext}</span>
        )}
      </div>
    </div>
  );
}

function FunnelBar({ label, value, max }: { label: string, value: number, max: number }) {
  const width = (value / max) * 100;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-900">{value}</span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${width}%` }}></div>
      </div>
    </div>
  );
}

function ProgressBar({ label, current, total, critical = false }: { label: string, current: number, total: number, critical?: boolean }) {
  const width = (current / total) * 100;
  const bgColor = critical ? 'bg-alert' : 'bg-primary';
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-900">{current}/{total}</span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${bgColor} rounded-full transition-all duration-500`} style={{ width: `${width}%` }}></div>
      </div>
    </div>
  );
}

function AppointmentRow({ time, patient, doctor, dept, source, status, statusType }: { time: string, patient: string, doctor: string, dept: string, source: string, status: string, statusType: 'primary' | 'success' | 'warning' | 'alert' | 'neutral' }) {
  
  const statusStyles = {
    primary: 'bg-primary/10 text-primary font-semibold',
    success: 'bg-success/10 text-success font-semibold',
    warning: 'bg-warning/10 text-warning font-semibold',
    alert: 'bg-alert/10 text-alert font-semibold',
    neutral: 'bg-gray-100 text-gray-700 font-semibold'
  };

  return (
    <tr className="hover:bg-gray-50/50 cursor-pointer">
      <td className="py-3 font-medium text-gray-900">{time}</td>
      <td className="py-3 text-gray-700">{patient}</td>
      <td className="py-3 text-gray-700">{doctor}</td>
      <td className="py-3 text-gray-700">{dept}</td>
      <td className="py-3 text-gray-700">{source}</td>
      <td className="py-3">
        <span className={`inline-block px-2.5 py-0.5 rounded text-xs ${statusStyles[statusType]}`}>
          {status}
        </span>
      </td>
    </tr>
  );
}

function TaskRow({ type, patient, info, tagColor = "bg-gray-100 text-gray-700 border-gray-200" }: { type: string, patient: string, info: string, tagColor?: string }) {
  const [completed, setCompleted] = useState(false);

  return (
    <label className="flex items-start gap-2.5 cursor-pointer group p-1.5 -mx-1.5 rounded-lg hover:bg-gray-50/70 transition-colors">
      <input 
        type="checkbox" 
        checked={completed} 
        onChange={() => setCompleted(!completed)}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0B5E5E] focus:ring-[#0B5E5E] cursor-pointer"
      />
      <div className="text-xs leading-snug flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold border ${tagColor}`}>
            {type}
          </span>
          <span className={`font-semibold text-gray-900 ${completed ? 'line-through text-gray-400' : ''}`}>
            {patient}
          </span>
        </div>
        <p className={`text-[11px] text-gray-500 mt-0.5 truncate ${completed ? 'line-through text-gray-400' : ''}`}>
          {info}
        </p>
      </div>
    </label>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm flex flex-col justify-between h-[104px]">
            <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
            <div className="h-7 bg-gray-200 rounded w-16 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-28" />
          </div>
        ))}
      </div>

      {/* Charts Row Skeleton */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        {/* Footfall Chart Skeleton */}
        <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm flex flex-col h-[280px]">
          <div className="h-4 bg-gray-200 rounded w-40 mb-6" />
          <div className="flex items-end justify-between flex-1 gap-2 min-h-[140px] pb-2">
            {[40, 60, 30, 80, 50, 70, 90].map((h, i) => (
              <div key={i} className="w-full bg-gray-100 rounded-t-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="h-3 bg-gray-100 rounded w-full mt-3" />
        </div>

        {/* Funnel Skeleton */}
        <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm flex flex-col h-[280px]">
          <div className="h-4 bg-gray-200 rounded w-48 mb-6" />
          <div className="flex flex-col gap-4 flex-1 justify-around">
            {[90, 75, 60, 45, 30].map((w, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-200 rounded w-28" />
                  <div className="h-3 bg-gray-200 rounded w-8" />
                </div>
                <div className="h-2 bg-gray-100 rounded-full w-full overflow-hidden">
                  <div className="h-full bg-gray-200 rounded-full" style={{ width: `${w}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bed Occupancy Skeleton */}
        <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm flex flex-col h-[280px]">
          <div className="h-4 bg-gray-200 rounded w-44 mb-6" />
          <div className="flex flex-col gap-4 flex-1 justify-around">
            {[75, 90, 60, 70].map((w, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-200 rounded w-10" />
                </div>
                <div className="h-2 bg-gray-100 rounded-full w-full overflow-hidden">
                  <div className="h-full bg-gray-200 rounded-full" style={{ width: `${w}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="h-3 bg-gray-100 rounded w-3/4 mt-3" />
        </div>
      </div>

      {/* Bottom Row Skeleton */}
      <div className="flex flex-wrap lg:flex-nowrap gap-6">
        {/* Appointments Table Skeleton */}
        <div className="flex-[1_1_600px] min-w-0 bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="h-4 bg-gray-200 rounded w-36" />
            <div className="h-3 bg-gray-100 rounded w-16" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
                <div className="h-3.5 bg-gray-200 rounded w-16" />
                <div className="h-3.5 bg-gray-200 rounded w-28" />
                <div className="h-3.5 bg-gray-100 rounded w-24" />
                <div className="h-3.5 bg-gray-100 rounded w-20" />
                <div className="h-3.5 bg-gray-100 rounded w-14" />
                <div className="h-5 bg-gray-200 rounded-full w-20" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="flex-[1_1_300px] min-w-0 flex flex-col gap-4">
          <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm flex-1 flex flex-col justify-between">
            <div className="h-4 bg-gray-200 rounded w-36 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div className="space-y-1">
                    <div className="h-3.5 bg-gray-200 rounded w-24" />
                    <div className="h-3 bg-gray-100 rounded w-14" />
                  </div>
                  <div className="h-5 bg-gray-200 rounded-full w-16" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#0b1f1f] rounded-lg p-5 h-20 flex items-center gap-4">
            <div className="w-12 h-10 bg-teal-900/50 rounded" />
            <div className="space-y-2 flex-1">
              <div className="h-3.5 bg-teal-900/40 rounded w-32" />
              <div className="h-2.5 bg-teal-900/30 rounded w-44" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
