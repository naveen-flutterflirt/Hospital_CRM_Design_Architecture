"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Stethoscope,
  Phone,
  Mail,
  MapPin,
  Clock,
  Award,
  DollarSign,
  Users,
  Edit3,
  Trash2,
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
  LayoutGrid,
  List
} from "lucide-react";
import { Doctor, doctorApi } from "@/lib/api";

const DEPARTMENTS = [
  "All",
  "Cardiology",
  "Gynaecology",
  "Orthopaedics",
  "Neurology",
  "General Medicine",
  "Paediatrics",
  "Dermatology",
  "Oncology",
];

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [deleteDoctorItem, setDeleteDoctorItem] = useState<Doctor | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchDoctors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await doctorApi.getAll({
        search: searchQuery,
        department: selectedDept !== "All" ? selectedDept : undefined,
        status: selectedStatus !== "All" ? selectedStatus : undefined,
      });

      if (res.success && res.data) {
        setDoctors(res.data);
      } else {
        setError(res.message || "Failed to load doctors");
      }
    } catch (err: any) {
      setError(err.message || "Unable to connect to doctors server");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedDept, selectedStatus]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleDeleteDoctor = async (doc: Doctor) => {
    try {
      const res = await doctorApi.delete(doc.uuid || doc.id);
      if (res.success) {
        setDeleteDoctorItem(null);
        showToast(`${doc.name} was removed from the directory.`);
        fetchDoctors();
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete doctor");
    }
  };

  const activeCount = doctors.filter(d => d.status === "Active").length;
  const onLeaveCount = doctors.filter(d => d.status === "On Leave").length;
  const totalAttended = doctors.reduce((acc, d) => acc + (d.patientsAttended || 0), 0);

  return (
    <div className="h-full flex flex-col bg-canvas animate-in fade-in duration-300 relative">

      {/* Top Header */}
      <header className="flex flex-col xl:flex-row xl:items-center justify-between px-4 md:px-8 py-4 md:py-6 bg-canvas shrink-0 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
              <Stethoscope size={18} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Doctors Directory</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage hospital medical staff, consulting rooms, schedules, and OPD fees
          </p>
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full xl:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64 sm:flex-initial">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search doctor, specialty..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-full text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Department Filter with custom icon */}
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="pl-3.5 pr-8 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer appearance-none outline-none focus:ring-2 focus:ring-primary/20"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept === "All" ? "All Departments" : dept}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-gray-400">
              <span className="text-[10px]">&#9662;</span>
            </div>
          </div>

          {/* View Mode Toggle Button */}
          <button
            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer shadow-xs"
            title={viewMode === 'table' ? 'Switch to Card Grid View' : 'Switch to Table List View'}
          >
            {viewMode === 'table' ? (
              <>
                <LayoutGrid size={15} className="text-primary" />
                <span>Card view</span>
              </>
            ) : (
              <>
                <List size={15} className="text-primary" />
                <span>List view</span>
              </>
            )}
          </button>

          {/* Add Doctor Primary Button */}
          <button
            onClick={() => {
              setEditingDoctor(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 cursor-pointer whitespace-nowrap"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add New Doctor</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-4 md:pb-8 space-y-6">

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Stethoscope size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Doctors</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{doctors.length}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active on Duty</p>
              <h3 className="text-2xl font-bold text-success mt-0.5">{activeCount}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-warning/10 text-warning flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">On Leave / Away</p>
              <h3 className="text-2xl font-bold text-warning mt-0.5">{onLeaveCount}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Patients Attended</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totalAttended}</h3>
            </div>
          </div>
        </div>

        {/* Doctors Grid / Table Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-10 bg-gray-50 rounded-xl" />
                <div className="h-4 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
            <AlertCircle size={40} className="mx-auto text-red-500 mb-3" />
            <h3 className="text-lg font-bold text-gray-900">Failed to load doctors</h3>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
            <button
              onClick={fetchDoctors}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        ) : doctors.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
            <Stethoscope size={40} className="mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-bold text-gray-900">No doctors found</h3>
            <p className="text-sm text-gray-500 mt-1">Try modifying your search or add a new doctor.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary/90 inline-flex items-center gap-2"
            >
              <Plus size={16} /> Add First Doctor
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* Table List View */
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden animate-in fade-in">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#F8FAF9] border-b border-gray-100">
                  <tr className="text-gray-500 font-semibold text-xs uppercase tracking-wider">
                    <th className="px-6 py-4">Doctor Name</th>
                    <th className="px-6 py-4">Department & Specialty</th>
                    <th className="px-6 py-4">OPD Room & Timing</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Consultation Fee</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {doctors.map((doc) => {
                    const initials = doc.name
                      .replace(/^Dr\.\s*/i, "")
                      .split(" ")
                      .map(n => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase() || "DR";

                    const isStatusActive = doc.status === "Active";

                    return (
                      <tr key={doc.id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20 shadow-inner">
                              {initials}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 group-hover:text-primary transition-colors flex items-center gap-1.5">
                                {doc.name}
                              </p>
                              <p className="text-xs text-gray-500 font-medium">
                                {doc.qualification || "Specialist"} {doc.registrationNo && `· ${doc.registrationNo}`}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-800">{doc.department}</span>
                          <p className="text-xs text-primary font-medium">{doc.specialty}</p>
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          <p className="font-semibold text-gray-800">{doc.opdRoom || 'Room 101'}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock size={12} className="text-gray-400" />
                            {doc.availableTiming || 'Mon - Sat (09:00 AM - 01:00 PM)'}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-gray-600 text-xs">
                          <p className="font-medium text-gray-800 flex items-center gap-1.5">
                            <Phone size={12} className="text-gray-400" />
                            {doc.phone}
                          </p>
                          {doc.email && (
                            <p className="text-gray-500 flex items-center gap-1.5 mt-0.5">
                              <Mail size={12} className="text-gray-400" />
                              {doc.email}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4 font-bold text-gray-900">
                          ₹{doc.consultationFee}
                        </td>

                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${isStatusActive
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                            {doc.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingDoctor(doc);
                                setShowAddModal(true);
                              }}
                              title="Edit Doctor"
                              className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteDoctorItem(doc)}
                              title="Remove Doctor"
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-6 py-3.5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Showing <strong>{doctors.length}</strong> registered doctors in hospital roster</span>
            </div>
          </div>
        ) : (
          /* Card Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
            {doctors.map((doc) => (
              <DoctorCard
                key={doc.id}
                doctor={doc}
                onEdit={() => {
                  setEditingDoctor(doc);
                  setShowAddModal(true);
                }}
                onDelete={() => setDeleteDoctorItem(doc)}
              />
            ))}
          </div>
        )}

      </div>

      {/* Add / Edit Doctor Modal */}
      {showAddModal && (
        <DoctorFormModal
          doctor={editingDoctor}
          onClose={() => {
            setShowAddModal(false);
            setEditingDoctor(null);
          }}
          onSuccess={(savedName) => {
            setShowAddModal(false);
            setEditingDoctor(null);
            showToast(`${savedName} saved successfully!`);
            fetchDoctors();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteDoctorItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Remove Doctor?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to remove <strong>{deleteDoctorItem.name}</strong> from the hospital directory?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteDoctorItem(null)}
                className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDoctor(deleteDoctorItem)}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors cursor-pointer"
              >
                Yes, Remove
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

    </div>
  );
}

function DoctorCard({
  doctor,
  onEdit,
  onDelete
}: {
  doctor: Doctor;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const initials = doctor.name
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .map(n => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "DR";

  const isStatusActive = doctor.status === "Active";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between group">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0 border border-primary/20 shadow-inner">
              {initials}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base group-hover:text-primary transition-colors">
                {doctor.name}
              </h3>
              <p className="text-xs text-primary font-semibold">{doctor.specialty}</p>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${isStatusActive
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
            {doctor.status}
          </span>
        </div>

        {/* Qualification & Dept */}
        <div className="space-y-2 py-3 border-y border-gray-50 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Award size={14} className="text-gray-400 shrink-0" />
            <span className="font-medium text-gray-800 truncate">{doctor.qualification || "Qualified Specialist"}</span>
            {doctor.registrationNo && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded ml-auto">
                {doctor.registrationNo}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-gray-400 shrink-0" />
            <span className="truncate">{doctor.opdRoom || "OPD Wing"} &middot; {doctor.department}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gray-400 shrink-0" />
            <span className="truncate">{doctor.availableTiming || "Daily 10:00 AM - 02:00 PM"}</span>
          </div>
        </div>

        {/* Contact Details */}
        <div className="mt-3 space-y-1.5 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Phone size={13} className="text-gray-400" />
            <span>{doctor.phone}</span>
          </div>
          {doctor.email && (
            <div className="flex items-center gap-2 truncate">
              <Mail size={13} className="text-gray-400" />
              <span className="truncate">{doctor.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer & Actions */}
      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-gray-400 uppercase font-semibold">Consultation Fee</span>
          <p className="text-sm font-bold text-gray-900">₹{doctor.consultationFee}</p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            title="Edit Doctor"
            className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
          >
            <Edit3 size={15} />
          </button>
          <button
            onClick={onDelete}
            title="Remove Doctor"
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function DoctorFormModal({
  doctor,
  onClose,
  onSuccess,
}: {
  doctor: Doctor | null;
  onClose: () => void;
  onSuccess: (name: string) => void;
}) {
  const isEditing = !!doctor;

  const [name, setName] = useState(doctor?.name || "Dr. ");
  const [specialty, setSpecialty] = useState(doctor?.specialty || "");
  const [department, setDepartment] = useState(doctor?.department || "General Medicine");
  const [qualification, setQualification] = useState(doctor?.qualification || "");
  const [registrationNo, setRegistrationNo] = useState(doctor?.registrationNo || "");
  const [phone, setPhone] = useState(doctor?.phone || "+91 ");
  const [email, setEmail] = useState(doctor?.email || "");
  const [opdRoom, setOpdRoom] = useState(doctor?.opdRoom || "Room 101");
  const [consultationFee, setConsultationFee] = useState<number>(doctor?.consultationFee || 500);
  const [availableTiming, setAvailableTiming] = useState(doctor?.availableTiming || "Mon - Sat (09:00 AM - 01:00 PM)");
  const [status, setStatus] = useState<string>(doctor?.status || "Active");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name || name.trim().length < 4) {
      setFormError("Please enter a valid doctor name with Dr. prefix");
      return;
    }
    if (!specialty || specialty.trim().length < 2) {
      setFormError("Specialty is required");
      return;
    }
    if (!phone || phone.trim().length < 8) {
      setFormError("Valid phone number is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name,
        specialty,
        department,
        qualification,
        registrationNo,
        phone,
        email: email || undefined,
        opdRoom,
        consultationFee,
        availableTiming,
        status,
      };

      if (isEditing) {
        await doctorApi.update(doctor.uuid || doctor.id, payload);
      } else {
        await doctorApi.create(payload);
      }

      onSuccess(name);
    } catch (err: any) {
      setFormError(err.message || "Failed to save doctor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-8 border border-gray-100">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-[#F8FAF9]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Stethoscope size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                {isEditing ? "Edit Doctor Profile" : "Add New Medical Specialist"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isEditing ? "Update consulting details and room allocation" : "Add doctor to hospital OPD roster and appointments"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Name & Specialty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Doctor Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Rajesh Sharma"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Specialty / Sub-specialty *</label>
              <input
                type="text"
                required
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. Interventional Cardiology"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Department & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Department *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                {DEPARTMENTS.filter(d => d !== "All").map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Roster Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="Active">Active on Duty</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Qualification & Registration No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Qualifications</label>
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="e.g. MBBS, MD, DM"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Medical Council Reg. No</label>
              <input
                type="text"
                value={registrationNo}
                onChange={(e) => setRegistrationNo(e.target.value)}
                placeholder="e.g. KMC-49281"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Contact Phone *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@hospital.com"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Room, Fee, Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">OPD Room</label>
              <input
                type="text"
                value={opdRoom}
                onChange={(e) => setOpdRoom(e.target.value)}
                placeholder="e.g. Room 102"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Consultation Fee (₹)</label>
              <input
                type="number"
                min="0"
                step="50"
                value={consultationFee}
                onChange={(e) => setConsultationFee(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">OPD Timing</label>
              <input
                type="text"
                value={availableTiming}
                onChange={(e) => setAvailableTiming(e.target.value)}
                placeholder="e.g. 10:00 AM - 02:00 PM"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 active:scale-[0.99] rounded-xl shadow-md shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving Doctor...</span>
                </>
              ) : (
                <span>{isEditing ? "Save Changes" : "Confirm & Add Doctor"}</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
