"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, Filter, MessageSquare, Star, Send, ArrowUpRight, TrendingUp, 
  ThumbsUp, ThumbsDown, UserPlus, HeartPulse, RefreshCw, CheckCircle, 
  AlertCircle, X, Mail, Phone, ExternalLink, MessageCircle
} from "lucide-react";
import { feedbackApi, FeedbackItem, FeedbackMetrics, NPSCategory } from "@/lib/api";

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [metrics, setMetrics] = useState<FeedbackMetrics>({
    totalReviews: 0,
    npsScore: 0,
    avgRating: 0,
    promoterPct: 0,
    passivePct: 0,
    detractorPct: 0,
    actionRequired: 0,
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [sendingSurvey, setSendingSurvey] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [followUpNote, setFollowUpNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Send survey form state
  const [surveyForm, setSurveyForm] = useState({
    targetAudience: "Recent OPD Consults (Last 24h)",
    channel: "Email",
    patientName: "",
    customEmail: "sumanqaj9876@gmail.com",
    customPhone: "+91 98765 43210"
  });

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadFeedbackData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await feedbackApi.getAll({
        search: searchQuery,
        category: selectedCategory,
        department: selectedDepartment,
      });

      if (res.data) {
        setFeedbacks(res.data.feedbacks || []);
        setMetrics(res.data.metrics || {
          totalReviews: 0,
          npsScore: 0,
          avgRating: 0,
          promoterPct: 0,
          passivePct: 0,
          detractorPct: 0,
          actionRequired: 0,
        });
      }
    } catch (err) {
      console.error("Failed to load feedbacks:", err);
      showToast("Could not load feedback data from server");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedDepartment]);

  useEffect(() => {
    loadFeedbackData();
  }, [loadFeedbackData]);

  const handleSendSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSendingSurvey(true);
      const res = await feedbackApi.sendSurvey({
        targetAudience: surveyForm.targetAudience,
        channel: surveyForm.channel,
        customEmail: surveyForm.customEmail,
        customPhone: surveyForm.customPhone,
        patientName: surveyForm.patientName || "Valued Patient"
      });

      if (res.data) {
        showToast(res.data.message || `Survey sent via ${surveyForm.channel}!`);
        setShowSurvey(false);
      }
    } catch (err: any) {
      console.error("Error dispatching survey:", err);
      showToast(err?.message || "Failed to dispatch survey");
    } finally {
      setSendingSurvey(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingStatus(true);
      await feedbackApi.updateStatus(id, {
        status: newStatus,
        followUpNotes: followUpNote
      });

      showToast(`Feedback ${id} marked as ${newStatus}!`);
      setSelectedFeedback(null);
      setFollowUpNote("");
      loadFeedbackData();
    } catch (err: any) {
      console.error("Error updating feedback status:", err);
      showToast("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getCategoryStyles = (category: NPSCategory) => {
    switch (category) {
      case 'Promoter': 
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Passive': 
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Detractor': 
        return 'bg-red-50 text-red-700 border-red-200';
      default: 
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        size={14} 
        className={i < rating ? "fill-amber-400 text-amber-400" : "text-gray-300"} 
      />
    ));
  };

  return (
    <div className="h-full flex flex-col bg-[#F6F8F8] animate-in fade-in duration-300 relative">
      
      {/* Header Area */}
      <div className="bg-white shrink-0 z-10 shadow-sm border-b border-gray-100">
        <header className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-10 py-4 md:py-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patient Feedback & NPS</h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">Monitor patient satisfaction, Net Promoter Score, and clinical service quality</p>
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
                placeholder="Search patient, doctor, dept..."
                className="cursor-text pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full md:w-72 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20 transition-all placeholder:text-gray-400 font-medium"
              />
            </div>
            
            <button 
              onClick={() => setShowFilters(true)}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Filter size={16} /> Filters
              {(selectedCategory !== 'All' || selectedDepartment !== 'All') && (
                <span className="w-2 h-2 rounded-full bg-[#0B5E5E]" />
              )}
            </button>

            <button
              onClick={loadFeedbackData}
              className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer"
              title="Refresh data"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>

            <button 
              onClick={() => setShowSurvey(true)}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-[#0B5E5E] text-white rounded-lg text-sm font-semibold hover:bg-[#0B5E5E]/90 transition-colors shadow-sm"
            >
              <Send size={16} /> Send Survey
            </button>
          </div>
        </header>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-10 scrollbar-hide space-y-8">
        
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#0B5E5E] flex items-center justify-center shrink-0">
              <HeartPulse size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Net Promoter Score</p>
              <h3 className="text-3xl font-extrabold text-gray-900">{metrics.npsScore > 0 ? `+${metrics.npsScore}` : metrics.npsScore}</h3>
              <p className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1">
                <TrendingUp size={12} /> {metrics.avgRating} / 5.0 Avg Stars
              </p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ThumbsUp size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Promoters (9-10)</p>
              <h3 className="text-3xl font-extrabold text-gray-900">{metrics.promoterPct}%</h3>
              <p className="text-xs text-gray-400 mt-2 font-medium">Brand advocates & happy patients</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <UserPlus size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Passives (7-8)</p>
              <h3 className="text-3xl font-extrabold text-gray-900">{metrics.passivePct}%</h3>
              <p className="text-xs text-gray-400 mt-2 font-medium">Satisfied, retention target</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <ThumbsDown size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Detractors (0-6)</p>
              <h3 className="text-3xl font-extrabold text-gray-900">{metrics.detractorPct}%</h3>
              <p className="text-xs font-semibold text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle size={12} /> {metrics.actionRequired} Cases Require Follow-up
              </p>
            </div>
          </div>
        </div>

        {/* Main Table Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-gray-900">Patient Reviews & Experience Audit</h3>
              <p className="text-xs text-gray-400 mt-0.5">Live feedback collected via OPD, discharge surveys, and direct care encounters</p>
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              Total {feedbacks.length} Feedback Records
            </span>
          </div>

          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full min-w-max text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-600 text-xs uppercase tracking-wider">Patient Name</th>
                  <th className="px-6 py-4 font-bold text-gray-600 text-xs uppercase tracking-wider">Department & Doctor</th>
                  <th className="px-6 py-4 font-bold text-gray-600 text-xs uppercase tracking-wider">NPS Category</th>
                  <th className="px-6 py-4 font-bold text-gray-600 text-xs uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-4 font-bold text-gray-600 text-xs uppercase tracking-wider max-w-xs">Patient Remarks</th>
                  <th className="px-6 py-4 font-bold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-bold text-gray-600 text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      <RefreshCw className="animate-spin inline mr-2" size={16} /> Fetching patient feedback records...
                    </td>
                  </tr>
                ) : feedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium">
                      No feedback entries found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  feedbacks.map((fb) => (
                    <tr key={fb.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 cursor-pointer hover:text-[#0B5E5E] transition-colors">
                          {fb.patient}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">{fb.id} &bull; {fb.date}</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 text-xs">{fb.department}</div>
                        <div className="text-[11px] text-gray-500 font-medium mt-0.5">{fb.doctor || 'Staff General'}</div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getCategoryStyles(fb.category)}`}>
                          Score {fb.npsScore} &bull; {fb.category}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {renderStars(fb.rating)}
                        </div>
                      </td>

                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-xs text-gray-600 font-medium truncate" title={fb.comment}>
                          &quot;{fb.comment}&quot;
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          fb.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          fb.status === 'Action Required' ? 'bg-red-50 text-red-700 border border-red-200' :
                          'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            fb.status === 'Resolved' ? 'bg-emerald-500' :
                            fb.status === 'Action Required' ? 'bg-red-500' :
                            'bg-gray-400'
                          }`} />
                          {fb.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => {
                            setSelectedFeedback(fb);
                            setFollowUpNote(fb.followUpNotes || "");
                          }}
                          className="cursor-pointer text-xs font-bold text-[#0B5E5E] bg-emerald-50 hover:bg-emerald-100/80 px-3 py-1.5 rounded-lg transition-colors border border-emerald-100"
                        >
                          Review &rarr;
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col border border-gray-100">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">Filter Feedback</h3>
              <button 
                onClick={() => setShowFilters(false)} 
                className="cursor-pointer text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">NPS Category</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="cursor-pointer w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white font-medium"
                >
                  <option value="All">All Categories</option>
                  <option value="Promoter">Promoters (9-10)</option>
                  <option value="Passive">Passives (7-8)</option>
                  <option value="Detractor">Detractors (0-6)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Department</label>
                <select 
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="cursor-pointer w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white font-medium"
                >
                  <option value="All">All Departments</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Maternity">Gynecology & Maternity</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Neurology">Neurology</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 bg-gray-50 border-t border-gray-100">
              <button 
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedDepartment('All');
                  setShowFilters(false);
                }} 
                className="cursor-pointer px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
              >
                Reset Filters
              </button>
              <button 
                onClick={() => setShowFilters(false)} 
                className="cursor-pointer px-5 py-2 text-xs font-bold text-white bg-[#0B5E5E] rounded-lg shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Survey Modal */}
      {showSurvey && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0B5E5E] flex items-center justify-center">
                  <Send size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Send Patient NPS Survey</h3>
                  <p className="text-xs text-gray-400">Dispatch 1-minute digital satisfaction survey</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSurvey(false)} 
                className="cursor-pointer text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendSurvey} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Target Audience
                </label>
                <select 
                  value={surveyForm.targetAudience}
                  onChange={(e) => setSurveyForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                  className="cursor-pointer w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white font-medium"
                >
                  <option value="Recent Discharges (Last 24h)">Recent IPD Discharges (Last 24h)</option>
                  <option value="Recent OPD Consults (Last 24h)">Recent OPD Consultations (Last 24h)</option>
                  <option value="Specific Patient">Specific Patient Direct Dispatch</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Patient Name (Optional)
                </label>
                <input
                  type="text"
                  value={surveyForm.patientName}
                  onChange={(e) => setSurveyForm(prev => ({ ...prev, patientName: e.target.value }))}
                  placeholder="e.g. Rahul Sharma"
                  className="cursor-text w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Recipient Email (Gmail SMTP)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Mail size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={surveyForm.customEmail}
                    onChange={(e) => setSurveyForm(prev => ({ ...prev, customEmail: e.target.value }))}
                    placeholder="patient@gmail.com"
                    className="cursor-text w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Delivery Channel
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSurveyForm(prev => ({ ...prev, channel: 'Email' }))}
                    className={`cursor-pointer p-3 border rounded-xl flex items-center gap-2.5 text-xs font-bold transition-all ${
                      surveyForm.channel === 'Email' 
                        ? 'border-[#0B5E5E] bg-teal-50/50 text-[#0B5E5E]' 
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Mail size={16} /> Email (Active SMTP)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSurveyForm(prev => ({ ...prev, channel: 'WhatsApp' }))}
                    className={`cursor-pointer p-3 border rounded-xl flex items-center gap-2.5 text-xs font-bold transition-all ${
                      surveyForm.channel === 'WhatsApp' 
                        ? 'border-[#0B5E5E] bg-teal-50/50 text-[#0B5E5E]' 
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <MessageCircle size={16} /> WhatsApp Cloud
                  </button>
                </div>
              </div>

              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 flex items-start gap-2.5 text-xs text-[#0B5E5E]">
                <CheckCircle size={16} className="shrink-0 mt-0.5" />
                <span>
                  The recipient receives a clean 1-tap rating link. When submitted, responses update this dashboard in real-time.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowSurvey(false)} 
                  className="cursor-pointer px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={sendingSurvey}
                  className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-[#0B5E5E] text-white rounded-lg text-xs font-bold hover:bg-[#0B5E5E]/90 transition-colors shadow-sm disabled:opacity-60"
                >
                  {sendingSurvey ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Dispatching...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Send Survey Now
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-gray-100">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#0B5E5E] flex items-center justify-center shrink-0">
                  <MessageSquare size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Patient Feedback: {selectedFeedback.patient}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">
                    {selectedFeedback.date} &bull; {selectedFeedback.department} &bull; Attending: {selectedFeedback.doctor}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedFeedback(null)} 
                className="cursor-pointer text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              
              {/* Score & Rating metrics */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">NPS Score</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getCategoryStyles(selectedFeedback.category)}`}>
                    Score {selectedFeedback.npsScore} &bull; {selectedFeedback.category}
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Star Rating</p>
                  <div className="flex items-center gap-1 mt-1">
                    {renderStars(selectedFeedback.rating)}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Channel</p>
                  <p className="text-xs font-bold text-gray-800 mt-1">{selectedFeedback.surveyChannel}</p>
                </div>
              </div>

              {/* Department aspects breakdown */}
              {selectedFeedback.aspects && (
                <div>
                  <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider mb-3">Service Breakdown</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-white border border-gray-100 rounded-xl text-center">
                      <p className="text-[11px] text-gray-400 font-medium">Doctor Care</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedFeedback.aspects.doctorCare || 5} / 5</p>
                    </div>
                    <div className="p-3 bg-white border border-gray-100 rounded-xl text-center">
                      <p className="text-[11px] text-gray-400 font-medium">Cleanliness</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedFeedback.aspects.cleanliness || 5} / 5</p>
                    </div>
                    <div className="p-3 bg-white border border-gray-100 rounded-xl text-center">
                      <p className="text-[11px] text-gray-400 font-medium">Nursing Staff</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedFeedback.aspects.nursingStaff || 5} / 5</p>
                    </div>
                    <div className="p-3 bg-white border border-gray-100 rounded-xl text-center">
                      <p className="text-[11px] text-gray-400 font-medium">Billing Clarity</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedFeedback.aspects.billingClarity || 5} / 5</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wider mb-2">Patient Written Comment</h4>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-700 leading-relaxed italic">
                    &quot;{selectedFeedback.comment}&quot;
                  </p>
                </div>
              </div>

              {/* Resolution Notes for Detractor / Grievance */}
              <div className="p-4 bg-gray-50/60 rounded-xl border border-gray-100 space-y-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Patient Relations Follow-Up Log
                </label>
                <textarea 
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  className="cursor-text w-full p-3 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20" 
                  rows={2} 
                  placeholder="e.g. Called patient, explained OPD wait times due to emergency case. Patient was reassured."
                />
              </div>

            </div>

            <div className="flex items-center justify-between p-6 bg-gray-50/50 border-t border-gray-100">
              <span className="text-xs text-gray-400 font-medium">
                Current Status: <strong>{selectedFeedback.status}</strong>
              </span>

              <div className="flex gap-3">
                {selectedFeedback.status !== 'Action Required' && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedFeedback.id, 'Action Required')}
                    disabled={updatingStatus}
                    className="cursor-pointer px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 transition-colors"
                  >
                    Mark Action Required
                  </button>
                )}

                <button 
                  onClick={() => handleUpdateStatus(selectedFeedback.id, 'Resolved')}
                  disabled={updatingStatus}
                  className="cursor-pointer px-5 py-2 text-xs font-bold text-white bg-[#0B5E5E] rounded-lg hover:bg-[#0B5E5E]/90 transition-colors shadow-sm"
                >
                  {updatingStatus ? 'Updating...' : 'Mark as Resolved'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B5E5E] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
