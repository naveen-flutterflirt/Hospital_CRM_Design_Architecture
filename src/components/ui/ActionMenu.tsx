"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  MoreHorizontal, 
  FileText, 
  Calendar, 
  Edit3, 
  Trash2, 
  X, 
  CheckCircle, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  Loader2 
} from "lucide-react";
import Link from "next/link";
import { Patient, patientApi } from "@/lib/api";
import BookAppointmentButton from "@/components/ui/BookAppointmentButton";

interface ActionMenuProps {
  patient: Patient;
  onDelete: () => void;
  onUpdated?: () => void;
}

export default function ActionMenu({ patient, onDelete, onUpdated }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  
  // Edit Form State pre-filled with patient details
  const [firstName, setFirstName] = useState(patient.firstName || patient.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(patient.lastName || patient.name?.split(" ").slice(1).join(" ") || "");
  const [phone, setPhone] = useState(patient.contact || "");
  const [email, setEmail] = useState(patient.email || "");
  const [dob, setDob] = useState(patient.dob ? patient.dob.substring(0, 10) : "");
  const [gender, setGender] = useState(patient.gender || "M");
  const [department, setDepartment] = useState(patient.department || "General Medicine");
  const [status, setStatus] = useState(patient.status || "OPD - Registered");
  const [statusType, setStatusType] = useState(patient.statusType || "neutral");
  const [abhaStatus, setAbhaStatus] = useState<'Linked' | 'Pending'>(patient.abha || "Pending");
  
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync state whenever patient prop changes
  useEffect(() => {
    setFirstName(patient.firstName || patient.name?.split(" ")[0] || "");
    setLastName(patient.lastName || patient.name?.split(" ").slice(1).join(" ") || "");
    setPhone(patient.contact || "");
    setEmail(patient.email || "");
    setDob(patient.dob ? patient.dob.substring(0, 10) : "");
    setGender(patient.gender || "M");
    setDepartment(patient.department || "General Medicine");
    setStatus(patient.status || "OPD - Registered");
    setStatusType(patient.statusType || "neutral");
    setAbhaStatus(patient.abha || "Pending");
  }, [patient]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = () => {
    onDelete();
    setShowDeleteModal(false);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!firstName.trim()) {
      setFormError("First name is required.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setFormError("Valid phone number is required (min 8 digits).");
      return;
    }

    setIsSaving(true);
    try {
      const patientIdentifier = patient.uuid || patient.id;
      const res = await patientApi.update(patientIdentifier, {
        firstName,
        lastName,
        phone,
        email: email || undefined,
        dob: dob || undefined,
        gender,
        department,
        status,
        statusType,
        abha: abhaStatus,
      });

      if (res.success) {
        setShowEditModal(false);
        showToast(`Patient ${firstName} ${lastName} updated successfully!`);
        if (onUpdated) {
          onUpdated();
        }
      } else {
        setFormError(res.message || "Failed to update patient details.");
      }
    } catch (err: any) {
      setFormError(err.message || "Error updating patient details.");
    } finally {
      setIsSaving(false);
    }
  };

  // Format creation time nicely
  const formattedCreationTime = patient.createdAt
    ? new Date(patient.createdAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "Original Registration Time Preserved";

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
          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-40 py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
            <Link
              href={`/patient/${encodeURIComponent(patient.uhid || patient.id)}`}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors flex items-center gap-2 cursor-pointer"
            >
              <FileText size={14} /> View Profile
            </Link>
            <button
              onClick={() => { setIsOpen(false); setShowBookModal(true); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Calendar size={14} /> Book Appointment
            </button>
            <button
              onClick={() => { setIsOpen(false); setShowEditModal(true); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Edit3 size={14} /> Edit Details
            </button>
            <div className="h-px bg-gray-100 w-full my-1"></div>
            <button
              onClick={() => { setIsOpen(false); setShowDeleteModal(true); }}
              className="w-full text-left px-4 py-2 text-sm text-alert hover:bg-alert/5 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-nav/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-alert/10 text-alert flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Patient?</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete <strong>{patient.name}</strong>? This action will remove them from the database.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-white bg-alert rounded-lg hover:bg-alert/90 cursor-pointer">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Edit Patient Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-nav/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-8 border border-gray-100">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-[#F8FAF9]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-gray-900">Edit Patient Details</h3>
                  <span className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-0.5 rounded-full">
                    {patient.uhid}
                  </span>
                </div>
                {/* Creation Time Read-Only Badge */}
                <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                  <Clock size={13} className="text-gray-400" />
                  <span>Registered: <strong className="text-gray-700 font-medium">{formattedCreationTime}</strong></span>
                  <span className="text-gray-300">&bull;</span>
                  <span>(Creation time remains preserved)</span>
                </div>
              </div>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200/50 transition-colors cursor-pointer"
              >
                <X size={20}/>
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">First Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Last Name</label>
                  <input 
                    type="text" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                  />
                </div>
              </div>

              {/* Contact & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone Number *</label>
                  <input 
                    type="tel" 
                    required 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="patient@example.com"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                  />
                </div>
              </div>

              {/* DOB & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date of Birth</label>
                  <input 
                    type="date" 
                    value={dob} 
                    onChange={(e) => setDob(e.target.value)} 
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Gender</label>
                  <div className="flex gap-2">
                    {["M", "F", "O"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`flex-1 py-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                          gender === g 
                            ? "bg-primary text-white border-primary shadow-sm shadow-primary/20" 
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {g === "M" ? "Male" : g === "F" ? "Female" : "Other"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ABHA Status Section (Highlighted) */}
              <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                    abhaStatus === 'Linked' ? 'bg-[#16A34A] text-white shadow-md shadow-[#16A34A]/20' : 'bg-gray-200 text-gray-600'
                  }`}>
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">ABHA Health ID Status</h4>
                    <p className="text-[11px] text-gray-600">
                      {abhaStatus === 'Linked' 
                        ? 'Ayushman Bharat Health Account is verified and linked.' 
                        : 'ABHA is currently pending linking / verification.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAbhaStatus('Pending')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      abhaStatus === 'Pending'
                        ? 'bg-gray-100 text-gray-800 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbhaStatus('Linked')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      abhaStatus === 'Linked'
                        ? 'bg-[#16A34A] text-white shadow-md shadow-[#16A34A]/25'
                        : 'text-gray-500 hover:text-[#16A34A]'
                    }`}
                  >
                    <CheckCircle size={13} />
                    Linked
                  </button>
                </div>
              </div>

              {/* Department & Clinic Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Gynecology">Gynecology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Oncology">Oncology</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Patient Clinical Status</label>
                  <select
                    value={status}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStatus(val);
                      if (val.includes("Triaged")) setStatusType("primary");
                      else if (val.includes("Consultation")) setStatusType("warning");
                      else if (val.includes("Admitted")) setStatusType("alert");
                      else if (val.includes("Discharged") || val.includes("Follow-up")) setStatusType("success");
                      else setStatusType("neutral");
                    }}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="OPD - Registered">OPD - Registered</option>
                    <option value="OPD - Triaged">OPD - Triaged</option>
                    <option value="In Consultation">In Consultation</option>
                    <option value="IPD - Admitted">IPD - Admitted</option>
                    <option value="Discharged">Discharged</option>
                    <option value="Follow-up">Follow-up</option>
                  </select>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  disabled={isSaving}
                  onClick={() => setShowEditModal(false)} 
                  className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 active:scale-[0.99] rounded-xl shadow-md shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Patient Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real Live Book Appointment Modal hooked to Neon Database */}
      <BookAppointmentButton 
        isOpen={showBookModal}
        onOpenChange={setShowBookModal}
        defaultPatient={{
          name: patient.name,
          uhid: patient.uhid
        }}
        onBook={() => {
          showToast(`Appointment booked successfully for ${patient.name}!`);
          if (onUpdated) {
            onUpdated();
          }
        }}
        trigger={() => null}
      />

      {/* Custom Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] bg-gray-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <CheckCircle size={18} className="text-success" />
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}
    </>
  );
}
