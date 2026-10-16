"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  Plus, 
  List, 
  LayoutGrid, 
  Download, 
  X, 
  Loader2, 
  Phone, 
  Mail, 
  AlertCircle, 
  CheckCircle,
  MoreVertical,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles,
  DollarSign,
  UserCheck,
  Building2,
  Trash2,
  MessageSquare,
  HelpCircle,
  Activity
} from "lucide-react";
import { Lead, KanbanBoardData, leadApi } from "@/lib/api";

const STAGES: Array<{ key: keyof KanbanBoardData; label: string; dotColor: string; bgBadge: string; description: string }> = [
  { key: "new", label: "New Inquiries", dotColor: "bg-blue-500", bgBadge: "bg-blue-50 text-blue-700 border-blue-200", description: "Fresh incoming patient queries awaiting review" },
  { key: "contacted", label: "Contacted", dotColor: "bg-amber-500", bgBadge: "bg-amber-50 text-amber-700 border-amber-200", description: "Phone, WhatsApp, or email callback initiated" },
  { key: "quote", label: "Quote / Roster", dotColor: "bg-teal-600", bgBadge: "bg-teal-50 text-teal-700 border-teal-200", description: "OPD estimate or slot package shared" },
  { key: "visited", label: "OPD Visited", dotColor: "bg-indigo-600", bgBadge: "bg-indigo-50 text-indigo-700 border-indigo-200", description: "Consultation done, diagnostic decisions pending" },
  { key: "wonLost", label: "Won / Lost", dotColor: "bg-emerald-600", bgBadge: "bg-emerald-50 text-emerald-700 border-emerald-200", description: "Admission finalized or closed records" },
];

export default function LeadsPage() {
  const [boardData, setBoardData] = useState<KanbanBoardData>({
    new: [],
    contacted: [],
    quote: [],
    visited: [],
    wonLost: [],
  });
  const [allLeadsList, setAllLeadsList] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");

  // Selected Lead for Detail Drawer / Quick Action
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Drag and Drop State
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Fields
  const [leadName, setLeadName] = useState("");
  const [treatment, setTreatment] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("Website");
  const [priority, setPriority] = useState("Normal");
  const [stage, setStage] = useState<string>("new");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [notes, setNotes] = useState("");

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await leadApi.getBoard({
        search: searchQuery,
        source: selectedSource !== "All" ? selectedSource : undefined,
      });

      if (res.success && res.data) {
        setBoardData(res.data);
        const flattened = [
          ...(res.data.new || []),
          ...(res.data.contacted || []),
          ...(res.data.quote || []),
          ...(res.data.visited || []),
          ...(res.data.wonLost || []),
        ];
        
        let filtered = flattened;
        if (selectedPriority !== "All") {
          filtered = filtered.filter(l => l.priority === selectedPriority);
        }
        setAllLeadsList(filtered);
      } else {
        setError(res.message || "Failed to load leads");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend server");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedSource, selectedPriority]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Stage advance / move
  const handleMoveStage = async (lead: Lead, nextStage: string) => {
    try {
      const res = await leadApi.updateStage(lead.uuid || lead.id, nextStage);
      if (res.success) {
        showToast(`Moved ${lead.name} to "${nextStage}" stage.`);
        fetchLeads();
        if (selectedLead?.id === lead.id) {
          setSelectedLead({ ...lead, stage: nextStage as any });
        }
      }
    } catch (err: any) {
      alert(err.message || "Failed to update lead stage");
    }
  };

  const handleDeleteLead = async (lead: Lead) => {
    if (!confirm(`Are you sure you want to delete lead ${lead.name}?`)) return;
    try {
      const res = await leadApi.delete(lead.uuid || lead.id);
      if (res.success) {
        showToast(`Lead ${lead.name} deleted.`);
        setSelectedLead(null);
        fetchLeads();
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete lead");
    }
  };

  const [isConverting, setIsConverting] = useState(false);

  const handleConvertToPatient = async (lead: Lead) => {
    if (lead.patientUhid) {
      alert(`This lead is already registered as patient with UHID: ${lead.patientUhid}`);
      return;
    }

    if (!confirm(`Convert ${lead.name} into an official registered hospital patient? A unique UHID will be generated.`)) {
      return;
    }

    setIsConverting(true);
    try {
      const res = await leadApi.convertToPatient(lead.uuid || lead.id);
      if (res.success && res.data) {
        showToast(`Successfully converted ${lead.name} to patient! UHID: ${res.data.patient.uhid}`);
        setSelectedLead(res.data.lead);
        fetchLeads();
      } else {
        alert(res.message || "Failed to convert lead to patient");
      }
    } catch (err: any) {
      alert(err.message || "Error converting lead to patient");
    } finally {
      setIsConverting(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!leadName.trim()) {
      setModalError("Please enter patient/lead name");
      return;
    }
    if (!treatment.trim()) {
      setModalError("Please specify treatment or clinical enquiry");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await leadApi.create({
        name: leadName.trim(),
        treatment: treatment.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        source,
        priority,
        stage,
        estimatedValue: estimatedValue ? Number(estimatedValue) : 0,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        setShowAddModal(false);
        showToast(`New enquiry for ${leadName} registered successfully!`);
        // Reset form
        setLeadName("");
        setTreatment("");
        setPhone("");
        setEmail("");
        setSource("Website");
        setPriority("Normal");
        setStage("new");
        setEstimatedValue("");
        setNotes("");
        fetchLeads();
      } else {
        setModalError(res.message || "Failed to create lead");
      }
    } catch (err: any) {
      setModalError(err.message || "Failed to create lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics computation for Executive KPI banner
  const totalLeads = allLeadsList.length;
  const highPriorityCount = allLeadsList.filter(l => l.priority === 'High').length;
  const totalPipelineVal = allLeadsList.reduce((acc, l) => acc + (Number(l.estimatedValue) || 0), 0);
  const wonCount = (boardData.wonLost || []).filter(l => (l.tag || '').toLowerCase().includes('won') || l.stage === 'wonLost').length;

  const getTagStyle = (type?: string, tag?: string) => {
    if (tag === 'Won') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (tag === 'Lost') return 'bg-rose-50 text-rose-700 border-rose-200';
    switch (type) {
      case 'warning': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'success': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'alert': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'primary': return 'bg-teal-50 text-teal-700 border-teal-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const stagesOrder = ['new', 'contacted', 'quote', 'visited', 'wonLost'];

  return (
    <div className="h-full flex flex-col bg-canvas animate-in fade-in duration-300 relative overflow-hidden">
      
      {/* Top Header */}
      <header className="flex flex-col 2xl:flex-row 2xl:items-center justify-between px-4 md:px-8 py-4 md:py-6 bg-canvas shrink-0 gap-4">
        <div className="shrink-0">
          <h1 className="text-xl font-bold text-gray-900">Leads & Patient Inquiries</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Hospital admission pipeline, OPD consultations, packages & follow-ups
          </p>
        </div>

        {/* Unified Single-Row Controls Toolbar */}
        <div className="flex items-center flex-wrap gap-2 md:gap-2.5">
          {/* Search Input */}
          <div className="relative w-48 sm:w-56 md:w-60">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <Search size={15} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient, surgery..."
              className="pl-8.5 pr-3 py-1.5 border border-gray-200 rounded-full text-xs md:text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 shadow-xs"
            />
          </div>

          {/* Source Filter */}
          <div className="relative flex items-center">
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="pl-3 pr-7 py-1.5 bg-white border border-gray-200 rounded-full text-xs md:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer appearance-none outline-none focus:ring-2 focus:ring-primary/20 shadow-xs"
            >
              <option value="All">All Sources</option>
              <option value="Website">Website</option>
              <option value="Facebook">Social Media</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Walk-in">Walk-in</option>
              <option value="Health camp">Health Camp</option>
              <option value="Corporate">Corporate</option>
            </select>
            <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-gray-400">
              <span className="text-[9px]">&#9662;</span>
            </div>
          </div>

          {/* Priority Filter */}
          <div className="relative flex items-center">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="pl-3 pr-7 py-1.5 bg-white border border-gray-200 rounded-full text-xs md:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer appearance-none outline-none focus:ring-2 focus:ring-primary/20 shadow-xs"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
            </select>
            <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-gray-400">
              <span className="text-[9px]">&#9662;</span>
            </div>
          </div>

          {/* View Mode Toggle */}
          <button 
            onClick={() => setViewMode(viewMode === 'kanban' ? 'list' : 'kanban')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs md:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
          >
            {viewMode === 'kanban' ? (
              <>
                <List size={14} className="text-primary" />
                <span>List view</span>
              </>
            ) : (
              <>
                <LayoutGrid size={14} className="text-primary" />
                <span>Kanban board</span>
              </>
            )}
          </button>

          {/* Export CSV */}
          <button 
            onClick={() => {
              const headers = ["Lead Code", "Name", "Treatment", "Source", "Stage", "Priority", "Estimated Value", "Phone"];
              const rows = allLeadsList.map(l => [
                l.leadCode || l.id,
                `"${l.name}"`,
                `"${l.treatment}"`,
                l.source || "",
                l.stage,
                l.priority || "Normal",
                l.estimatedValue || 0,
                l.phone || ""
              ]);
              const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `leads_pipeline_${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs md:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Download size={14} />
            <span>Export</span>
          </button>

          {/* Add Lead Primary Button */}
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-white rounded-full text-xs md:text-sm font-medium hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 cursor-pointer whitespace-nowrap"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>New Lead</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-4 md:pb-8 space-y-5">
        
        {/* KPI Intelligence Summary Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white p-4 md:p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3.5 hover:border-gray-300 transition-colors">
            <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Inquiries</p>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-0.5">{totalLeads}</h3>
            </div>
          </div>

          <div className="bg-white p-4 md:p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3.5 hover:border-gray-300 transition-colors">
            <div className="w-11 h-11 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">High Priority</p>
              <h3 className="text-xl md:text-2xl font-bold text-amber-600 mt-0.5">{highPriorityCount}</h3>
            </div>
          </div>

          <div className="bg-white p-4 md:p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3.5 hover:border-gray-300 transition-colors">
            <div className="w-11 h-11 rounded-lg bg-teal-600/10 text-teal-600 flex items-center justify-center shrink-0">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Pipeline Value</p>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mt-0.5">
                ₹{totalPipelineVal > 0 ? (totalPipelineVal / 1000).toFixed(0) + 'k' : '0'}
              </h3>
            </div>
          </div>

          <div className="bg-white p-4 md:p-5 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3.5 hover:border-gray-300 transition-colors">
            <div className="w-11 h-11 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Conversions / Won</p>
              <h3 className="text-xl md:text-2xl font-bold text-emerald-600 mt-0.5">{wonCount}</h3>
            </div>
          </div>
        </div>

        {/* Pipeline Stage Quick Progress Indicator */}
        <div className="bg-white px-5 py-3 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-gray-600 font-medium">
            <Activity size={15} className="text-primary" />
            <span>Workflow Stages:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 md:gap-3 text-gray-600 font-medium">
            {STAGES.map((s, idx) => (
              <React.Fragment key={s.key}>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${s.dotColor}`} />
                  <span className="text-gray-700 font-semibold">{s.label}</span>
                  <span className="text-gray-400">({(boardData[s.key] || []).length})</span>
                </div>
                {idx < STAGES.length - 1 && <span className="text-gray-300">&rarr;</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Pipeline / Table View */}
        {isLoading ? (
          <div className="h-64 bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 size={26} className="animate-spin text-primary" />
            <span className="text-sm font-medium">Syncing live inquiries from database...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-white rounded-xl border border-gray-200 text-red-500">
            <AlertCircle size={32} className="mx-auto mb-2 text-red-400" />
            <p className="font-semibold">{error}</p>
            <button onClick={fetchLeads} className="mt-3 underline text-sm text-primary font-medium">Retry loading</button>
          </div>
        ) : viewMode === 'kanban' ? (
          /* Kanban Board Columns */
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max items-start">
              {STAGES.map((col) => {
                const leads = boardData[col.key] || [];
                const isOver = dragOverStage === col.key;

                return (
                  <div 
                    key={col.key} 
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverStage !== col.key) {
                        setDragOverStage(col.key);
                      }
                    }}
                    onDragLeave={(e) => {
                      // Only clear if leaving the column boundary
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDragOverStage(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverStage(null);
                      if (draggedLead && draggedLead.stage !== col.key) {
                        handleMoveStage(draggedLead, col.key);
                        setDraggedLead(null);
                      }
                    }}
                    className={`w-76 rounded-xl p-3.5 flex flex-col border shadow-2xs min-h-[520px] transition-all duration-200 ${
                      isOver 
                        ? 'bg-primary/5 border-primary ring-2 ring-primary/20 scale-[1.01]' 
                        : 'bg-[#F8FAF9] border-gray-200'
                    }`}
                  >
                    {/* Column Header */}
                    <div className="pb-3 px-1 flex items-center justify-between border-b border-gray-200/80 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm tracking-tight">{col.label}</h3>
                          <p className="text-[10px] text-gray-400 leading-tight hidden xl:block">{col.description}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 bg-white text-gray-700 rounded-full border border-gray-200 shadow-xs">
                        {leads.length}
                      </span>
                    </div>

                    {/* Cards Container */}
                    <div className="flex-1 space-y-3">
                      {leads.length === 0 ? (
                        <div className={`py-12 px-4 text-center text-xs rounded-xl border border-dashed transition-colors ${
                          isOver ? 'border-primary text-primary bg-primary/10' : 'border-gray-200 text-gray-400 bg-white/50'
                        }`}>
                          {isOver ? "Drop inquiry here" : "No inquiries in this stage"}
                        </div>
                      ) : (
                        leads.map((lead) => {
                          const isBeingDragged = draggedLead?.id === lead.id;

                          return (
                            <div 
                              key={lead.id}
                              draggable
                              onDragStart={(e) => {
                                setDraggedLead(lead);
                                e.dataTransfer.setData("text/plain", lead.id);
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              onDragEnd={() => {
                                setDraggedLead(null);
                                setDragOverStage(null);
                              }}
                              onClick={() => setSelectedLead(lead)}
                              className={`bg-white rounded-xl p-4 shadow-xs hover:shadow-md transition-all group border cursor-grab active:cursor-grabbing relative select-none ${
                                isBeingDragged 
                                  ? 'opacity-40 border-dashed border-primary scale-95 shadow-none' 
                                  : 'border-gray-200/90 hover:border-primary/50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors text-sm flex items-center gap-1.5">
                                  <span>{lead.name}</span>
                                </h4>
                                {lead.priority === 'High' ? (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                                    High
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-gray-400 font-medium shrink-0">
                                    {lead.meta || "Normal"}
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-gray-600 mt-1 mb-2.5 font-medium line-clamp-2">
                                {lead.treatment}
                              </p>

                              {/* Phone / Contact */}
                              {lead.phone && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                                  <Phone size={12} className="text-gray-400" />
                                  <span>{lead.phone}</span>
                                </div>
                              )}

                              {/* Estimated Amount */}
                              {lead.estimatedValue ? (
                                <div className="text-xs font-bold text-teal-800 bg-teal-50/80 px-2 py-0.5 rounded inline-block mb-2.5 border border-teal-100">
                                  Est: ₹{lead.estimatedValue.toLocaleString('en-IN')}
                                </div>
                              ) : null}

                              {/* Bottom Details & Stage Controller */}
                              <div className="flex items-center justify-between gap-1 text-[11px] pt-2 border-t border-gray-100">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {lead.source && (
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">
                                      {lead.source}
                                    </span>
                                  )}
                                  {lead.tag && (
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getTagStyle(lead.tagType, lead.tag)}`}>
                                      {lead.tag}
                                    </span>
                                  )}
                                </div>

                                {/* Status Dropdown Selector */}
                                <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                                  <select
                                    value={lead.stage}
                                    onChange={(e) => handleMoveStage(lead, e.target.value)}
                                    className="text-[11px] font-semibold px-2 py-0.5 bg-white border border-gray-200 rounded-full text-gray-700 hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 cursor-pointer shadow-xs pr-5 appearance-none"
                                  >
                                    <option value="new">New</option>
                                    <option value="contacted">Contacted</option>
                                    <option value="quote">Quote</option>
                                    <option value="visited">Visited</option>
                                    <option value="wonLost">Won/Lost</option>
                                  </select>
                                  <div className="absolute inset-y-0 right-1.5 flex items-center pointer-events-none text-gray-400">
                                    <span className="text-[8px]">&#9662;</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden animate-in fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 text-xs">
                  <tr>
                    <th className="px-6 py-3.5">Lead / Patient</th>
                    <th className="px-6 py-3.5">Treatment / Clinical Subject</th>
                    <th className="px-6 py-3.5">Acquisition Source</th>
                    <th className="px-6 py-3.5">Workflow Stage</th>
                    <th className="px-6 py-3.5">Priority</th>
                    <th className="px-6 py-3.5">Est. Value</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allLeadsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                        No inquiries found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    allLeadsList.map((lead) => {
                      const currentStageIdx = stagesOrder.indexOf(lead.stage);
                      const nextStage = currentStageIdx !== -1 && currentStageIdx < stagesOrder.length - 1 ? stagesOrder[currentStageIdx + 1] : null;

                      return (
                        <tr 
                          key={lead.id} 
                          onClick={() => setSelectedLead(lead)}
                          className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{lead.name}</div>
                            {lead.phone && <div className="text-xs text-gray-400">{lead.phone}</div>}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-700">{lead.treatment}</td>
                          <td className="px-6 py-4 text-gray-500">
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                              {lead.source || "Website"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="capitalize px-2.5 py-1 bg-primary/10 text-primary font-semibold rounded-full text-xs">
                              {lead.stage}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {lead.priority === 'High' ? (
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded text-xs font-bold">
                                High
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs">Normal</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-900">
                            {lead.estimatedValue ? `₹${lead.estimatedValue.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              {/* Status Dropdown Selector */}
                              <div className="relative inline-block">
                                <select
                                  value={lead.stage}
                                  onChange={(e) => handleMoveStage(lead, e.target.value)}
                                  className="text-xs font-semibold px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-700 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-xs pr-7 appearance-none"
                                >
                                  <option value="new">New Inquiries</option>
                                  <option value="contacted">Contacted</option>
                                  <option value="quote">Quote / Roster</option>
                                  <option value="visited">OPD Visited</option>
                                  <option value="wonLost">Won / Lost</option>
                                </select>
                                <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-gray-400">
                                  <span className="text-[10px]">&#9662;</span>
                                </div>
                              </div>

                              {/* Convert to Patient Quick Action */}
                              {lead.patientUhid ? (
                                <a
                                  href={`/patient/${lead.convertedPatientId || lead.patientUhid}`}
                                  className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs whitespace-nowrap"
                                  title={`Registered: ${lead.patientUhid}`}
                                >
                                  {lead.patientUhid}
                                </a>
                              ) : (
                                <button
                                  onClick={() => handleConvertToPatient(lead)}
                                  disabled={isConverting}
                                  className="text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full hover:bg-primary hover:text-white transition-all cursor-pointer whitespace-nowrap"
                                  title="Convert lead to registered patient"
                                >
                                  + Convert
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteLead(lead)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete lead"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Slide-over Detail Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-[#F8FAF9]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedLead.name}</h3>
                  <span className="text-xs text-gray-400">Code: {selectedLead.leadCode || selectedLead.id}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLead(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-5 flex-1 overflow-y-auto text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Enquiry Treatment</p>
                <p className="font-bold text-gray-900 text-base">{selectedLead.treatment}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <span className="text-xs text-gray-500">Pipeline Stage</span>
                  <p className="font-bold text-primary capitalize mt-0.5">{selectedLead.stage}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Priority Level</span>
                  <p className="font-bold text-gray-900 mt-0.5">{selectedLead.priority || "Normal"}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Acquisition Source</span>
                  <p className="font-medium text-gray-800 mt-0.5">{selectedLead.source || "Website"}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Estimated Value</span>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {selectedLead.estimatedValue ? `₹${selectedLead.estimatedValue.toLocaleString('en-IN')}` : "Not quoted"}
                  </p>
                </div>
              </div>

              {/* Lead to Patient Conversion Card */}
              {selectedLead.patientUhid ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <UserCheck size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-900">Registered Hospital Patient</p>
                      <p className="text-xs text-emerald-700 font-medium">UHID: {selectedLead.patientUhid}</p>
                    </div>
                  </div>
                  <a
                    href={`/patient/${selectedLead.convertedPatientId || selectedLead.patientUhid}`}
                    className="text-xs font-bold text-emerald-800 bg-white px-3 py-1.5 rounded-lg border border-emerald-300 hover:bg-emerald-100 transition-colors shadow-2xs"
                  >
                    View 360 &rarr;
                  </a>
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-r from-primary/10 via-teal-50 to-emerald-50 border border-primary/20 rounded-xl flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-primary" />
                    <span className="text-xs font-bold text-gray-900">Ready to Admit / Consult?</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Convert this lead into an official registered patient with an assigned UHID.
                  </p>
                  <button
                    onClick={() => handleConvertToPatient(selectedLead)}
                    disabled={isConverting}
                    className="mt-1 w-full py-2 px-3 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isConverting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Generating UHID...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck size={15} />
                        <span>Convert to Registered Patient</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Direct Communications */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Patient Contact Details</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <Phone size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-800">{selectedLead.phone || "No phone added"}</span>
                    </div>
                    {selectedLead.phone && (
                      <a href={`tel:${selectedLead.phone}`} className="text-xs font-bold text-primary hover:underline">
                        Call Now
                      </a>
                    )}
                  </div>
                  {selectedLead.email && (
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <Mail size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-800">{selectedLead.email}</span>
                      </div>
                      <a href={`mailto:${selectedLead.email}`} className="text-xs font-bold text-primary hover:underline">
                        Email
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Stage Transition Control */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Advance Stage</p>
                <div className="grid grid-cols-2 gap-2">
                  {STAGES.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => handleMoveStage(selectedLead, s.key)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                        selectedLead.stage === s.key
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clinical Notes */}
              {selectedLead.notes && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Clinical Notes</p>
                  <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {selectedLead.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-100 bg-[#F8FAF9] flex items-center justify-between">
              <button
                onClick={() => handleDeleteLead(selectedLead)}
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold p-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 size={15} />
                <span>Delete Lead</span>
              </button>
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-8 border border-gray-100">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-[#F8FAF9]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Add New Patient Enquiry</h3>
                  <p className="text-xs text-gray-500">Record inbound query or OPD package lead</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Patient / Lead Name *</label>
                <input 
                  type="text" 
                  required 
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="e.g. Meena Ramanathan" 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Treatment / Enquiry Details *</label>
                <input 
                  type="text" 
                  required 
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  placeholder="e.g. IVF consultation / Knee replacement estimate" 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Phone</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210" 
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email (Optional)</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patient@gmail.com" 
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Source</label>
                  <select 
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="Website">Website Form</option>
                    <option value="Facebook">Social Media</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Health camp">Health camp</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Doctor referral">Doctor referral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Stage</label>
                  <select 
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="new">New Inquiries</option>
                    <option value="contacted">Contacted</option>
                    <option value="quote">Quote / Roster</option>
                    <option value="visited">OPD Visited</option>
                    <option value="wonLost">Won / Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Estimated Value / Package Cost (₹)</label>
                <input 
                  type="number" 
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  placeholder="e.g. 65000" 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-2 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Create Lead</span>
                  )}
                </button>
              </div>
            </form>
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
