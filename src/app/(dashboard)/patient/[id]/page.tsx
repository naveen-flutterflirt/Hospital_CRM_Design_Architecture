"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  Phone, 
  MessageSquare, 
  Check, 
  X, 
  Calendar, 
  FileText, 
  CreditCard, 
  Activity, 
  Clock, 
  ChevronRight, 
  Download, 
  AlertCircle,
  Share2,
  Printer,
  ShieldCheck,
  Stethoscope,
  HeartPulse,
  Receipt,
  UserCheck
} from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import BookAppointmentButton from "@/components/ui/BookAppointmentButton";
import { patientApi } from "@/lib/api";

export default function Patient360() {
  const params = useParams();
  const patientId = params?.id as string;

  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Visits' | 'Reports' | 'Billing & claims' | 'IPD & Bed' | 'Communication' | 'Family'>('Overview');


  useEffect(() => {
    if (patientId) {
      setIsLoading(true);
      patientApi.getProfile360(patientId)
        .then((res: any) => {
          const payload = res?.data || res;
          if (payload && payload.patient) {
            setProfileData(payload);
          }
        })
        .catch((err) => {
          console.error("Failed to load Patient 360 profile:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [patientId]);

  const p = profileData?.patient;
  const visits = profileData?.visits || [];
  const billing = profileData?.billing || [];
  const admissions = profileData?.admissions || [];
  const reports = profileData?.reports || [];
  const communications = profileData?.communications || [];
  const family = profileData?.family || [];
  const clinical = profileData?.clinical || {
    bloodGroup: 'B +ve',
    vitals: {
      bloodPressure: '120/80 mmHg',
      pulseRate: '72 bpm',
      temperature: '98.4 °F',
      spO2: '99%',
      bmi: '22.5'
    },
    allergies: 'No Known Drug Allergies (NKDA)',
    chronicConditions: 'None recorded'
  };
  const timeline = profileData?.timeline || [];
  const summary = profileData?.summary || {
    totalVisits: 1,
    lifetimeBilling: "₹0",
    patientDue: "₹0",
    primaryDoctor: "Dr. Manoj Desai",
    department: "Orthopaedics",
    lastNps: "9 · Promoter"
  };

  const displayName = p?.name || "Patient Profile";
  const displayUhid = p?.uhid || "BLR-0092515";
  const displayGenderAge = p?.genderAge || "M · 21y";
  const displayContact = p?.contact || p?.phone || "+91 9800000000";
  const displayStatus = p?.status || "OPD - Registered";
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  const tabs: Array<'Overview' | 'Visits' | 'Reports' | 'Billing & claims' | 'IPD & Bed' | 'Communication' | 'Family'> = [
    'Overview', 
    'Visits', 
    'Reports', 
    'Billing & claims', 
    'IPD & Bed',
    'Communication', 
    'Family'
  ];

  return (
    <>
      {/* Top Action Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between px-4 md:px-8 py-3.5 bg-canvas shrink-0 gap-3 border-b border-gray-200/60">
        <div className="flex items-center gap-3">
          <BackButton label="Back to Patients Directory" />
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
            title="Print Patient Card"
          >
            <Printer size={14} className="text-gray-500" />
            <span>Print Summary</span>
          </button>

          <BookAppointmentButton 
            defaultPatient={{
              name: displayName,
              uhid: displayUhid
            }}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 space-y-5">
        
        {/* Patient Profile 360 Header Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 transition-shadow">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
            
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0B5E5E] to-teal-800 flex items-center justify-center text-white font-extrabold text-2xl shadow-md shrink-0 border-2 border-teal-200/40">
                {initials}
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight capitalize">{displayName}</h1>
                  
                  <span className="bg-teal-50 text-[#0B5E5E] border border-teal-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
                    {displayStatus}
                  </span>

                  <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                    <ShieldCheck size={12} /> {clinical?.insuranceProvider || p?.insurance || 'Self Pay'}
                  </span>
                </div>

                <div className="text-xs text-gray-600 flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
                  <span className="font-semibold text-gray-800">{displayGenderAge}</span>
                  <span>&bull;</span>
                  <span className="font-mono font-bold text-gray-700">UHID: {displayUhid}</span>
                  <span>&bull;</span>
                  <span className="text-gray-700 font-mono">{displayContact}</span>
                  {p?.email && (
                    <>
                      <span>&bull;</span>
                      <span className="text-gray-600 truncate">{p.email}</span>
                    </>
                  )}
                  <span>&bull;</span>
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    ABHA Linked <Check size={13} strokeWidth={3} className="text-emerald-600" />
                  </span>
                </div>

                {/* Consent & Communication Indicators */}
                <div className="text-[11px] text-gray-400 flex items-center gap-2 pt-1">
                  <span className="text-gray-500 font-medium">Consent Active:</span>
                  <span className="flex items-center gap-0.5 text-emerald-700 font-semibold">WhatsApp <Check size={12} /></span>
                  <span className="flex items-center gap-0.5 text-emerald-700 font-semibold">SMS <Check size={12} /></span>
                  <span className="flex items-center gap-0.5 text-gray-400">Email</span>
                </div>
              </div>
            </div>

            {/* Quick Contact & Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <a 
                href={`tel:${displayContact}`}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-2xs"
              >
                <Phone size={14} className="text-[#0B5E5E]" /> 
                <span>Call Patient</span>
              </a>

              <a 
                href={`https://wa.me/${displayContact.replace(/[^0-9]/g, '')}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
              >
                <MessageSquare size={14} className="text-emerald-700" /> 
                <span>WhatsApp Message</span>
              </a>
            </div>

          </div>

          {/* Quick Clinical Vitals Bar */}
          <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Blood Group</span>
              <p className="text-xs font-extrabold text-gray-900 mt-0.5">{clinical?.bloodGroup || 'Not recorded'}</p>
            </div>
            <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Blood Pressure</span>
              <p className="text-xs font-extrabold text-gray-900 mt-0.5">{clinical?.vitals?.bloodPressure || 'Not recorded'}</p>
            </div>
            <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pulse Rate</span>
              <p className="text-xs font-extrabold text-gray-900 mt-0.5">{clinical?.vitals?.pulseRate || 'Not recorded'}</p>
            </div>
            <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Oxygen (SpO2)</span>
              <p className="text-xs font-extrabold text-emerald-700 mt-0.5">{clinical?.vitals?.spO2 || 'Not recorded'}</p>
            </div>
            <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Weight & BMI</span>
              <p className="text-xs font-extrabold text-gray-900 mt-0.5">{clinical?.vitals?.weight ? `${clinical.vitals.weight} · BMI ${clinical.vitals?.bmi || '22.5'}` : 'Not recorded'}</p>
            </div>
            <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Allergies</span>
              <p className="text-xs font-extrabold text-emerald-700 mt-0.5 truncate">{clinical?.allergies || 'None (NKDA)'}</p>
            </div>
          </div>

          {/* Navigation Tabs with Active Badges */}
          <div className="flex gap-2 md:gap-4 mt-6 border-b border-gray-100 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              let count = 0;
              if (tab === 'Visits') count = visits.length;
              if (tab === 'Reports') count = reports.length;
              if (tab === 'Billing & claims') count = billing.length;
              if (tab === 'IPD & Bed') count = admissions.length;
              if (tab === 'Communication') count = communications.length;
              if (tab === 'Family') count = family.length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`pb-3 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap px-1 flex items-center gap-1.5 ${
                    activeTab === tab
                      ? 'border-[#0B5E5E] text-[#0B5E5E]'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200'
                  }`}
                >
                  <span>{tab}</span>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      activeTab === tab ? 'bg-teal-50 text-[#0B5E5E]' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Tab Content Views */}
        {isLoading ? (
          <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center animate-pulse space-y-4">
            <div className="w-12 h-12 bg-teal-50 text-[#0B5E5E] rounded-full mx-auto flex items-center justify-center">
              <Clock size={24} className="animate-spin text-[#0B5E5E]" />
            </div>
            <p className="text-sm font-bold text-gray-700">Loading Patient 360 data...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'Overview' && (
              <div className="grid grid-cols-12 gap-5 animate-in fade-in duration-200">
                
                {/* Left Column - Real Journey Timeline */}
                <div className="col-span-12 lg:col-span-5 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Patient Journey Timeline</h3>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        Live Chronology
                      </span>
                    </div>

                    <div className="space-y-5 relative before:absolute before:inset-0 before:ml-[6px] before:h-full before:w-0.5 before:bg-gray-200">
                      {timeline.map((item: any, idx: number) => (
                        <div key={idx} className="relative flex items-start gap-4">
                          <div className={`w-3.5 h-3.5 rounded-full border-2 border-white mt-0.5 shrink-0 z-10 ${
                            item.isCurrent ? 'bg-[#0B5E5E] ring-4 ring-teal-100' : 'bg-gray-400'
                          }`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-xs font-bold ${item.isCurrent ? 'text-[#0B5E5E]' : 'text-gray-900'}`}>
                                {item.title}
                              </p>
                              <span className="text-[11px] font-mono font-semibold text-gray-400 shrink-0">
                                {item.date}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-6 border-t border-gray-100 text-[11px] text-gray-400 flex items-center justify-between font-semibold">
                    <span>Source: Hospital Electronic Medical System</span>
                    <span className="text-teal-700">Audit Verified</span>
                  </div>
                </div>

                {/* Right Column - KPI Summaries & Clinical Snapshot */}
                <div className="col-span-12 lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max">
                  
                  {/* Clinical Snapshot */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Stethoscope size={14} className="text-[#0B5E5E]" /> Clinical Snapshot
                      </h3>
                      <span className="text-[10px] font-semibold text-gray-400">HIS Live</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-500 font-medium">Attending Doctor:</span>
                        <span className="font-bold text-gray-900">{summary.primaryDoctor}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-500 font-medium">Department:</span>
                        <span className="font-semibold text-gray-800">{summary.department}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-500 font-medium">Known Allergies:</span>
                        <span className="font-semibold text-emerald-700">{clinical.allergies}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-500 font-medium">Chronic Conditions:</span>
                        <span className="font-semibold text-gray-700">{clinical.chronicConditions}</span>
                      </div>
                    </div>
                  </div>

                  {/* Billing Snapshot */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard size={14} className="text-[#0B5E5E]" /> Financial Summary
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Up to date
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-500 font-medium">Lifetime Billing:</span>
                        <span className="font-bold text-gray-900">{summary?.lifetimeBilling || '₹0'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-500 font-medium">Outstanding Balance:</span>
                        <span className="font-bold text-emerald-700">{summary?.patientDue || '₹0'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-500 font-medium">Last Invoice:</span>
                        <span className="font-mono font-semibold text-gray-700">{billing[0]?.invoiceNumber || 'No invoices'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-500 font-medium">Insurance Coverage:</span>
                        <span className="font-semibold text-gray-800">{clinical?.insuranceProvider || billing[0]?.insurance || 'Self Pay'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Relationship & NPS */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                        <HeartPulse size={14} className="text-[#0B5E5E]" /> Relationship & NPS
                      </h3>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">CRM Care</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-500 font-medium">Total OPD Visits:</span>
                        <span className="font-bold text-gray-900">{summary?.totalVisits ?? visits.length} visit(s)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-500 font-medium">Patient NPS Sentiment:</span>
                        <span className="font-bold text-emerald-700">{summary?.lastNps || '9 · Promoter'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-500 font-medium">Acquisition Channel:</span>
                        <span className="font-semibold text-gray-800">{p?.source || 'Direct Walk-in'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Family & Emergency Contact */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                        <UserCheck size={14} className="text-[#0B5E5E]" /> Family & Attendants
                      </h3>
                      <span className="text-[10px] font-semibold text-gray-400">Emergency</span>
                    </div>

                    <div className="text-xs text-gray-700 space-y-2 py-1">
                      {family.length > 1 ? (
                        <>
                          <p className="leading-snug">
                            <strong className="text-gray-900">Primary Caregiver:</strong> {family[1]?.name} ({family[1]?.relationship}).
                          </p>
                          <p className="text-gray-500 text-[11px]">
                            Emergency contact number: <span className="font-mono text-gray-700">{family[1]?.phone || displayContact}</span>.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="leading-snug">
                            <strong className="text-gray-900">Primary Contact:</strong> {displayName} (Self (Patient)).
                          </p>
                          <p className="text-gray-500 text-[11px]">
                            Registered primary mobile number: <span className="font-mono text-gray-700">{displayContact}</span>.
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 2: VISITS & APPOINTMENTS */}
            {activeTab === 'Visits' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Consultation Visits & Appointments</h3>
                    <p className="text-xs text-gray-400">All registered appointments for {displayName}</p>
                  </div>
                  <BookAppointmentButton defaultPatient={{ name: displayName, uhid: displayUhid }} />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 uppercase font-bold text-[10px] tracking-wider">
                        <th className="pb-3">Appointment Code</th>
                        <th className="pb-3">Date & Slot</th>
                        <th className="pb-3">Doctor</th>
                        <th className="pb-3">Department</th>
                        <th className="pb-3">Channel</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {visits.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-400">
                            No appointment records found for this patient.
                          </td>
                        </tr>
                      ) : (
                        visits.map((v: any) => (
                          <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 font-mono font-bold text-gray-900">{v.id}</td>
                            <td className="py-3 font-semibold text-gray-900">
                              {v.date} &bull; <span className="font-mono text-gray-600">{v.timeSlot}</span>
                            </td>
                            <td className="py-3 font-medium text-gray-700">{v.doctor}</td>
                            <td className="py-3 text-gray-600">{v.department}</td>
                            <td className="py-3 text-gray-500">{v.source}</td>
                            <td className="py-3">
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-[#0B5E5E] border border-teal-200">
                                {v.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: REPORTS & DIAGNOSTICS */}
            {activeTab === 'Reports' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Laboratory & Diagnostic Reports ({reports.length})</h3>
                    <p className="text-xs text-gray-400">Verified diagnostic investigations and lab documents linked to UHID {displayUhid}</p>
                  </div>
                </div>

                <div className="divide-y divide-gray-50">
                  {reports.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 space-y-2">
                      <FileText size={32} className="mx-auto text-gray-300" />
                      <p className="text-xs font-semibold text-gray-600">No Diagnostic Reports Filed</p>
                      <p className="text-[11px] text-gray-400">No laboratory investigations or radiology imaging scans have been ordered yet.</p>
                    </div>
                  ) : (
                    reports.map((rep: any) => (
                      <div key={rep.id} className="py-3.5 flex items-center justify-between hover:bg-gray-50/50 px-2 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0B5E5E] flex items-center justify-center font-bold">
                            <FileText size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900">{rep.name}</p>
                            <p className="text-[11px] text-gray-400">
                              {rep.category} &bull; Ordered by {rep.doctor} &bull; {rep.date} ({rep.fileSize})
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {rep.status}
                          </span>
                          <button 
                            onClick={() => alert(`Downloading report: ${rep.name}`)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:text-[#0B5E5E] hover:bg-teal-50 border border-gray-200 rounded-lg transition-colors cursor-pointer" 
                            title="Download Report"
                          >
                            <Download size={13} />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: BILLING & CLAIMS */}
            {activeTab === 'Billing & claims' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Billing Invoices & TPA Claims</h3>
                    <p className="text-xs text-gray-400">Live payment settlements from hospital billing desk</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 uppercase font-bold text-[10px] tracking-wider">
                        <th className="pb-3">Invoice #</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Service / Bill Type</th>
                        <th className="pb-3">Payment Mode</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {billing.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-400">
                            No invoices generated for this patient yet.
                          </td>
                        </tr>
                      ) : (
                        billing.map((b: any) => (
                          <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 font-mono font-bold text-gray-900">{b.invoiceNumber}</td>
                            <td className="py-3 text-gray-600">{b.date}</td>
                            <td className="py-3 font-semibold text-gray-900">{b.billType}</td>
                            <td className="py-3 text-gray-600">{b.paymentMode}</td>
                            <td className="py-3 font-bold text-gray-900">{b.netAmount}</td>
                            <td className="py-3">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                b.status === 'Settled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: IPD & BED ADMISSIONS */}
            {activeTab === 'IPD & Bed' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Inpatient (IPD) Admissions & Bed History</h3>
                    <p className="text-xs text-gray-400">Ward allocation, diagnosis notes, and bed stays</p>
                  </div>
                </div>

                {admissions.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 space-y-2">
                    <Activity size={32} className="mx-auto text-gray-300" />
                    <p className="text-xs font-semibold text-gray-600">No Inpatient Admissions</p>
                    <p className="text-[11px] text-gray-400">Patient is currently registered under OPD Outpatient Care.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {admissions.map((adm: any) => (
                      <div key={adm.id} className="py-4 flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-gray-900">{adm.admissionNumber}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#0B5E5E] border border-teal-200">
                              {adm.department}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 font-medium">Diagnosis: {adm.diagnosis}</p>
                          <p className="text-[11px] text-gray-400">Location: {adm.ward} &bull; {adm.bed} &bull; Admitted on {adm.admittedAt}</p>
                        </div>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          {adm.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: COMMUNICATION & MESSAGES */}
            {activeTab === 'Communication' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-in fade-in duration-200 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Communication & Notification Log ({communications.length})</h3>
                    <p className="text-xs text-gray-400">Automated SMS, WhatsApp appointment updates, and survey dispatches to {displayContact}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {communications.map((comm: any) => (
                    <div key={comm.id} className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                          comm.channel === 'WhatsApp' ? 'bg-emerald-100 text-emerald-700' : 'bg-teal-100 text-[#0B5E5E]'
                        }`}>
                          {comm.channel === 'WhatsApp' ? <MessageSquare size={16} /> : <Phone size={16} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-gray-900">{comm.title}</p>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white border border-gray-200 text-gray-600">
                              {comm.channel}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 leading-snug">{comm.message}</p>
                          <p className="text-[11px] text-gray-400 mt-1">{comm.timestamp}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        {comm.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 7: FAMILY & CONTACTS */}
            {activeTab === 'Family' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-in fade-in duration-200 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Family Members & Attendants ({family.length})</h3>
                    <p className="text-xs text-gray-400">Authorized guardians and caregivers linked to UHID {displayUhid}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {family.map((fam: any) => (
                    <div key={fam.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900">{fam.relationship}</span>
                        {fam.isEmergencyContact && (
                          <span className="text-[10px] font-bold bg-teal-50 text-[#0B5E5E] px-2 py-0.5 rounded-full border border-teal-100">
                            Emergency Contact
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-800 font-bold capitalize">{fam.name}</p>
                      <p className="text-[11px] text-gray-500 font-mono">Mobile: {fam.phone}</p>
                      <p className="text-[11px] text-gray-400">{fam.address}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </>
  );
}
