"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, ChevronDown, Filter, Download, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import NewRegistrationButton from "@/components/ui/NewRegistrationButton";
import ActionMenu from "@/components/ui/ActionMenu";
import { patientApi, Patient } from "@/lib/api";

const ITEMS_PER_PAGE = 7;

export default function PatientsList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await patientApi.getAll({
        search: searchQuery,
        status: statusFilter === "All" ? undefined : statusFilter,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });

      if (res.success && res.data) {
        setPatients(res.data.patients);
        setTotalPages(res.data.pagination.totalPages);
        setTotalCount(res.data.pagination.total);
      } else {
        setError(res.message || "Failed to load patient records");
      }
    } catch (err: any) {
      setError(err.message || "Unable to reach server");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, currentPage]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleDeletePatient = async (id: string) => {
    try {
      await patientApi.delete(id);
      showToast("Patient record removed successfully.");
      fetchPatients();
    } catch (err: any) {
      alert(err.message || "Failed to delete patient");
    }
  };

  const handlePatientRegistered = (newPatient: Patient) => {
    showToast(`Patient ${newPatient.name} registered successfully with UHID: ${newPatient.uhid}!`);
    setCurrentPage(1);
    fetchPatients();
  };

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#0B5E5E] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-sm animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 size={18} className="text-[#9CCFC8]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-8 py-4 md:py-6 bg-canvas shrink-0 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Patient Registry</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and view all registered patients</p>
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
              placeholder="Search by name, UHID, phone..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-full text-sm w-full md:w-72 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <div className="relative flex items-center">
            <div className="absolute left-3 pointer-events-none">
              <Filter size={14} className="text-gray-500" />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-8 pr-8 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer appearance-none outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="All">All Statuses</option>
              <option value="Admitted">Admitted</option>
              <option value="Completed">Completed</option>
              <option value="Follow-up">Follow-up</option>
              <option value="No Show">No Show</option>
              <option value="Discharged">Discharged</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 pointer-events-none text-gray-500" />
          </div>

          <NewRegistrationButton onPatientRegistered={handlePatientRegistered} />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-4 md:pb-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
          
          {/* Table Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-6 py-4 border-b border-gray-100 gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-700">Live Database Records</span>
              <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded text-xs font-semibold">
                Total: {totalCount} Patients
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  const csv = [
                    ['UHID', 'Name', 'Gender/Age', 'Contact', 'Status', 'Last Visit'].join(','),
                    ...patients.map(p => [p.uhid, `"${p.name}"`, `"${p.genderAge}"`, p.contact, `"${p.status}"`, `"${p.lastVisit}"`].join(','))
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `patients_export_${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                }}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <Download size={16} /> Export CSV
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto scrollbar-hide flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-gray-500">
                  <th className="px-6 py-3 font-medium">Patient Name</th>
                  <th className="px-6 py-3 font-medium">UHID / ABHA</th>
                  <th className="px-6 py-3 font-medium">Gender/Age</th>
                  <th className="px-6 py-3 font-medium">Contact</th>
                  <th className="px-6 py-3 font-medium">Last Visit</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                          <div className="h-4 bg-gray-200 rounded w-28" />
                        </div>
                      </td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24 mb-1" /><div className="h-3 bg-gray-100 rounded w-16" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-28" /></td>
                      <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-24" /></td>
                      <td className="px-6 py-4 text-right"><div className="h-6 bg-gray-100 rounded w-6 ml-auto" /></td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-red-500 font-medium">
                      {error}
                      <button onClick={fetchPatients} className="ml-3 underline font-semibold text-primary">Retry</button>
                    </td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No patients found matching your search.
                    </td>
                  </tr>
                ) : (
                  patients.map((p) => (
                    <PatientRow 
                      key={p.uhid || p.id}
                      patient={p}
                      onDelete={() => handleDeletePatient(p.uuid || p.id)}
                      onUpdated={fetchPatients}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-4 border-t border-gray-100 bg-gray-50 gap-4 text-center">
            <span className="text-sm text-gray-500">
              Showing Page {currentPage} of {totalPages} &middot; Total {totalCount} records
            </span>
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
                className="px-3 py-1 border border-gray-200 bg-white rounded text-sm font-medium text-gray-500 disabled:opacity-50 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                Prev
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === currentPage;
                return (
                  <button 
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 border rounded text-sm font-medium cursor-pointer transition-colors ${
                      isActive 
                        ? 'border-primary bg-primary text-white' 
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0 || isLoading}
                className="px-3 py-1 border border-gray-200 bg-white rounded text-sm font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

function PatientRow({ 
  patient, 
  onDelete,
  onUpdated 
}: { 
  patient: Patient; 
  onDelete: () => void;
  onUpdated: () => void;
}) {
  const { id, name, uhid, abha, genderAge, contact, lastVisit, status, statusType } = patient;
  
  const statusStyles: Record<string, string> = {
    primary: 'bg-primary/10 text-primary font-semibold',
    success: 'bg-success/10 text-success font-semibold',
    warning: 'bg-warning/10 text-warning font-semibold',
    alert: 'bg-alert/10 text-alert font-semibold',
    neutral: 'bg-gray-100 text-gray-700 font-semibold'
  };

  const abhaColor = abha === 'Linked' ? 'text-success font-semibold' : 'text-gray-400';

  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      <td className="px-6 py-4">
        <Link href={`/patient/${encodeURIComponent(uhid || id)}`} className="font-semibold text-gray-900 hover:text-primary transition-colors flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-soft/30 flex items-center justify-center text-primary font-bold text-xs shrink-0">
            {name ? name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'PT'}
          </div>
          {name}
        </Link>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-gray-900 font-medium">{uhid}</span>
          <span className={`text-xs flex items-center gap-1 ${abhaColor}`}>
            ABHA: {abha}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-gray-700">{genderAge || "—"}</td>
      <td className="px-6 py-4 text-gray-700">{contact || "—"}</td>
      <td className="px-6 py-4 text-gray-700">{lastVisit || "Today"}</td>
      <td className="px-6 py-4">
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs ${statusStyles[statusType] || statusStyles.neutral}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <ActionMenu 
          patient={patient} 
          onDelete={onDelete} 
          onUpdated={onUpdated}
        />
      </td>
    </tr>
  );
}
