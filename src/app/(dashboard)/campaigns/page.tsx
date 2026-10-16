"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, Plus, Filter, TrendingUp, Users, DollarSign, Activity, 
  Play, Pause, CheckCircle, RefreshCw, BarChart3, ChevronRight, Download
} from "lucide-react";
import { campaignApi, Campaign, CampaignStatus, CampaignSummary } from "@/lib/api";

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [summary, setSummary] = useState<CampaignSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals & Selection
  const [showFilters, setShowFilters] = useState(false);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Campaign Form
  const [campName, setCampName] = useState("");
  const [platform, setPlatform] = useState("Google Ads");
  const [customPlatform, setCustomPlatform] = useState("");
  const [department, setDepartment] = useState("Orthopaedics");
  const [budget, setBudget] = useState<number | "">("");
  const [initialSpend, setInitialSpend] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [listRes, sumRes] = await Promise.all([
        campaignApi.getAll({
          search: searchQuery || undefined,
          status: statusFilter !== "All" ? statusFilter : undefined,
          platform: platformFilter !== "All" ? platformFilter : undefined,
        }),
        campaignApi.getSummary(),
      ]);

      if (listRes.success && listRes.data) {
        setCampaigns(listRes.data);
      }
      if (sumRes.success && sumRes.data) {
        setSummary(sumRes.data);
      }
    } catch (err: any) {
      console.error("Failed to load campaigns:", err);
      showToast("Error loading campaigns from server");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, platformFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName.trim()) {
      showToast("Please enter a campaign name");
      return;
    }

    try {
      setIsSubmitting(true);
      const chosenPlatform = platform === "Other" ? (customPlatform.trim() || "Digital Ads") : platform;
      const res = await campaignApi.create({
        name: campName.trim(),
        platform: chosenPlatform,
        department,
        budget: Number(budget) || 0,
        spend: Number(initialSpend) || 0,
        notes,
      });

      if (res.success) {
        showToast(`Campaign "${campName}" created successfully!`);
        setShowNewCampaign(false);
        setCampName("");
        setBudget("");
        setInitialSpend("");
        setNotes("");
        setCustomPlatform("");
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to create campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (camp: Campaign, newStatus: CampaignStatus, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await campaignApi.updateStatus(camp.id, newStatus);
      if (res.success) {
        showToast(`Campaign status updated to ${newStatus}`);
        if (selectedCampaign?.id === camp.id) {
          setSelectedCampaign({ ...selectedCampaign, status: newStatus });
        }
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update campaign status");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusStyles = (status: CampaignStatus) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Paused': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Completed': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleExport = () => {
    if (campaigns.length === 0) {
      showToast("No campaign data to export");
      return;
    }

    const headers = ["Campaign ID", "Campaign Name", "Platform", "Department", "Status", "Budget", "Spend", "Leads", "Conversions", "Conv Rate", "CPL", "ROI"];
    const rows = campaigns.map(c => {
      const convRate = c.leads > 0 ? ((c.conversions / c.leads) * 100).toFixed(1) + "%" : "0%";
      const cpl = c.leads > 0 ? (c.spend / c.leads).toFixed(0) : "0";
      return [
        `"${c.id}"`,
        `"${c.name}"`,
        `"${c.platform}"`,
        `"${c.department}"`,
        `"${c.status}"`,
        c.budget,
        c.spend,
        c.leads,
        c.conversions,
        `"${convRate}"`,
        cpl,
        `"${c.roiMultiplier || 0}x"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hospital_Campaigns_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Exported campaign report to CSV successfully!");
  };

  return (
    <div className="h-full flex flex-col bg-[#F6F8F8] animate-in fade-in duration-300 relative">
      
      {/* Header Area */}
      <div className="bg-white shrink-0 z-10 shadow-sm border-b border-gray-100">
        <header className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-10 py-4 md:py-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Marketing Campaigns</h1>
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#0B5E5E] bg-[#E7F4EE] px-2.5 py-1 rounded-full">
                <BarChart3 size={14} /> ROI & Attribution
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1 font-medium">Track lead generation, ad spend, CPL, and surgical acquisition ROI</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-auto">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campaigns, platform, department..."
                className="cursor-text pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full md:w-72 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20 transition-all font-medium"
              />
            </div>

            <button 
              onClick={() => { loadData(); showToast("Refreshed campaigns data"); }}
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
              onClick={() => setShowNewCampaign(true)}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-[#0B5E5E] text-white rounded-lg text-sm font-semibold hover:bg-[#0B5E5E]/90 transition-colors shadow-sm"
            >
              <Plus size={16} /> New Campaign
            </button>
          </div>
        </header>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-10 scrollbar-hide space-y-6">
        
        {/* KPI Cards Ribbon */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Ad Spend</span>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">{formatCurrency(summary.totalSpend)}</p>
                <span className="text-xs text-gray-500 font-medium mt-0.5 block">Budget: {formatCurrency(summary.totalBudget)}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-[#0B5E5E]">
                <DollarSign size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Leads Acquired</span>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">{summary.totalLeads}</p>
                <span className="text-xs text-emerald-600 font-semibold mt-0.5 block">
                  Avg CPL: ₹{summary.totalLeads > 0 ? Math.round(summary.totalSpend / summary.totalLeads) : 0}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Users size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Conversions / Surgeries</span>
                <p className="text-2xl font-extrabold text-emerald-700 mt-1">{summary.totalConversions}</p>
                <span className="text-xs text-gray-500 font-medium mt-0.5 block">
                  Rate: {summary.totalLeads > 0 ? ((summary.totalConversions / summary.totalLeads) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Overall Campaign ROI</span>
                <p className="text-2xl font-extrabold text-[#0B5E5E] mt-1">{summary.overallRoi}</p>
                <span className="text-xs text-emerald-600 font-semibold mt-0.5 block">
                  {summary.activeCampaigns} Active Campaigns
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-[#0B5E5E]">
                <TrendingUp size={20} />
              </div>
            </div>
          </div>
        )}

        {/* Campaigns Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto scrollbar-hide">
          <table className="w-full min-w-max text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50/70 text-gray-600 font-bold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Campaign Name</th>
                <th className="px-6 py-4">Platform</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Budget</th>
                <th className="px-6 py-4">Spend</th>
                <th className="px-6 py-4">Leads</th>
                <th className="px-6 py-4">Conv. Rate</th>
                <th className="px-6 py-4">CPL</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center text-gray-400">
                    <RefreshCw size={20} className="animate-spin inline mr-2 text-[#0B5E5E]" /> Loading marketing campaigns...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center text-gray-400 font-medium">
                    No campaigns found matching your query.
                  </td>
                </tr>
              ) : (
                campaigns.map((camp) => {
                  const convRate = camp.leads > 0 ? ((camp.conversions / camp.leads) * 100).toFixed(1) : "0.0";
                  const cpl = camp.leads > 0 ? (camp.spend / camp.leads).toFixed(0) : "0";
                  
                  return (
                    <tr 
                      key={camp.id} 
                      onClick={() => setSelectedCampaign(camp)}
                      className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 group-hover:text-[#0B5E5E] transition-colors">
                          {camp.name}
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{camp.id}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">
                        {camp.platform}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                        <span className="bg-gray-100 px-2 py-0.5 rounded">
                          {camp.department}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyles(camp.status)}`}>
                          {camp.status === 'Active' && <Play size={10} className="fill-emerald-600 text-emerald-600" />}
                          {camp.status === 'Paused' && <Pause size={10} className="fill-amber-600 text-amber-600" />}
                          {camp.status === 'Completed' && <CheckCircle size={10} />}
                          {camp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">{formatCurrency(camp.budget)}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(camp.spend)}</td>
                      <td className="px-6 py-4 font-bold text-blue-700">{camp.leads}</td>
                      <td className="px-6 py-4 font-bold text-emerald-700">{convRate}% ({camp.conversions})</td>
                      <td className="px-6 py-4 font-semibold text-gray-700">₹{cpl}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {camp.status === 'Active' ? (
                            <button
                              onClick={(e) => handleToggleStatus(camp, 'Paused', e)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              title="Pause Campaign"
                            >
                              Pause
                            </button>
                          ) : camp.status === 'Paused' ? (
                            <button
                              onClick={(e) => handleToggleStatus(camp, 'Active', e)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              title="Activate Campaign"
                            >
                              Resume
                            </button>
                          ) : null}
                          <button 
                            onClick={() => setSelectedCampaign(camp)}
                            className="text-gray-400 group-hover:text-[#0B5E5E] transition-colors p-1"
                          >
                            <ChevronRight size={18} />
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

      {/* 1. Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-gray-100">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">Filter Campaigns</h3>
              <button onClick={() => setShowFilters(false)} className="cursor-pointer text-gray-400 hover:text-gray-600 text-sm font-semibold">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Platform</label>
                <select 
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="cursor-pointer w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium"
                >
                  <option value="All">All Platforms</option>
                  <option value="Google Ads">Google Ads</option>
                  <option value="Facebook Ads">Facebook Ads</option>
                  <option value="Instagram">Instagram</option>
                  <option value="SMS / WhatsApp">SMS / WhatsApp</option>
                  <option value="Offline / Local">Offline / Local</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Status</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="cursor-pointer w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Paused">Paused Only</option>
                  <option value="Completed">Completed Only</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t border-gray-100">
              <button 
                onClick={() => { setStatusFilter("All"); setPlatformFilter("All"); setShowFilters(false); }} 
                className="cursor-pointer px-4 py-2 text-xs font-bold text-gray-600"
              >
                Reset
              </button>
              <button 
                onClick={() => { setShowFilters(false); loadData(); }} 
                className="cursor-pointer px-4 py-2 text-xs font-bold text-white bg-[#0B5E5E] rounded-lg"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. New Campaign Modal */}
      {showNewCampaign && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-gray-100">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-[#0B5E5E]/5">
              <div>
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <Plus size={20} className="text-[#0B5E5E]" /> Launch New Campaign
                </h3>
                <p className="text-xs text-gray-500">Configure ad channels, target department, and initial budget</p>
              </div>
              <button onClick={() => setShowNewCampaign(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer text-sm font-semibold">✕</button>
            </div>

            <form onSubmit={handleCreateCampaign} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Campaign Title
                </label>
                <input 
                  type="text" 
                  required 
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  placeholder="e.g. Laser Cataract Surgery Awareness 2026" 
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Platform / Channel</label>
                  <select 
                    value={platform} 
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium cursor-pointer"
                  >
                    <option value="Google Ads">Google Ads (Search & Display)</option>
                    <option value="Facebook Ads">Facebook / Meta Ads</option>
                    <option value="Instagram">Instagram Sponsored</option>
                    <option value="SMS / WhatsApp">SMS & WhatsApp Broadcast</option>
                    <option value="Offline / Local">Free Health Camp / Offline</option>
                    <option value="Other">+ Other Platform...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Clinical Department</label>
                  <select 
                    value={department} 
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium cursor-pointer"
                  >
                    <option value="Orthopaedics">Orthopaedics</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Gynaecology">Gynaecology & IVF</option>
                    <option value="Ophthalmology">Ophthalmology</option>
                    <option value="General Surgery">General Surgery</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Paediatrics">Paediatrics</option>
                  </select>
                </div>
              </div>

              {platform === "Other" && (
                <div className="animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-[#0B5E5E] uppercase tracking-wider mb-1.5">
                    Specify Custom Platform / Channel Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customPlatform}
                    onChange={(e) => setCustomPlatform(e.target.value)}
                    placeholder="e.g. YouTube In-Stream Ads, Hoarding Billboard, Radio"
                    className="w-full px-3 py-2 border border-[#0B5E5E]/40 rounded-lg text-sm bg-emerald-50/20 font-medium"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Total Budget (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    placeholder="50000" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Initial Spend (₹)</label>
                  <input 
                    type="number" 
                    value={initialSpend}
                    onChange={(e) => setInitialSpend(Number(e.target.value))}
                    placeholder="0" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Campaign Objective / Notes</label>
                <textarea 
                  rows={2} 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Targeting knee arthritis queries in Bengaluru, free consultation voucher included..." 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowNewCampaign(false)} 
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0B5E5E] rounded-lg hover:bg-[#0B5E5E]/90 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Launching..." : "Launch Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Campaign Analytics Details Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-gray-100">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xl text-gray-900">{selectedCampaign.name}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusStyles(selectedCampaign.status)}`}>
                    {selectedCampaign.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 font-mono">{selectedCampaign.id} &middot; {selectedCampaign.platform} &middot; {selectedCampaign.department}</p>
              </div>
              <button onClick={() => setSelectedCampaign(null)} className="cursor-pointer text-gray-400 hover:text-gray-600 text-sm font-semibold">✕</button>
            </div>

            <div className="p-6 bg-[#F6F8F8] space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Budget</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(selectedCampaign.budget)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Spend</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(selectedCampaign.spend)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Leads</p>
                  <p className="text-lg font-bold text-blue-700 mt-1">{selectedCampaign.leads}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Conversions</p>
                  <p className="text-lg font-bold text-emerald-700 mt-1">{selectedCampaign.conversions}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <TrendingUp size={16} className="text-[#0B5E5E]" /> Return on Ad Spend (ROAS)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-gray-600 pb-2 border-b border-gray-50">
                    <span>Cost Per Lead (CPL)</span>
                    <span className="font-bold text-gray-900">
                      ₹{selectedCampaign.leads > 0 ? (selectedCampaign.spend / selectedCampaign.leads).toFixed(0) : "0"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600 pb-2 border-b border-gray-50">
                    <span>Conversion Rate</span>
                    <span className="font-bold text-emerald-700">
                      {selectedCampaign.leads > 0 ? ((selectedCampaign.conversions / selectedCampaign.leads) * 100).toFixed(1) : "0"}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600 pb-2 border-b border-gray-50">
                    <span>Cost Per Acquisition (CPA)</span>
                    <span className="font-bold text-gray-900">
                      ₹{selectedCampaign.conversions > 0 ? (selectedCampaign.spend / selectedCampaign.conversions).toFixed(0) : "0"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-900 font-bold pt-1">
                    <span>ROI Multiplier</span>
                    <span className="text-emerald-700 text-sm">
                      {selectedCampaign.roiMultiplier || (selectedCampaign.conversions > 0 ? (selectedCampaign.conversions * 20000 / (selectedCampaign.spend || 1)).toFixed(1) : 0)}x
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Controls */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600">Quick Status Controls:</span>
                <div className="flex items-center gap-2">
                  {selectedCampaign.status !== 'Active' && (
                    <button
                      onClick={() => handleToggleStatus(selectedCampaign, 'Active')}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                    >
                      Set Active
                    </button>
                  )}
                  {selectedCampaign.status !== 'Paused' && (
                    <button
                      onClick={() => handleToggleStatus(selectedCampaign, 'Paused')}
                      className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-100 cursor-pointer"
                    >
                      Pause
                    </button>
                  )}
                  {selectedCampaign.status !== 'Completed' && (
                    <button
                      onClick={() => handleToggleStatus(selectedCampaign, 'Completed')}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-200 cursor-pointer"
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end p-4 bg-white border-t border-gray-100">
              <button 
                onClick={() => setSelectedCampaign(null)}
                className="cursor-pointer px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>
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
