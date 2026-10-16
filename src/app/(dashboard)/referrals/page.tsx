"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, Plus, Filter, Users, Stethoscope, DollarSign, Activity, 
  Download, Phone, Mail, RefreshCw, CheckCircle, Clock, AlertCircle, Trash2, ChevronDown, UserCheck, FileText
} from "lucide-react";
import { 
  referralApi, ReferringDoctor, ReferralDoctorStatus, ReferralSummary, 
  doctorApi, Doctor, billingApi, Bill, patientApi, Patient 
} from "@/lib/api";

export default function ReferralsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("All Specialties");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  
  const [doctors, setDoctors] = useState<ReferringDoctor[]>([]);
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [hospitalDoctors, setHospitalDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Selection
  const [showFilters, setShowFilters] = useState(false);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [showLogCase, setShowLogCase] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<ReferringDoctor | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Doctor Form State
  const [docName, setDocName] = useState("");
  const [docSpecialty, setDocSpecialty] = useState("General Physician");
  const [customSpecialty, setCustomSpecialty] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [docPhone, setDocPhone] = useState("");
  const [docEmail, setDocEmail] = useState("");
  const [docCity, setDocCity] = useState("Mumbai");
  const [commissionRate, setCommissionRate] = useState<number | "">(10);
  const [docStatus, setDocStatus] = useState<ReferralDoctorStatus>("Active");
  const [docNotes, setDocNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Log Referred Case Form State
  const [hospitalBills, setHospitalBills] = useState<Bill[]>([]);
  const [casePatientSource, setCasePatientSource] = useState<"existing" | "manual">("existing");
  const [selectedBillId, setSelectedBillId] = useState("");
  const [casePatientName, setCasePatientName] = useState("");
  const [caseProcedure, setCaseProcedure] = useState("Total Knee Replacement (TKR)");
  const [caseCustomProcedure, setCaseCustomProcedure] = useState("");
  const [caseBillAmount, setCaseBillAmount] = useState<number | "">("");
  const [caseCommissionRate, setCaseCommissionRate] = useState<number | "">("");
  const [caseStatus, setCaseStatus] = useState("Admitted");
  const [isLoggingCase, setIsLoggingCase] = useState(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [listRes, sumRes, docsRes, billsRes] = await Promise.all([
        referralApi.getAll({
          search: searchQuery || undefined,
          specialty: specialtyFilter !== "All Specialties" ? specialtyFilter : undefined,
          status: statusFilter !== "All Statuses" ? statusFilter : undefined,
        }),
        referralApi.getSummary(),
        doctorApi.getAll(),
        billingApi.getAll({ limit: 50 }),
      ]);

      if (listRes.success && listRes.data) {
        setDoctors(listRes.data);
      }
      if (sumRes.success && sumRes.data) {
        setSummary(sumRes.data);
      }
      if (docsRes.success && docsRes.data) {
        setHospitalDoctors(docsRes.data);
      }
      if (billsRes.success && billsRes.data?.invoices) {
        setHospitalBills(billsRes.data.invoices);
      }
    } catch (err: any) {
      console.error("Failed to load referral data:", err);
      showToast("Error loading referral network from server");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, specialtyFilter, statusFilter]);

  // When staff selects an existing patient invoice from the dropdown
  const handleSelectExistingBill = (billId: string) => {
    setSelectedBillId(billId);
    if (!billId) {
      setCasePatientName("");
      setCaseProcedure("OPD Specialist Consultation");
      setCaseBillAmount("");
      return;
    }

    const bill = hospitalBills.find(b => b.id === billId || b.invoiceNumber === billId);
    if (bill) {
      setCasePatientName(bill.patient);
      // Derive procedure from bill type or insurance
      let proc = bill.type === "Surgery" ? "Total Knee Replacement (TKR)" : `${bill.type} Treatment`;
      setCaseProcedure(proc);
      setCaseBillAmount(bill.amount || bill.grossAmount || 0);
      setCaseStatus(bill.status === "Settled" ? "Discharged" : "Admitted");
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const finalSpecialty = docSpecialty === "Other" ? customSpecialty : docSpecialty;
      
      const payload = {
        name: docName,
        specialty: finalSpecialty || "General Physician",
        clinic: clinicName,
        phone: docPhone,
        email: docEmail || undefined,
        city: docCity,
        status: docStatus,
        commissionRate: commissionRate ? Number(commissionRate) : 10,
        notes: docNotes || undefined,
      };

      const res = await referralApi.create(payload);
      if (res.success && res.data) {
        showToast(`Doctor ${res.data.name} added to referral network!`);
        setShowAddDoctor(false);
        // Reset form
        setDocName("");
        setDocSpecialty("General Physician");
        setCustomSpecialty("");
        setClinicName("");
        setDocPhone("");
        setDocEmail("");
        setDocNotes("");
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to add doctor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDoctor = async (doc: ReferringDoctor, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`Are you sure you want to remove ${doc.name} from the referral network?`)) return;
    try {
      const targetId = doc.uuid || doc.id;
      const res = await referralApi.delete(targetId);
      if (res.success) {
        showToast(`Doctor ${doc.name} removed successfully`);
        if (selectedDoctor?.id === doc.id || selectedDoctor?.uuid === doc.uuid) {
          setSelectedDoctor(null);
        }
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to delete doctor");
    }
  };

  const handleLogReferralCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    try {
      setIsLoggingCase(true);
      const procedure = caseProcedure === "Other" ? caseCustomProcedure : caseProcedure;
      const res = await referralApi.logCase(selectedDoctor.id, {
        patientName: casePatientName,
        procedureName: procedure || "Specialist Procedure",
        billAmount: Number(caseBillAmount),
        commissionRate: caseCommissionRate !== "" ? Number(caseCommissionRate) : undefined,
        status: caseStatus,
      });

      if (res.success && res.data) {
        showToast(`₹${formatCurrency(Number(caseBillAmount))} added to ${selectedDoctor.name}'s revenue! Doctor honorarium: ₹${res.data.calculatedCommission}`);
        setShowLogCase(false);
        // Reset form
        setCasePatientName("");
        setCaseBillAmount("");
        setCaseCommissionRate("");
        setCaseCustomProcedure("");
        // Reload details & list
        const updatedDoc = await referralApi.getById(selectedDoctor.id);
        if (updatedDoc.success && updatedDoc.data) {
          setSelectedDoctor(updatedDoc.data);
        }
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to log referral case");
    } finally {
      setIsLoggingCase(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusStyles = (status: ReferralDoctorStatus) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Inactive': return 'bg-gray-100 text-gray-500 border-gray-200';
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleExport = () => {
    if (doctors.length === 0) {
      showToast('No doctors to export');
      return;
    }

    const headers = ["Doctor Code", "Doctor Name", "Specialty", "Clinic / Hospital", "Phone", "Email", "City", "Status", "Patients Referred", "Revenue Generated", "Incentive Rate (%)"];
    const rows = doctors.map(doc => [
      `"${doc.id}"`,
      `"${doc.name}"`,
      `"${doc.specialty}"`,
      `"${doc.clinic}"`,
      `"${doc.phone}"`,
      `"${doc.email || ''}"`,
      `"${doc.city || 'Mumbai'}"`,
      `"${doc.status}"`,
      doc.patientsReferred,
      doc.revenueGenerated,
      doc.commissionRate || 10
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Doctor_Referrals_Network_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Exported referral network report to CSV successfully!");
  };

  return (
    <div className="h-full flex flex-col bg-[#F6F8F8] animate-in fade-in duration-300 relative">
      
      {/* Header Area */}
      <div className="bg-white shrink-0 z-10 shadow-sm border-b border-gray-100">
        <header className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-10 py-4 md:py-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Doctor Referrals</h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">Manage referring doctors, clinic partnerships, and network ROI</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-auto">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search doctor, clinic, specialty..."
                className="cursor-text pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full md:w-72 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20 transition-all placeholder:text-gray-400 font-medium"
              />
            </div>

            <button 
              onClick={() => { loadData(); showToast("Refreshed referral network"); }}
              className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>

            <button 
              onClick={() => setShowFilters(true)}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Filter size={16} /> Filters
            </button>

            <button 
              onClick={handleExport}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download size={16} /> Export
            </button>

            <button 
              onClick={() => setShowAddDoctor(true)}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-[#0B5E5E] text-white rounded-lg text-sm font-semibold hover:bg-[#0B5E5E]/90 transition-colors shadow-sm"
            >
              <Plus size={16} /> Add Doctor
            </button>
          </div>
        </header>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-10 scrollbar-hide space-y-8">
        
        {/* KPI Cards Ribbon */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Network</span>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">{summary.totalDoctors} Doctors</p>
                <span className="text-xs text-emerald-600 font-semibold mt-0.5 block">{summary.activeDoctors} Active Partnerships</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Stethoscope size={20} />
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Patients Referred</span>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">{summary.totalPatientsReferred}</p>
                <span className="text-xs text-gray-500 font-medium mt-0.5 block">Avg {(summary.totalPatientsReferred / (summary.totalDoctors || 1)).toFixed(0)} per Doctor</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-[#0B5E5E]">
                <Users size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Revenue Generated</span>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">{formatCurrency(summary.totalRevenueGenerated)}</p>
                <span className="text-xs text-purple-600 font-semibold mt-0.5 block">Direct IPD / OPD Value</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <DollarSign size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Top Performer</span>
                <p className="text-base font-bold text-gray-900 mt-1 truncate max-w-[150px]">
                  {summary.topPerformer ? summary.topPerformer.name : 'N/A'}
                </p>
                <span className="text-xs text-orange-600 font-semibold mt-0.5 block">
                  {summary.topPerformer ? `${summary.topPerformer.patients_referred} Patients (${formatCurrency(Number(summary.topPerformer.revenue_generated))})` : 'No referrals'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                <Activity size={20} />
              </div>
            </div>
          </div>
        )}

        {/* Main Table Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto scrollbar-hide">
          <table className="w-full min-w-max text-sm text-left whitespace-nowrap">
            <thead className="bg-white text-gray-500 font-bold border-b border-gray-100">
              <tr>
                <th className="px-6 py-5">Doctor Name</th>
                <th className="px-6 py-5">Specialty</th>
                <th className="px-6 py-5">Clinic / Hospital</th>
                <th className="px-6 py-5">Patients Referred</th>
                <th className="px-6 py-5">Revenue Generated</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium">
                    <RefreshCw className="animate-spin inline mr-2" size={16} /> Loading referral network...
                  </td>
                </tr>
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium">
                    No referring doctors found matching your criteria.
                  </td>
                </tr>
              ) : (
                doctors.map((doc) => (
                  <tr 
                    key={doc.id} 
                    onClick={() => setSelectedDoctor(doc)}
                    className="hover:bg-gray-50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 group-hover:text-[#0B5E5E] transition-colors">
                        {doc.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 font-mono">{doc.id}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-600">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                        {doc.specialty}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-600">{doc.clinic}</td>
                    <td className="px-6 py-4 font-bold text-blue-700">{doc.patientsReferred}</td>
                    <td className="px-6 py-4 font-bold text-[#0B5E5E]">{formatCurrency(doc.revenueGenerated)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyles(doc.status)}`}>
                        {doc.status === 'Active' && <CheckCircle size={10} className="text-emerald-600" />}
                        {doc.status === 'Pending' && <Clock size={10} className="text-amber-600" />}
                        {doc.status === 'Inactive' && <AlertCircle size={10} className="text-gray-500" />}
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => setSelectedDoctor(doc)}
                          className="text-[#0B5E5E] font-bold hover:text-[#0B5E5E]/80 transition-colors cursor-pointer text-xs"
                        >
                          View Details
                        </button>
                        <button
                          onClick={(e) => handleDeleteDoctor(doc, e)}
                          className="text-gray-300 hover:text-red-600 transition-colors cursor-pointer p-1"
                          title="Remove from network"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">Filter Referring Doctors</h3>
              <button onClick={() => setShowFilters(false)} className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors text-sm font-semibold">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Specialty</label>
                <select 
                  value={specialtyFilter}
                  onChange={(e) => setSpecialtyFilter(e.target.value)}
                  className="cursor-pointer w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium"
                >
                  <option value="All Specialties">All Specialties</option>
                  <option value="General Physician">General Physician</option>
                  <option value="Gynecologist">Gynecologist</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Cardiologist">Cardiologist</option>
                  <option value="Pediatrician">Pediatrician</option>
                  <option value="Neurologist">Neurologist</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Status</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="cursor-pointer w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium"
                >
                  <option value="All Statuses">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 bg-gray-50/50 border-t border-gray-100">
              <button 
                onClick={() => { setSpecialtyFilter("All Specialties"); setStatusFilter("All Statuses"); setShowFilters(false); }} 
                className="cursor-pointer px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
              >
                Reset
              </button>
              <button 
                onClick={() => { setShowFilters(false); showToast('Filters applied!'); }} 
                className="cursor-pointer px-5 py-2 text-xs font-bold text-white bg-[#0B5E5E] rounded-lg hover:bg-[#0B5E5E]/90"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {showAddDoctor && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h3 className="font-bold text-lg text-gray-900">Add Referring Doctor</h3>
                <p className="text-xs text-gray-500 mt-0.5">Onboard external clinic or GP to the referral network</p>
              </div>
              <button onClick={() => setShowAddDoctor(false)} className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors text-sm font-semibold">✕</button>
            </div>
            
            <form onSubmit={handleAddDoctor} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Referring Doctor Name *
                </label>
                <input 
                  type="text" 
                  required 
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Dr. Sunil Deshmukh, MD" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-[#0B5E5E]/20" 
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  External clinic partner or general physician who refers patients to this hospital.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Specialty *</label>
                  <select 
                    value={docSpecialty}
                    onChange={(e) => setDocSpecialty(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium cursor-pointer"
                  >
                    <option value="General Physician">General Physician</option>
                    <option value="Gynecologist">Gynecologist</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Cardiologist">Cardiologist</option>
                    <option value="Pediatrician">Pediatrician</option>
                    <option value="Neurologist">Neurologist</option>
                    <option value="Other">+ Other Specialty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Clinic Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="e.g. Deshmukh PolyClinic" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium" 
                  />
                </div>
              </div>

              {docSpecialty === "Other" && (
                <div className="animate-in fade-in slide-in-from-top-1">
                  <label className="block text-xs font-bold text-[#0B5E5E] uppercase tracking-wider mb-1">Enter Custom Specialty *</label>
                  <input 
                    type="text" 
                    required 
                    value={customSpecialty}
                    onChange={(e) => setCustomSpecialty(e.target.value)}
                    placeholder="e.g. Gastroenterology, Nephrology..." 
                    className="w-full px-3 py-2 border border-[#0B5E5E]/40 rounded-lg text-sm bg-emerald-50/20 font-medium" 
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Phone Number *</label>
                  <input 
                    type="tel" 
                    required 
                    value={docPhone}
                    onChange={(e) => setDocPhone(e.target.value)}
                    placeholder="+91 98000 00000" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    value={docEmail}
                    onChange={(e) => setDocEmail(e.target.value)}
                    placeholder="doctor@clinic.com" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">City</label>
                  <input 
                    type="text" 
                    value={docCity}
                    onChange={(e) => setDocCity(e.target.value)}
                    placeholder="Mumbai" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Incentive (%)</label>
                  <input 
                    type="number" 
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    placeholder="10" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Status</label>
                  <select 
                    value={docStatus}
                    onChange={(e) => setDocStatus(e.target.value as ReferralDoctorStatus)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Notes / Partnership Agreement</label>
                <textarea 
                  rows={2} 
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  placeholder="Referred joint replacement & general surgery cases. Contact Person: Clinic Manager." 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowAddDoctor(false)} 
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0B5E5E] rounded-lg hover:bg-[#0B5E5E]/90 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Adding..." : "Add to Network"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doctor Details Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#0B5E5E]/10 flex items-center justify-center shrink-0">
                  <Stethoscope className="text-[#0B5E5E]" size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xl text-gray-900">{selectedDoctor.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusStyles(selectedDoctor.status)}`}>
                      {selectedDoctor.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 font-mono">{selectedDoctor.id} &middot; {selectedDoctor.specialty} &middot; {selectedDoctor.clinic}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDoctor(null)} className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors text-sm font-semibold">✕</button>
            </div>
            
            <div className="p-6 bg-[#F6F8F8] space-y-4">
              
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone</p>
                    <p className="text-sm font-bold text-gray-900">{selectedDoctor.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email</p>
                    <p className="text-sm font-bold text-gray-900">{selectedDoctor.email || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Honorarium Rate</p>
                  <p className="text-sm font-bold text-emerald-700">{selectedDoctor.commissionRate || 10}% Commission</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                  <Activity size={16} className="text-[#0B5E5E]" /> Lifetime Referral Performance
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-center">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Patients Referred</p>
                    <p className="text-3xl font-extrabold text-blue-700">{selectedDoctor.patientsReferred}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-center">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Revenue Generated</p>
                    <p className="text-3xl font-extrabold text-[#0B5E5E]">{formatCurrency(selectedDoctor.revenueGenerated)}</p>
                  </div>
                </div>
              </div>

              {/* Recent Referred Cases & Commission History */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <FileText size={16} className="text-[#0B5E5E]" /> Referred Patients & Commission Log
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setCaseCommissionRate(selectedDoctor.commissionRate || 10);
                      setShowLogCase(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#0B5E5E] text-white rounded-lg text-xs font-bold hover:bg-[#0B5E5E]/90 cursor-pointer shadow-xs"
                  >
                    <Plus size={13} /> + Log Patient Bill
                  </button>
                </div>

                {selectedDoctor.recentCases && selectedDoctor.recentCases.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-gray-400 font-bold border-b border-gray-50 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2">Patient</th>
                          <th className="py-2">Procedure</th>
                          <th className="py-2">Bill Amount</th>
                          <th className="py-2">Doctor Honorarium</th>
                          <th className="py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectedDoctor.recentCases.map((c: any) => (
                          <tr key={c.id} className="hover:bg-gray-50">
                            <td className="py-2 font-bold text-gray-900">{c.patient_name}</td>
                            <td className="py-2 text-gray-600">{c.procedure_name}</td>
                            <td className="py-2 font-bold text-gray-900">{formatCurrency(Number(c.bill_amount))}</td>
                            <td className="py-2 font-bold text-emerald-700">{formatCurrency(Number(c.referral_fee))}</td>
                            <td className="py-2">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-gray-400">
                    No individual patient bills logged yet for this doctor. Click <span className="font-bold text-[#0B5E5E]">+ Log Patient Bill</span> above to record a case.
                  </div>
                )}
              </div>

              {selectedDoctor.notes && (
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-xs text-gray-600">
                  <span className="font-bold text-gray-800">Partnership Notes: </span>
                  {selectedDoctor.notes}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center p-4 bg-white border-t border-gray-100">
              <button 
                onClick={() => handleDeleteDoctor(selectedDoctor)}
                className="text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded hover:bg-red-50"
              >
                <Trash2 size={14} /> Remove Doctor
              </button>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    showToast(`Sending monthly referral settlement statement to ${selectedDoctor.email || selectedDoctor.name}...`);
                  }}
                  className="cursor-pointer px-4 py-2 text-xs font-bold text-[#0B5E5E] bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200"
                >
                  Send Statement
                </button>
                <button 
                  onClick={() => setSelectedDoctor(null)}
                  className="cursor-pointer px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Patient Bill & Commission Modal */}
      {showLogCase && selectedDoctor && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-emerald-50/30">
              <div>
                <h3 className="font-bold text-base text-gray-900">Log Referred Patient Bill</h3>
                <p className="text-xs text-gray-500 mt-0.5">Referred by: <span className="font-bold text-[#0B5E5E]">{selectedDoctor.name}</span></p>
              </div>
              <button onClick={() => setShowLogCase(false)} className="text-gray-400 hover:text-gray-600 text-sm font-semibold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleLogReferralCase} className="p-6 space-y-4">
              
              {/* Patient Source Toggle */}
              <div className="flex items-center justify-between p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setCasePatientSource("existing");
                    setSelectedBillId("");
                    setCasePatientName("");
                    setCaseBillAmount("");
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    casePatientSource === "existing"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Select Hospital Patient Bill
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCasePatientSource("manual");
                    setSelectedBillId("");
                    setCasePatientName("");
                    setCaseBillAmount("");
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    casePatientSource === "manual"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  + Manual Entry
                </button>
              </div>

              {/* Patient Bill Dropdown (Auto-fills Patient, Procedure, and Amount) */}
              {casePatientSource === "existing" ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Select Patient & Invoice *
                  </label>
                  <select
                    required
                    value={selectedBillId}
                    onChange={(e) => handleSelectExistingBill(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white font-medium cursor-pointer focus:ring-2 focus:ring-[#0B5E5E]/20"
                  >
                    <option value="">-- Choose patient bill to link --</option>
                    {hospitalBills.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.patient} ({b.uhid}) &bull; {b.type} &bull; ₹{b.amount || b.grossAmount} ({b.status})
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Selecting automatically fills patient name, treatment, and total bill amount.
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Patient Name *
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={casePatientName}
                    onChange={(e) => setCasePatientName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium" 
                  />
                </div>
              )}

              {/* Auto-filled / Editable Patient Name Preview if selected from bill */}
              {casePatientSource === "existing" && casePatientName && (
                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Selected Patient:</span>
                  <span className="font-bold text-gray-900">{casePatientName}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Procedure / Treatment *</label>
                <select 
                  value={caseProcedure}
                  onChange={(e) => setCaseProcedure(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium cursor-pointer"
                >
                  <option value="Total Knee Replacement (TKR)">Total Knee Replacement (TKR)</option>
                  <option value="Coronary Angioplasty (PTCA)">Coronary Angioplasty (PTCA)</option>
                  <option value="Normal / C-Section Delivery">Normal / C-Section Delivery</option>
                  <option value="Laparoscopic Cholecystectomy">Laparoscopic Cholecystectomy</option>
                  <option value="Cataract Eye Surgery">Cataract Eye Surgery</option>
                  <option value="OPD Specialist Consultation">OPD Specialist Consultation</option>
                  <option value="Surgery Treatment">Surgery Treatment</option>
                  <option value="IPD Treatment">IPD Treatment</option>
                  <option value="Other">+ Other Procedure</option>
                </select>
              </div>

              {caseProcedure === "Other" && (
                <div className="animate-in fade-in slide-in-from-top-1">
                  <label className="block text-xs font-bold text-[#0B5E5E] uppercase tracking-wider mb-1">Enter Custom Procedure *</label>
                  <input 
                    type="text" 
                    required 
                    value={caseCustomProcedure}
                    onChange={(e) => setCaseCustomProcedure(e.target.value)}
                    placeholder="e.g. Spine Discectomy..." 
                    className="w-full px-3 py-2 border border-[#0B5E5E]/40 rounded-lg text-sm bg-emerald-50/20 font-medium" 
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Total Bill Amount (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    value={caseBillAmount}
                    onChange={(e) => setCaseBillAmount(Number(e.target.value))}
                    placeholder="150000" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium text-gray-900" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Doctor Commission (%)</label>
                  <input 
                    type="number" 
                    value={caseCommissionRate}
                    onChange={(e) => setCaseCommissionRate(Number(e.target.value))}
                    placeholder={`${selectedDoctor.commissionRate || 10}`} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium" 
                  />
                </div>
              </div>

              {/* Live Honorarium Preview */}
              {caseBillAmount !== "" && Number(caseBillAmount) > 0 && (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Referred Bill Amount:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(Number(caseBillAmount))}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#0B5E5E] font-bold text-sm pt-1 border-t border-emerald-200">
                    <span>Doctor Honorarium ({caseCommissionRate !== "" ? caseCommissionRate : (selectedDoctor.commissionRate || 10)}%):</span>
                    <span>{formatCurrency((Number(caseBillAmount) * Number(caseCommissionRate !== "" ? caseCommissionRate : (selectedDoctor.commissionRate || 10))) / 100)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowLogCase(false)} 
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isLoggingCase}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0B5E5E] rounded-lg hover:bg-[#0B5E5E]/90 cursor-pointer disabled:opacity-50"
                >
                  {isLoggingCase ? "Saving..." : "Record & Update Revenue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          </div>
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}

    </div>
  );
}
