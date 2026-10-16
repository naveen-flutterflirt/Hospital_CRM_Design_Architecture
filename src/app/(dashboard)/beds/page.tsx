"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, Filter, Settings, Activity, RefreshCw, UserCheck, 
  ArrowRightLeft, LogOut, Sparkles, CheckCircle2, AlertCircle, Clock, Stethoscope, User
} from "lucide-react";
import { bedsApi, Bed, Ward, BedSummary, patientApi, Patient, doctorApi, Doctor } from "@/lib/api";

const BedLegend = ({ colorClass, label, count }: { colorClass: string; label: string; count?: number }) => (
  <div className="flex items-center gap-2.5 cursor-pointer group">
    <div className={`w-3.5 h-3.5 rounded-sm ${colorClass}`}></div>
    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
      {label} {count !== undefined && <span className="text-xs text-gray-400 font-normal">({count})</span>}
    </span>
  </div>
);

export default function BedsPage() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<string>("");
  const [beds, setBeds] = useState<Bed[]>([]);
  const [summary, setSummary] = useState<BedSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Modals & Selected Bed Actions
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Admission form state
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [attendingDoctor, setAttendingDoctor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Transfer form state
  const [targetBedId, setTargetBedId] = useState("");

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [wardsRes, summaryRes] = await Promise.all([
        bedsApi.getWards(),
        bedsApi.getSummary(),
      ]);

      if (wardsRes.success && wardsRes.data) {
        setWards(wardsRes.data);
        if (!selectedWardId && wardsRes.data.length > 0) {
          setSelectedWardId(wardsRes.data[0].id);
        }
      }

      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (err: any) {
      console.error("Failed to load initial bed data:", err);
      showToast("Error loading bed records");
    } finally {
      setLoading(false);
    }
  }, [selectedWardId]);

  const loadBeds = useCallback(async () => {
    try {
      const res = await bedsApi.getBeds({
        wardId: selectedWardId || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchQuery || undefined,
      });
      if (res.success && res.data) {
        setBeds(res.data);
      }
    } catch (err) {
      console.error("Failed to load beds:", err);
    }
  }, [selectedWardId, statusFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedWardId) {
      loadBeds();
    }
  }, [selectedWardId, loadBeds]);

  // Load patients and doctors list for admission modal
  const fetchAdmissionPrerequisites = useCallback(async () => {
    try {
      const [ptRes, docRes] = await Promise.all([
        patientApi.getAll({ limit: 50 }),
        doctorApi.getAll(),
      ]);

      if (ptRes.success && ptRes.data) {
        const patients = Array.isArray(ptRes.data) ? ptRes.data : (ptRes.data.patients || []);
        setPatientsList(patients);
        if (patients.length > 0) {
          setSelectedPatientId(prev => prev || patients[0].id);
        }
      }

      if (docRes.success && docRes.data) {
        const doctors = Array.isArray(docRes.data) ? docRes.data : [];
        setDoctorsList(doctors);
        if (doctors.length > 0) {
          setSelectedDoctorId(prev => prev || doctors[0].id);
          setAttendingDoctor(prev => prev || doctors[0].name);
        }
      }
    } catch (err) {
      console.error("Failed to load admission options:", err);
    }
  }, []);

  useEffect(() => {
    fetchAdmissionPrerequisites();
  }, [fetchAdmissionPrerequisites]);

  const handleBedClick = (bed: Bed) => {
    setSelectedBed(bed);
    if (bed.status === "vacant") {
      fetchAdmissionPrerequisites();
      setShowAdmitModal(true);
    } else {
      setShowDetailModal(true);
    }
  };

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBed || !selectedPatientId) return;

    try {
      setIsSubmitting(true);
      const chosenDoc = doctorsList.find(d => d.id === selectedDoctorId);
      const docName = chosenDoc ? chosenDoc.name : (attendingDoctor || "Dr. Suresh Rao");

      const res = await bedsApi.admitPatient({
        bedId: selectedBed.id,
        patientId: selectedPatientId,
        doctorId: chosenDoc?.id,
        doctorName: docName,
        diagnosis: diagnosis || "Observation & Post-Op Recovery",
      });

      if (res.success) {
        showToast(`Patient admitted to Bed ${selectedBed.bedNumber} successfully!`);
        setShowAdmitModal(false);
        loadBeds();
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to admit patient");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedBed || !targetBedId) return;

    try {
      setIsSubmitting(true);
      const res = await bedsApi.transferPatient({
        currentBedId: selectedBed.id,
        newBedId: targetBedId,
      });

      if (res.success) {
        showToast(`Patient transferred from Bed ${selectedBed.bedNumber}`);
        setShowTransferModal(false);
        setShowDetailModal(false);
        loadBeds();
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to transfer patient");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDischarge = async () => {
    if (!selectedBed) return;
    if (!confirm(`Confirm discharge for Bed ${selectedBed.bedNumber}? This will mark the bed for Housekeeping Cleaning.`)) return;

    try {
      setIsSubmitting(true);
      const res = await bedsApi.dischargePatient(selectedBed.id, "Routine planned discharge complete");
      if (res.success) {
        showToast(`Bed ${selectedBed.bedNumber} discharged. Moved to cleaning queue.`);
        setShowDetailModal(false);
        loadBeds();
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to discharge patient");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkClean = async (bedId: string) => {
    try {
      setIsSubmitting(true);
      const res = await bedsApi.markBedClean(bedId);
      if (res.success) {
        showToast(`Bed sanitized and marked VACANT & READY.`);
        setShowDetailModal(false);
        loadBeds();
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to mark bed clean");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (bedId: string, status: string) => {
    try {
      const res = await bedsApi.updateStatus(bedId, status);
      if (res.success) {
        showToast(`Bed status updated to ${status}`);
        setShowDetailModal(false);
        loadBeds();
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update bed status");
    }
  };

  const activeWard = wards.find(w => w.id === selectedWardId) || wards[0];

  const getBedStyles = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400 hover:bg-blue-100/80';
      case 'vacant': return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100/80';
      case 'cleaning': return 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800';
      case 'discharge': return 'bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-400 hover:bg-amber-100/80';
      case 'critical': return 'bg-rose-50 text-rose-700 border-rose-300 hover:border-rose-400 hover:bg-rose-100/80 animate-pulse';
      default: return 'bg-gray-100 text-gray-400 border-gray-200';
    }
  };

  const vacantBedsInHospital = beds.filter(b => b.status === 'vacant' && b.id !== selectedBed?.id);

  return (
    <div className="h-full flex flex-col bg-canvas animate-in fade-in duration-300 relative">
      
      {/* Top Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-10 py-4 md:py-6 bg-white shrink-0 z-10 border-b border-gray-100 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Bed Board &middot; IPD</h1>
            <span className="flex items-center gap-1.5 text-xs font-bold text-[#0B5E5E] bg-[#E7F4EE] px-3 py-1 rounded-full">
              <Activity size={14} className="animate-spin text-emerald-600" /> Live Synchronized
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Real-time Inpatient admissions, bed transfers, housekeeping turnaround & tariff tracking
          </p>
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
              placeholder="Search patient, UHID, bed..."
              className="cursor-text pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full md:w-64 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>

          <button 
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
          >
            <Filter size={15} /> Status
          </button>

          <button 
            onClick={() => { loadBeds(); loadData(); showToast("Refreshed bed status"); }}
            className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
            title="Refresh bed data"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#F6F8F8]">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* KPI Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total IPD Capacity</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold text-gray-900">{summary.totalBeds}</span>
                  <span className="text-xs text-emerald-600 font-semibold">{summary.occupancyRate} Occ.</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Currently Occupied</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold text-blue-700">{summary.occupied}</span>
                  <span className="text-xs text-gray-400 font-medium">Patients in Care</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Vacant & Ready</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold text-emerald-700">{summary.vacant}</span>
                  <span className="text-xs text-emerald-600 font-medium">Available</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Discharges Today</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold text-amber-700">{summary.dischargeToday}</span>
                  <span className="text-xs text-amber-600 font-medium">Billing clearance</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between col-span-2 md:col-span-1">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Housekeeping</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold text-slate-900">{summary.cleaning}</span>
                  <span className="text-xs text-slate-500 font-medium">Sanitizing</span>
                </div>
              </div>
            </div>
          )}

          {/* Ward Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {wards.map(ward => {
              const isSelected = ward.id === selectedWardId;
              return (
                <button
                  key={ward.id}
                  onClick={() => setSelectedWardId(ward.id)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all cursor-pointer flex items-center gap-2.5 shadow-sm border ${
                    isSelected 
                      ? "bg-[#0B5E5E] text-white border-[#0B5E5E]" 
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span>{ward.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                  }`}>
                    {ward.totalBeds} beds
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bed Grid Container */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/80 overflow-hidden">
            
            {/* Active Ward Info Header */}
            {activeWard && (
              <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-gray-900 text-lg">{activeWard.name}</h3>
                    <span className="text-gray-300">&middot;</span>
                    <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md">
                      {activeWard.floor}
                    </span>
                    <span className="text-gray-300">&middot;</span>
                    <span className="text-xs font-semibold text-[#0B5E5E]">
                      ₹{activeWard.dailyRate.toLocaleString()}/day tariff
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 font-medium">
                    Department: {activeWard.department} &bull; Type: {activeWard.wardType}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-500">
                    {beds.filter(b => b.status === 'occupied').length} of {beds.length} Occupied
                  </span>
                  <button onClick={() => setShowSettings(true)} className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer">
                    <Settings size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Beds Matrix Grid */}
            <div className="p-6 md:p-8">
              {loading ? (
                <div className="text-center py-16 text-gray-400 font-medium flex items-center justify-center gap-2">
                  <RefreshCw size={18} className="animate-spin text-[#0B5E5E]" /> Loading live bed board...
                </div>
              ) : beds.length === 0 ? (
                <div className="text-center py-16 text-gray-500 font-medium">
                  No beds found matching your current filter.
                </div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-3">
                  {beds.map(bed => (
                    <button
                      key={bed.id}
                      onClick={() => handleBedClick(bed)}
                      className={`h-16 w-full flex flex-col items-center justify-center font-bold rounded-xl border shadow-xs transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer relative group ${getBedStyles(bed.status)}`}
                    >
                      <span className="text-base tracking-tight font-extrabold">{bed.bedNumber}</span>
                      <span className="text-[10px] uppercase font-semibold opacity-80 mt-0.5">
                        {bed.status === 'discharge' ? 'Discharge' : bed.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Color Legend Bar */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-5 md:gap-8">
              <BedLegend colorClass="bg-blue-600" label="Occupied" count={beds.filter(b => b.status === 'occupied').length} />
              <BedLegend colorClass="bg-emerald-600" label="Vacant & Ready" count={beds.filter(b => b.status === 'vacant').length} />
              <BedLegend colorClass="bg-slate-900" label="Cleaning" count={beds.filter(b => b.status === 'cleaning').length} />
              <BedLegend colorClass="bg-amber-500" label="Discharge Today" count={beds.filter(b => b.status === 'discharge').length} />
              <BedLegend colorClass="bg-rose-600" label="Critical / Isolation" count={beds.filter(b => b.status === 'critical').length} />
            </div>

          </div>

        </div>
      </div>

      {/* 1. Bed Detail / Action Modal (For Occupied / Cleaning / Discharge Beds) */}
      {showDetailModal && selectedBed && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-gray-100">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-gray-900">Bed {selectedBed.bedNumber}</h3>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    selectedBed.status === 'occupied' ? 'bg-blue-100 text-blue-700' :
                    selectedBed.status === 'cleaning' ? 'bg-slate-900 text-white' :
                    selectedBed.status === 'discharge' ? 'bg-amber-100 text-amber-800' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {selectedBed.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{selectedBed.wardName} &bull; {selectedBed.floor}</p>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {selectedBed.admission?.patient ? (
                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold text-blue-600 uppercase">Admitted Patient</p>
                      <h4 className="font-bold text-base text-gray-900">{selectedBed.admission.patient.name}</h4>
                      <p className="text-xs font-mono text-gray-500">UHID: {selectedBed.admission.patient.uhid}</p>
                    </div>
                    <span className="text-xs font-semibold bg-white px-2.5 py-1 rounded-md border border-blue-200 text-blue-800">
                      ADM: {selectedBed.admission.admissionNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-100 text-xs text-gray-600">
                    <div>
                      <span className="font-semibold block text-gray-500">Attending Doctor:</span>
                      {selectedBed.admission.doctorName || 'Dr. Attending'}
                    </div>
                    <div>
                      <span className="font-semibold block text-gray-500">Admitted At:</span>
                      {new Date(selectedBed.admission.admittedAt).toLocaleDateString()}
                    </div>
                    <div className="col-span-2">
                      <span className="font-semibold block text-gray-500">Diagnosis:</span>
                      {selectedBed.admission.diagnosis || 'Clinical care and recovery'}
                    </div>
                  </div>
                </div>
              ) : selectedBed.status === 'cleaning' ? (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-center space-y-2">
                  <Clock className="mx-auto text-amber-600" size={28} />
                  <p className="text-sm font-bold text-amber-900">Housekeeping Sanitization in Progress</p>
                  <p className="text-xs text-amber-700">Bed is vacated and undergoing terminal disinfection.</p>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No active admission record associated.
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-gray-500 uppercase">IPD Management Actions</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {selectedBed.admission && (
                    <>
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          setShowTransferModal(true);
                        }}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 transition-colors cursor-pointer"
                      >
                        <ArrowRightLeft size={14} /> Transfer Bed
                      </button>

                      <button
                        onClick={handleDischarge}
                        disabled={isSubmitting}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-bold text-amber-800 transition-colors cursor-pointer"
                      >
                        <LogOut size={14} /> Discharge Patient
                      </button>

                      <button
                        onClick={() => handleStatusChange(selectedBed.id, selectedBed.status === 'critical' ? 'occupied' : 'critical')}
                        className={`col-span-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                          selectedBed.status === 'critical'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <AlertCircle size={14} /> {selectedBed.status === 'critical' ? 'Remove Critical Flag' : 'Mark as Critical / Isolation'}
                      </button>
                    </>
                  )}

                  {selectedBed.status === 'cleaning' && (
                    <button
                      onClick={() => handleMarkClean(selectedBed.id)}
                      disabled={isSubmitting}
                      className="col-span-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      <CheckCircle2 size={15} /> Housekeeping Complete &middot; Mark VACANT
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Admit Patient Modal (When clicking VACANT Bed) */}
      {showAdmitModal && selectedBed && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <form onSubmit={handleAdmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100">
            <div className="p-5 border-b border-gray-100 bg-[#0B5E5E]/5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <UserCheck size={20} className="text-[#0B5E5E]" /> Admit to Bed {selectedBed.bedNumber}
                </h3>
                <p className="text-xs text-gray-500">{selectedBed.wardName} &bull; Tariff ₹{selectedBed.dailyRate}/day</p>
              </div>
              <button type="button" onClick={() => setShowAdmitModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Patient Dropdown */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User size={13} className="text-[#0B5E5E]" /> Select Registered Patient (UHID)
                  </span>
                  <span className="text-[11px] text-gray-400 font-normal">{patientsList.length} registered</span>
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20 cursor-pointer shadow-2xs"
                  required
                >
                  <option value="" disabled>-- Select Patient --</option>
                  {patientsList.map(p => {
                    const patientVal = p.uuid || p.id;
                    return (
                      <option key={p.id} value={patientVal}>
                        {p.name} &bull; UHID: {p.uhid} ({p.gender || 'M'}, {p.phone || 'No phone'}) - {p.department || 'General'}
                      </option>
                    );
                  })}
                </select>
                {selectedPatientId && (() => {
                  const pt = patientsList.find(p => (p.uuid === selectedPatientId || p.id === selectedPatientId));
                  if (!pt) return null;
                  return (
                    <div className="mt-2 p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-gray-800">{pt.name}</span>
                        <span className="text-gray-500 ml-2 font-mono">{pt.uhid}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        {pt.status || 'Active'}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Attending Doctor Dropdown */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Stethoscope size={13} className="text-[#0B5E5E]" /> Attending Doctor
                  </span>
                  <span className="text-[11px] text-gray-400 font-normal">{doctorsList.length} available</span>
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => {
                    setSelectedDoctorId(e.target.value);
                    const doc = doctorsList.find(d => d.id === e.target.value);
                    if (doc) setAttendingDoctor(doc.name);
                  }}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20 cursor-pointer shadow-2xs"
                  required
                >
                  <option value="" disabled>-- Select Doctor --</option>
                  {doctorsList.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} &bull; {doc.specialty || doc.department} ({doc.opdRoom || 'OPD'})
                    </option>
                  ))}
                </select>
                {selectedDoctorId && (() => {
                  const doc = doctorsList.find(d => d.id === selectedDoctorId);
                  if (!doc) return null;
                  return (
                    <div className="mt-2 p-2.5 bg-blue-50/60 rounded-lg border border-blue-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-gray-800">{doc.name}</span>
                        <span className="text-gray-500 ml-2">{doc.specialty}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                        {doc.department}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Admission Diagnosis */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Admission Diagnosis / Clinical Reason
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Total Knee Replacement (TKR) Post-Op, Acute Monitoring"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20 font-medium"
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setShowAdmitModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-[#0B5E5E] hover:bg-[#0B5E5E]/90 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Admitting..." : "Confirm Admission"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Transfer Patient Modal */}
      {showTransferModal && selectedBed && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <ArrowRightLeft size={18} className="text-blue-600" /> Transfer Patient from Bed {selectedBed.bedNumber}
                </h3>
                <p className="text-xs text-gray-500">Patient: {selectedBed.admission?.patient?.name}</p>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Select Vacant Destination Bed
                </label>
                {vacantBedsInHospital.length === 0 ? (
                  <p className="text-xs text-rose-600 font-semibold">No vacant beds currently available in this ward.</p>
                ) : (
                  <select
                    value={targetBedId}
                    onChange={(e) => setTargetBedId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">-- Choose a Bed --</option>
                    {vacantBedsInHospital.map(b => (
                      <option key={b.id} value={b.id}>
                        Bed {b.bedNumber} &middot; {b.wardName} (₹{b.dailyRate}/day)
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <p className="text-xs text-gray-500 italic">
                Note: Bed {selectedBed.bedNumber} will automatically shift to &quot;Cleaning&quot; status upon transfer.
              </p>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleTransfer}
                disabled={!targetBedId || isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Transferring..." : "Complete Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">Filter Bed Matrix</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600 text-sm font-semibold cursor-pointer">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Filter by Status</label>
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer font-medium"
                >
                  <option value="all">All Beds</option>
                  <option value="occupied">Occupied Only</option>
                  <option value="vacant">Vacant & Ready Only</option>
                  <option value="cleaning">Cleaning Underway</option>
                  <option value="discharge">Discharge Due Today</option>
                  <option value="critical">Critical / Isolation</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t border-gray-100">
              <button 
                onClick={() => { setStatusFilter("all"); setShowFilters(false); }}
                className="px-4 py-2 text-xs font-bold text-gray-600 cursor-pointer"
              >
                Reset
              </button>
              <button 
                onClick={() => { setShowFilters(false); loadBeds(); }}
                className="px-5 py-2 text-xs font-bold text-white bg-[#0B5E5E] rounded-lg cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">Board Preferences</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 text-sm font-semibold cursor-pointer">✕</button>
            </div>
            <div className="p-6 space-y-4 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Auto-refresh updates</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#0B5E5E] cursor-pointer" />
              </div>
              <div className="flex items-center justify-between">
                <span>Highlight Critical Wards</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#0B5E5E] cursor-pointer" />
              </div>
              <div className="flex items-center justify-between">
                <span>Show Tariff in Badges</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#0B5E5E] cursor-pointer" />
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => { setShowSettings(false); showToast("Settings updated."); }} 
                className="px-4 py-2 text-xs font-bold text-white bg-[#0B5E5E] rounded-lg cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          </div>
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}

    </div>
  );
}
