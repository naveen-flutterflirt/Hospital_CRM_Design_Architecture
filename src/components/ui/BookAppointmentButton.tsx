"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Calendar, User, Clock, Stethoscope, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Doctor, doctorApi, appointmentApi, Appointment } from "@/lib/api";

interface BookAppointmentButtonProps {
  onBook?: (app: Appointment) => void;
  defaultPatient?: { name: string; uhid?: string };
  trigger?: (open: () => void) => React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function BookAppointmentButton({ 
  onBook, 
  defaultPatient, 
  trigger,
  isOpen: controlledIsOpen,
  onOpenChange
}: BookAppointmentButtonProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (open: boolean) => {
    if (isControlled) {
      onOpenChange?.(open);
    } else {
      setInternalIsOpen(open);
    }
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Registered Patients Live Search
  const [registeredPatients, setRegisteredPatients] = useState<any[]>([]);
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);

  // Form Fields
  const [patientName, setPatientName] = useState(defaultPatient?.name || "");
  const [patientUhid, setPatientUhid] = useState(defaultPatient?.uhid || "");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [timeSlot, setTimeSlot] = useState("09:30 AM");
  const [source, setSource] = useState("Walk-in");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (defaultPatient?.name) {
      setPatientName(defaultPatient.name);
      setPatientUhid(defaultPatient.uhid || "");
    }
  }, [defaultPatient]);

  useEffect(() => {
    if (isOpen) {
      doctorApi.getAll({ status: "Active" })
        .then(res => {
          if (res.success && res.data) {
            setDoctorsList(res.data);
            if (res.data.length > 0 && !selectedDoctor) {
              setSelectedDoctor(res.data[0].name);
            }
          }
        })
        .catch(() => null);

      // Fetch registered patients for smart autocomplete
      fetch("http://localhost:5000/api/v1/patients?limit=100")
        .then(r => r.json())
        .then(data => {
          if (data?.data?.patients) {
            setRegisteredPatients(data.data.patients);
          }
        })
        .catch(() => null);
    }
  }, [isOpen, selectedDoctor]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!patientName.trim()) {
      setFormError("Please enter patient name");
      return;
    }

    if (!selectedDoctor) {
      setFormError("Please select a consulting doctor");
      return;
    }

    const matchedDoc = doctorsList.find(d => d.name === selectedDoctor);
    const department = matchedDoc ? matchedDoc.department : "General Medicine";

    setIsSubmitting(true);
    try {
      const res = await appointmentApi.book({
        patientName: patientName.trim(),
        patientUhid: patientUhid.trim() || undefined,
        patientId: patientId || undefined,
        doctorName: selectedDoctor,
        doctorId: matchedDoc?.uuid || matchedDoc?.id,
        department,
        appointmentDate,
        timeSlot,
        source,
        status: "Booked",
        statusType: "neutral",
        notes: notes.trim() || undefined,
      });

      if (res.success && res.data) {
        setIsSubmitting(false);
        setIsOpen(false);
        showToast(`Appointment booked successfully for ${patientName}!`);
        if (onBook) {
          onBook(res.data);
        }
        // Reset fields
        if (!defaultPatient) {
          setPatientName("");
          setPatientUhid("");
        }
        setNotes("");
      } else {
        setFormError(res.message || "Failed to book appointment");
      }
    } catch (err: any) {
      setFormError(err.message || "Network error booking appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {trigger ? (
        trigger(() => setIsOpen(true))
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-sm shadow-primary/20"
        >
          <Plus size={16} strokeWidth={2.5} /> Book Appointment
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-8 border border-gray-100">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#F8FAF9]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Calendar size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Schedule Clinical Appointment</h2>
                  <p className="text-xs text-gray-500">Live booking synced with doctor roster</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto">
              <form id="book-app-form" onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                
                {/* Patient Selection - with Live Search Suggestions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1"><User size={12}/> Patient Name *</span>
                      <span className="text-[10px] text-teal-700 font-medium">Select from registered</span>
                    </label>
                    <input 
                      required 
                      type="text" 
                      value={patientName}
                      onFocus={() => setShowPatientSuggestions(true)}
                      onChange={(e) => {
                        setPatientName(e.target.value);
                        setShowPatientSuggestions(true);
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                      placeholder="Type patient name or UHID..." 
                    />

                    {/* Suggestions list */}
                    {showPatientSuggestions && registeredPatients.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-gray-50">
                        {registeredPatients
                          .filter(p => 
                            p.name.toLowerCase().includes(patientName.toLowerCase()) || 
                            p.uhid.toLowerCase().includes(patientName.toLowerCase())
                          )
                          .slice(0, 5)
                          .map(p => (
                            <div 
                              key={p.id} 
                              onClick={() => {
                                setPatientName(p.name);
                                setPatientUhid(p.uhid);
                                setPatientId(p.uuid || p.id);
                                setShowPatientSuggestions(false);
                              }}
                              className="p-2.5 hover:bg-teal-50/70 cursor-pointer transition-colors flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-bold text-gray-900">{p.name}</p>
                                <p className="text-[10px] text-gray-500 font-mono">UHID: {p.uhid} &bull; {p.genderAge || p.gender}</p>
                              </div>
                              <span className="text-[10px] font-bold bg-teal-50 text-[#0B5E5E] px-2 py-0.5 rounded-full border border-teal-100">
                                {p.status || 'Active'}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Patient UHID (Linked)
                    </label>
                    <input 
                      type="text" 
                      value={patientUhid}
                      onChange={(e) => setPatientUhid(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-100/80 border border-gray-200 rounded-xl text-sm font-mono font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                      placeholder="e.g. BLR-0042871" 
                    />
                  </div>
                </div>

                {/* Date & Time Slot */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <Calendar size={12}/> Appointment Date *
                    </label>
                    <input 
                      required 
                      type="date" 
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <Clock size={12}/> Time Slot *
                    </label>
                    <select 
                      required 
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
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

                {/* Doctor Selection (Live from Database) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <Stethoscope size={12}/> Consulting Doctor *
                  </label>
                  <select 
                    required 
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="">Select Doctor</option>
                    {doctorsList.length > 0 ? (
                      doctorsList.map((doc) => (
                        <option key={doc.id} value={doc.name}>
                          {doc.name} &mdash; {doc.specialty} ({doc.opdRoom || "OPD"})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Dr. Arvind Rao">Dr. Arvind Rao &mdash; Cardiology (Room 102)</option>
                        <option value="Dr. Sneha Iyer">Dr. Sneha Iyer &mdash; Gynaecology (Room 205)</option>
                        <option value="Dr. Manoj Desai">Dr. Manoj Desai &mdash; Orthopaedics (Room 114)</option>
                        <option value="Dr. Kavita Nair">Dr. Kavita Nair &mdash; Neurology (Room 301)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Referral Source */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Booking Channel / Source
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="Walk-in">Walk-in at Reception</option>
                    <option value="Call centre">Hospital Call Centre / IVR</option>
                    <option value="WhatsApp">WhatsApp Chatbot</option>
                    <option value="Website">Patient Web Portal</option>
                    <option value="App">Mobile App</option>
                    <option value="Referral">Doctor Referral</option>
                  </select>
                </div>

                {/* Clinical Notes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Reason for Visit / Symptoms
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Routine follow-up, chest pain consultation, sugar check"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

              </form>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-[#F8FAF9]">
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="book-app-form"
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Booking...</span>
                  </>
                ) : (
                  <span>Confirm Appointment</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <CheckCircle size={18} className="text-green-400" />
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}
    </>
  );
}
