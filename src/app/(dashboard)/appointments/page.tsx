"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Calendar as CalendarIcon, Clock, Filter, User, Stethoscope, Loader2, AlertCircle } from "lucide-react";
import BranchDropdown from "@/components/ui/BranchDropdown";
import BookAppointmentButton from "@/components/ui/BookAppointmentButton";
import AppointmentActionMenu from "@/components/ui/AppointmentActionMenu";
import Link from "next/link";
import { Appointment, appointmentApi } from "@/lib/api";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await appointmentApi.getAll({
        search: searchQuery,
        status: statusFilter !== "All" ? statusFilter : undefined,
      });

      if (res.success && res.data) {
        setAppointments(res.data);
      } else {
        setError(res.message || "Failed to load appointments");
      }
    } catch (err: any) {
      setError(err.message || "Unable to connect to appointments service");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleBookNew = (_newApp: Appointment) => {
    fetchAppointments();
  };

  const handleCancelAppointment = async (id: string) => {
    try {
      await appointmentApi.cancel(id);
      fetchAppointments();
    } catch (err: any) {
      alert(err.message || "Failed to cancel appointment");
    }
  };

  const cycleStatus = async (app: Appointment) => {
    const nextStatusMap: Record<string, { status: string; statusType: 'primary' | 'success' | 'warning' | 'neutral' | 'alert' }> = {
      'Booked': { status: 'Checked in', statusType: 'success' },
      'Checked in': { status: 'Waiting', statusType: 'warning' },
      'Waiting': { status: 'In consult', statusType: 'primary' },
      'In consult': { status: 'Completed', statusType: 'neutral' },
      'Completed': { status: 'Booked', statusType: 'neutral' },
    };

    const next = nextStatusMap[app.status] || { status: 'Booked', statusType: 'neutral' };

    try {
      await appointmentApi.update(app.uuid || app.id, {
        status: next.status,
        statusType: next.statusType,
      });

      setAppointments(prev => prev.map(a => {
        if (a.id === app.id) {
          return { ...a, status: next.status, statusType: next.statusType };
        }
        return a;
      }));
    } catch (err: any) {
      alert(err.message || "Failed to update appointment status");
    }
  };

  const todayFormatted = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-8 py-4 md:py-6 bg-canvas shrink-0 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Appointments Schedule</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and schedule patient visits in real time</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient or doctor..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-full text-sm w-full md:w-64 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <BranchDropdown />
          <BookAppointmentButton onBook={handleBookNew} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-4 md:pb-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-6 py-4 border-b border-gray-100 bg-gray-50 gap-4">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="flex items-center gap-2 cursor-pointer text-gray-900 font-semibold border-b-2 border-primary pb-1">
                <Clock size={16} className="text-primary"/> List View
              </div>
              <div className="flex items-center gap-2 text-gray-400 font-medium pb-1">
                <CalendarIcon size={16}/> Total: {appointments.length} Bookings
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <CalendarIcon size={14}/> Today, {todayFormatted}
              </span>
              <div className="h-4 w-px bg-gray-300 mx-2"></div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Booked">Booked</option>
                <option value="Checked in">Checked in</option>
                <option value="Waiting">Waiting</option>
                <option value="In consult">In consult</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto flex-1 p-2">
            <table className="w-full text-sm text-left">
              <thead className="bg-white border-b border-gray-100">
                <tr className="text-gray-500">
                  <th className="px-6 py-3 font-medium">Time Slot</th>
                  <th className="px-6 py-3 font-medium">Patient</th>
                  <th className="px-6 py-3 font-medium">Doctor</th>
                  <th className="px-6 py-3 font-medium">Department</th>
                  <th className="px-6 py-3 font-medium">Channel</th>
                  <th className="px-6 py-3 font-medium">Status (Click to toggle)</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-28" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                      <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-20" /></td>
                      <td className="px-6 py-4 text-right"><div className="h-4 bg-gray-200 rounded w-6 ml-auto" /></td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-red-500 font-medium">
                      <AlertCircle size={28} className="mx-auto mb-2 text-red-500" />
                      {error}
                      <button onClick={fetchAppointments} className="ml-3 underline font-semibold text-primary">Retry</button>
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No appointments found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  appointments.map(app => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-gray-900">{app.time || app.timeSlot}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                            <User size={14}/>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{app.patient || app.patientName}</p>
                            {app.patientUhid && (
                              <p className="text-[11px] text-gray-400 font-medium">{app.patientUhid}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium flex items-center gap-1.5 mt-2">
                        <Stethoscope size={14} className="text-primary shrink-0" />
                        <span>{app.doctor || app.doctorName}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{app.dept || app.department}</td>
                      <td className="px-6 py-4 text-gray-600">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          {app.source || 'Walk-in'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => cycleStatus(app)}
                          title="Click to advance status"
                          className={`inline-block px-3 py-1 rounded-full text-xs cursor-pointer hover:opacity-85 transition-opacity font-semibold ${
                            app.statusType === 'primary' ? 'bg-primary/10 text-primary' :
                            app.statusType === 'success' ? 'bg-success/10 text-success' :
                            app.statusType === 'warning' ? 'bg-warning/10 text-warning' :
                            app.statusType === 'alert' ? 'bg-alert/10 text-alert' :
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {app.status}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <AppointmentActionMenu 
                           appointmentId={app.uuid || app.id} 
                           patientName={app.patient || app.patientName}
                           patientUhid={app.patientUhid}
                           patientId={app.patientId}
                           currentDate={app.date}
                           currentTime={app.time || app.timeSlot}
                           onCancel={() => handleCancelAppointment(app.uuid || app.id)} 
                           onRescheduled={fetchAppointments}
                         />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
        </div>
      </div>
    </>
  );
}
