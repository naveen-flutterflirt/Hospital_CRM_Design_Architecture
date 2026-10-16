"use client";

import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal, FileText, Calendar, Trash2, X, Clock, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { appointmentApi } from "@/lib/api";

interface AppointmentActionMenuProps {
  appointmentId: string;
  patientName?: string;
  patientUhid?: string | null;
  patientId?: string | null;
  currentDate?: string;
  currentTime?: string;
  onCancel: () => void;
  onRescheduled?: () => void;
}

export default function AppointmentActionMenu({ 
  appointmentId, 
  patientName = "Patient", 
  patientUhid,
  patientId,
  currentDate,
  currentTime,
  onCancel,
  onRescheduled 
}: AppointmentActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  
  const [newDate, setNewDate] = useState(currentDate || new Date().toISOString().split("T")[0]);
  const [newTime, setNewTime] = useState(currentTime || "09:30 AM");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine direct profile route for this patient
  const patientProfileLink = patientUhid 
    ? `/patient/${encodeURIComponent(patientUhid)}` 
    : (patientId ? `/patient/${encodeURIComponent(patientId)}` : `/patients?search=${encodeURIComponent(patientName)}`);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCancel = () => {
    onCancel();
    setShowCancelModal(false);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await appointmentApi.update(appointmentId, {
        appointmentDate: newDate,
        timeSlot: newTime,
        status: "Booked",
        statusType: "neutral"
      });

      setShowRescheduleModal(false);
      showToast(`Appointment for ${patientName} rescheduled to ${newDate} (${newTime})!`);
      if (onRescheduled) {
        onRescheduled();
      }
    } catch (err: any) {
      alert(err.message || "Failed to reschedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="relative inline-block text-left" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-400 hover:text-primary transition-colors p-1.5 rounded-md hover:bg-primary/10 cursor-pointer"
        >
          <MoreHorizontal size={18} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-100 rounded-xl shadow-lg z-40 py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
            <Link
              href={patientProfileLink}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-[#0B5E5E] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <FileText size={14} className="text-[#0B5E5E]" /> View Patient Profile
            </Link>
            <button
              onClick={() => { setIsOpen(false); setShowRescheduleModal(true); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Clock size={14} /> Reschedule
            </button>
            <div className="h-px bg-gray-100 w-full my-1"></div>
            <button
              onClick={() => { setIsOpen(false); setShowCancelModal(true); }}
              className="w-full text-left px-4 py-2 text-sm text-alert hover:bg-alert/5 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Trash2 size={14} /> Cancel Visit
            </button>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel Appointment?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to cancel the scheduled appointment for <strong>{patientName}</strong>?
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setShowCancelModal(false)} 
                className="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Keep it
              </button>
              <button 
                onClick={handleCancel} 
                className="cursor-pointer px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col border border-gray-100">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-[#F8FAF9]">
              <div>
                <h3 className="font-bold text-base text-gray-900">Reschedule Appointment</h3>
                <p className="text-xs text-gray-500">{patientName} {patientUhid && `(${patientUhid})`}</p>
              </div>
              <button onClick={() => setShowRescheduleModal(false)} className="cursor-pointer text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"><X size={18}/></button>
            </div>
            <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 cursor-pointer">New Date</label>
                  <input 
                    type="date" 
                    required 
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm cursor-pointer focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 cursor-pointer">New Time Slot</label>
                  <select 
                    required 
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="cursor-pointer w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button 
                  type="button" 
                  disabled={isSubmitting}
                  onClick={() => setShowRescheduleModal(false)} 
                  className="cursor-pointer px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="cursor-pointer px-5 py-2 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save New Slot</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <CheckCircle size={18} className="text-green-400" />
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}
    </>
  );
}
