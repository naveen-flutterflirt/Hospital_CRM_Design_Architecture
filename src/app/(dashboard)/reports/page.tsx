"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Download, Filter, Calendar, BarChart3, TrendingUp, DollarSign, Users,
  Activity, FileText, RefreshCw, CheckCircle, Clock, Bed, ShieldCheck, PieChart
} from "lucide-react";
import {
  reportApi, FinancialReport, OperationalReport, MarketingReport
} from "@/lib/api";

type ReportTab = 'Financial' | 'Operational' | 'Marketing';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('Financial');
  const [showFilters, setShowFilters] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("This Month");
  const [department, setDepartment] = useState("All Departments");
  const [tempDateRange, setTempDateRange] = useState("This Month");
  const [tempDept, setTempDept] = useState("All Departments");

  // Dynamic Reports Data
  const [financial, setFinancial] = useState<FinancialReport | null>(null);
  const [operational, setOperational] = useState<OperationalReport | null>(null);
  const [marketing, setMarketing] = useState<MarketingReport | null>(null);
  const [loading, setLoading] = useState(true);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [finRes, opRes, mktRes] = await Promise.all([
        reportApi.getFinancial({ dateRange, department }),
        reportApi.getOperational(),
        reportApi.getMarketing(),
      ]);

      if (finRes.success && finRes.data) setFinancial(finRes.data);
      if (opRes.success && opRes.data) setOperational(opRes.data);
      if (mktRes.success && mktRes.data) setMarketing(mktRes.data);
    } catch (err: any) {
      console.error("Failed to load reports:", err);
      showToast("Error loading analytics data from server");
    } finally {
      setLoading(false);
    }
  }, [dateRange, department]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const handleExportCSV = () => {
    if (!financial || !operational || !marketing) {
      showToast("Report data not loaded yet");
      return;
    }

    const lines: string[] = [];
    lines.push(`"Hospital Performance & Analytics Report - Generated ${new Date().toISOString().slice(0, 10)}"`);
    lines.push(`"Parameter Date Range: ${dateRange} | Department: ${department}"`);
    lines.push("");

    if (activeTab === 'Financial') {
      lines.push('"FINANCIAL PERFORMANCE METRICS"');
      lines.push(`"Total Invoiced Revenue",${financial.totalRevenue}`);
      lines.push(`"Total Collected",${financial.totalCollected}`);
      lines.push(`"Total Outstanding Dues",${financial.totalOutstanding}`);
      lines.push(`"Collection Ratio",${financial.collectionRatio}%`);
      lines.push(`"Avg Revenue Per Bed",${financial.avgRevenuePerBed}`);
      lines.push("");
      lines.push('"DEPARTMENT REVENUE BREAKDOWN"');
      lines.push('"Department","Invoiced Amount","Invoices Count","Revenue Share (%)"');
      financial.departmentBreakdown.forEach(d => {
        lines.push(`"${d.department}",${d.amount},${d.count},"${d.percentage}%"`);
      });
    } else if (activeTab === 'Operational') {
      lines.push('"OPERATIONAL & BED OCCUPANCY METRICS"');
      lines.push(`"Total Beds",${operational.beds.total}`);
      lines.push(`"Occupied Beds",${operational.beds.occupied}`);
      lines.push(`"Bed Occupancy Rate",${operational.beds.occupancyRate}%`);
      lines.push(`"Average Length of Stay (ALOS)",${operational.averageLengthOfStayDays} Days`);
      lines.push(`"Total Registered Patients",${operational.totalRegisteredPatients}`);
      lines.push("");
      lines.push('"WARD UTILIZATION BREAKDOWN"');
      lines.push('"Ward Code","Ward Name","Department","Total Beds","Occupied Beds","Occupancy Rate"');
      operational.wards.forEach(w => {
        lines.push(`"${w.code}","${w.name}","${w.department}",${w.totalBeds},${w.occupiedBeds},"${w.occupancyRate}%"`);
      });
    } else {
      lines.push('"MARKETING & REFERRAL NETWORK ROI"');
      lines.push(`"Total Marketing Ad Spend",${marketing.campaigns.totalSpend}`);
      lines.push(`"Total Leads Generated",${marketing.campaigns.totalLeads}`);
      lines.push(`"Cost Per Lead (CPL)",${marketing.campaigns.costPerLead}`);
      lines.push(`"Lead Conversion Rate",${marketing.campaigns.conversionRate}`);
      lines.push(`"Total Referring Doctors",${marketing.referrals.totalDoctors}`);
      lines.push(`"Referral Patients Referred",${marketing.referrals.totalPatientsReferred}`);
      lines.push(`"Direct Referral Revenue",${marketing.referrals.totalRevenueGenerated}`);
      lines.push("");
      lines.push('"CAMPAIGN PERFORMANCE"');
      lines.push('"Campaign","Platform","Department","Leads","Spend","Conversions","Revenue"');
      marketing.campaigns.topCampaigns.forEach(c => {
        lines.push(`"${c.name}","${c.platform}","${c.department}",${c.leads_count},${c.spend},${c.conversions_count},${c.revenue_generated}`);
      });
    }

    const csvContent = lines.join("\r\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Hospital_${activeTab}_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${activeTab} report to CSV successfully!`);
  };

  const handleExportPDF = () => {
    if (!financial || !operational || !marketing) {
      showToast("Report data not loaded yet");
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=950');
    if (!printWindow) {
      showToast("Please allow popups to export the PDF report");
      return;
    }

    let reportBodyHtml = "";

    if (activeTab === 'Financial') {
      reportBodyHtml = `
        <div class="summary-cards">
          <div class="card">
            <h4>Total Invoiced</h4>
            <div class="val">${formatCurrency(financial.totalRevenue)}</div>
            <p>${financial.totalInvoices} Invoices</p>
          </div>
          <div class="card">
            <h4>Total Collected</h4>
            <div class="val" style="color:#0B5E5E">${formatCurrency(financial.totalCollected)}</div>
            <p>${financial.collectionRatio}% Realization</p>
          </div>
          <div class="card">
            <h4>Outstanding Dues</h4>
            <div class="val" style="color:#dc2626">${formatCurrency(financial.totalOutstanding)}</div>
            <p>Pending recovery</p>
          </div>
          <div class="card">
            <h4>TPA Claims Approved</h4>
            <div class="val" style="color:#2563eb">${formatCurrency(financial.tpa?.totalApproved || 0)}</div>
            <p>${financial.tpa?.totalClaims || 0} Total Claims</p>
          </div>
        </div>

        <h3>Department-wise Revenue Breakdown</h3>
        <table>
          <thead>
            <tr>
              <th>Department</th>
              <th>Billed Amount (₹)</th>
              <th>Invoices</th>
              <th>Revenue Share</th>
            </tr>
          </thead>
          <tbody>
            ${financial.departmentBreakdown.map(d => `
              <tr>
                <td><strong>${d.department}</strong></td>
                <td>${formatCurrency(d.amount)}</td>
                <td>${d.count}</td>
                <td>${d.percentage}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (activeTab === 'Operational') {
      const availableBeds = operational.beds.vacant ?? (operational.beds.total - operational.beds.occupied);
      reportBodyHtml = `
        <div class="summary-cards">
          <div class="card">
            <h4>Bed Occupancy Rate</h4>
            <div class="val" style="color:#0B5E5E">${operational.beds.occupancyRate}%</div>
            <p>${operational.beds.occupied} of ${operational.beds.total} Beds</p>
          </div>
          <div class="card">
            <h4>Available Beds</h4>
            <div class="val" style="color:#16a34a">${availableBeds}</div>
            <p>${operational.beds.cleaning || 0} Under Cleaning</p>
          </div>
          <div class="card">
            <h4>Avg Stay (ALOS)</h4>
            <div class="val">${operational.averageLengthOfStayDays} Days</div>
            <p>Per admitted patient</p>
          </div>
          <div class="card">
            <h4>Registered Patients</h4>
            <div class="val">${operational.totalRegisteredPatients}</div>
            <p>Active registry count</p>
          </div>
        </div>

        <h3>Ward-wise Live Utilization</h3>
        <table>
          <thead>
            <tr>
              <th>Ward Code</th>
              <th>Ward Name</th>
              <th>Department</th>
              <th>Total Beds</th>
              <th>Occupied</th>
              <th>Occupancy %</th>
            </tr>
          </thead>
          <tbody>
            ${operational.wards.map(w => `
              <tr>
                <td><code>${w.code}</code></td>
                <td><strong>${w.name}</strong></td>
                <td>${w.department}</td>
                <td>${w.totalBeds}</td>
                <td>${w.occupiedBeds}</td>
                <td><strong>${w.occupancyRate}%</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      reportBodyHtml = `
        <div class="summary-cards">
          <div class="card">
            <h4>Total Ad Spend</h4>
            <div class="val">${formatCurrency(marketing.campaigns.totalSpend)}</div>
            <p>Active Digital Campaigns</p>
          </div>
          <div class="card">
            <h4>Total Leads</h4>
            <div class="val" style="color:#0B5E5E">${marketing.campaigns.totalLeads}</div>
            <p>CPL: ${formatCurrency(marketing.campaigns.costPerLead)}</p>
          </div>
          <div class="card">
            <h4>Doctor Network Revenue</h4>
            <div class="val" style="color:#0B5E5E">${formatCurrency(marketing.referrals.totalRevenueGenerated)}</div>
            <p>${marketing.referrals.totalPatientsReferred} Patients Referred</p>
          </div>
          <div class="card">
            <h4>Partner Clinics</h4>
            <div class="val">${marketing.referrals.totalDoctors}</div>
            <p>Active referring doctors</p>
          </div>
        </div>

        <h3>Active Marketing Campaigns</h3>
        <table>
          <thead>
            <tr>
              <th>Campaign Name</th>
              <th>Platform</th>
              <th>Department</th>
              <th>Leads</th>
              <th>Spend</th>
              <th>Conversions</th>
              <th>Revenue Generated</th>
            </tr>
          </thead>
          <tbody>
            ${marketing.campaigns.topCampaigns.map(c => `
              <tr>
                <td><strong>${c.name}</strong></td>
                <td>${c.platform}</td>
                <td>${c.department}</td>
                <td>${c.leads_count}</td>
                <td>${formatCurrency(c.spend)}</td>
                <td>${c.conversions_count}</td>
                <td><strong>${formatCurrency(c.revenue_generated)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Hospital_${activeTab}_Report_${new Date().toISOString().slice(0,10)}</title>
        <meta charset="utf-8" />
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 20px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0B5E5E; padding-bottom: 16px; margin-bottom: 24px; }
          .brand h1 { margin: 0; color: #0B5E5E; font-size: 24px; letter-spacing: -0.5px; }
          .brand p { margin: 4px 0 0; color: #64748b; font-size: 13px; font-weight: 500; }
          .report-meta { text-align: right; }
          .report-meta h2 { margin: 0; font-size: 18px; color: #0f172a; text-transform: uppercase; }
          .report-meta p { margin: 4px 0 0; color: #64748b; font-size: 12px; }
          .filter-bar { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 16px; font-size: 12px; color: #475569; margin-bottom: 24px; display: flex; justify-content: space-between; }
          .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: left; }
          .card h4 { margin: 0; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
          .card .val { font-size: 22px; font-weight: 800; color: #0f172a; margin: 6px 0 2px; }
          .card p { margin: 0; font-size: 11px; color: #94a3b8; }
          h3 { font-size: 16px; color: #0f172a; margin: 24px 0 12px; border-left: 4px solid #0B5E5E; padding-left: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 30px; font-size: 13px; }
          th { background: #0B5E5E; color: #ffffff; text-align: left; padding: 10px 12px; font-weight: 600; font-size: 12px; }
          td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) { background-color: #fafbfc; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 14px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
          @media print {
            .no-print { display: none; }
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">
            <h1>ApexCare Hospital & Research Centre</h1>
            <p>Hospital CRM Analytics & Executive Intelligence Report</p>
          </div>
          <div class="report-meta">
            <h2>${activeTab} Report</h2>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
        </div>

        <div class="filter-bar">
          <div><strong>Date Range:</strong> ${dateRange}</div>
          <div><strong>Department Filter:</strong> ${department}</div>
          <div><strong>Environment:</strong> Live Production Database</div>
        </div>

        ${reportBodyHtml}

        <div class="footer">
          <div>ApexCare Enterprise Hospital Management System</div>
          <div>Official Internal Audit & Analytics Document &bull; Confidential</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    showToast(`Generating ${activeTab} PDF report...`);
  };

  const tabs: ReportTab[] = ['Financial', 'Operational', 'Marketing'];

  return (
    <div className="h-full flex flex-col bg-[#F6F8F8] animate-in fade-in duration-300 relative">

      {/* Header Area */}
      <div className="bg-white shrink-0 z-10 shadow-sm border-b border-gray-100">
        <header className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-10 py-4 md:py-6 gap-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#0B5E5E] bg-[#E7F4EE] px-2.5 py-1 rounded-full">
                <BarChart3 size={14} /> Live BI Database
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1 font-medium">Real-time financial revenues, operational bed occupancy, and marketing ROI</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => { loadData(); showToast("Refreshed analytics reports"); }}
              className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>

            <button
              onClick={() => setShowFilters(true)}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Calendar size={16} /> {dateRange}
            </button>

            <button
              onClick={() => setShowFilters(true)}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Filter size={16} /> {department}
            </button>

            <button
              onClick={handleExportCSV}
              className="cursor-pointer flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-xs"
              title="Download raw data as CSV"
            >
              <Download size={16} /> Export CSV
            </button>

            <button
              onClick={handleExportPDF}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-[#0B5E5E] text-white rounded-lg text-sm font-semibold hover:bg-[#0B5E5E]/90 transition-colors shadow-sm"
              title="Print or Save clean Executive PDF Report"
            >
              <FileText size={16} /> Export PDF
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="px-4 md:px-10 flex items-center gap-4 md:gap-6 overflow-x-auto whitespace-nowrap scrollbar-hide pt-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`cursor-pointer px-4 py-2 mb-4 rounded-md text-sm font-bold transition-all ${activeTab === tab
                  ? 'border-2 border-[#0B5E5E] text-[#0B5E5E] bg-emerald-50/40 shadow-xs'
                  : 'border-2 border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
            >
              {tab === 'Financial' && ' Financial Analytics'}
              {tab === 'Operational' && ' Operational & Beds Flow'}
              {tab === 'Marketing' && ' Marketing & Referrals ROI'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-10 scrollbar-hide space-y-8">

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw className="animate-spin inline mr-2" size={18} /> Calculating analytics aggregations...
          </div>
        ) : (
          <>
            {/* 1. FINANCIAL ANALYTICS TAB */}
            {activeTab === 'Financial' && financial && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <DollarSign size={20} />
                      </div>
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <TrendingUp size={12} /> Live Invoiced
                      </span>
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Billed Revenue</p>
                    <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{formatCurrency(financial.totalRevenue)}</h3>
                    <span className="text-xs text-gray-500 mt-1 block font-medium">{financial.totalInvoices} Invoices Issued</span>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-[#0B5E5E]">
                        <CheckCircle size={20} />
                      </div>
                      <span className="text-xs font-bold text-[#0B5E5E] bg-[#E7F4EE] px-2 py-0.5 rounded-full">
                        {financial.collectionRatio}% Realized
                      </span>
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Collected Cash & Online</p>
                    <h3 className="text-2xl font-extrabold text-[#0B5E5E] mt-1">{formatCurrency(financial.totalCollected)}</h3>
                    <span className="text-xs text-gray-500 mt-1 block font-medium">Bank & Cash Realization</span>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                        <Clock size={20} />
                      </div>
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Pending
                      </span>
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Outstanding Dues</p>
                    <h3 className="text-2xl font-extrabold text-amber-700 mt-1">{formatCurrency(financial.totalOutstanding)}</h3>
                    <span className="text-xs text-gray-500 mt-1 block font-medium">Patient Dues & Credit</span>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                        <ShieldCheck size={20} />
                      </div>
                      <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                        TPA Health
                      </span>
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">TPA Approved Claims</p>
                    <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{formatCurrency(financial.tpa.totalApproved)}</h3>
                    <span className="text-xs text-gray-500 mt-1 block font-medium">Pending: {formatCurrency(financial.tpa.pendingAmount)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Department Revenue Breakdown */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                        <PieChart size={18} className="text-[#0B5E5E]" /> Revenue by Medical Department
                      </h3>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Share (%)</span>
                    </div>

                    <div className="space-y-4">
                      {financial.departmentBreakdown.map((item, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-sm font-bold">
                            <span className="text-gray-700">{item.department}</span>
                            <span className="text-gray-900">{formatCurrency(item.amount)} ({item.percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-[#0B5E5E] h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(5, item.percentage)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ready to Download Financial Statements */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-base text-gray-900 mb-6 flex items-center gap-2">
                      <FileText size={18} className="text-[#0B5E5E]" /> Exportable Financial Statements
                    </h3>
                    <div className="space-y-3">
                      {[
                        { title: 'Hospital Profit & Billing Statement', desc: 'Detailed net amount, discounts, collections & dues' },
                        { title: 'TPA Insurance Claim Settlement Audit', desc: 'Pre-auth requested vs approved settlement ratios' },
                        { title: 'Department-wise Revenue Distribution', desc: 'Inpatient and outpatient billing aggregate report' },
                      ].map((report, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 text-[#0B5E5E]">
                              <FileText size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-gray-900 group-hover:text-[#0B5E5E] transition-colors">{report.title}</p>
                              <p className="text-xs text-gray-400 font-medium">{report.desc}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleExportPDF}
                              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#0B5E5E] bg-emerald-50 hover:bg-emerald-100 transition-colors"
                              title="Export PDF Document"
                            >
                              <FileText size={14} /> PDF
                            </button>
                            <button
                              onClick={handleExportCSV}
                              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                              title="Export CSV Data"
                            >
                              <Download size={14} /> CSV
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. OPERATIONAL & BEDS FLOW TAB */}
            {activeTab === 'Operational' && operational && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bed Occupancy Rate</p>
                    <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{operational.beds.occupancyRate}%</h3>
                    <span className="text-xs text-emerald-600 font-semibold mt-1 block">
                      {operational.beds.occupied} of {operational.beds.total} Beds Occupied
                    </span>
                    <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-[#0B5E5E] h-2 rounded-full" style={{ width: `${operational.beds.occupancyRate}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Average Length of Stay</p>
                    <h3 className="text-3xl font-extrabold text-blue-700 mt-1">{operational.averageLengthOfStayDays} Days</h3>
                    <span className="text-xs text-gray-500 mt-1 block font-medium">Standard Clinical Benchmark</span>
                    <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">OPD Wait Time (Avg)</p>
                    <h3 className="text-3xl font-extrabold text-emerald-700 mt-1">{operational.avgOpdWaitTimeMins} Mins</h3>
                    <span className="text-xs text-emerald-600 font-semibold mt-1 block">Optimal Turnaround</span>
                    <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Registered Patients</p>
                    <h3 className="text-3xl font-extrabold text-purple-700 mt-1">{operational.totalRegisteredPatients}</h3>
                    <span className="text-xs text-gray-500 mt-1 block font-medium">{operational.appointments.total} Appointments Booked</span>
                  </div>
                </div>

                {/* Ward-wise Bed Utilization Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                  <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                    <Bed size={18} className="text-[#0B5E5E]" /> Ward-Wise Utilization & Occupancy
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-gray-400 font-bold border-b border-gray-100 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Ward Code</th>
                          <th className="py-3 px-4">Ward Name</th>
                          <th className="py-3 px-4">Department</th>
                          <th className="py-3 px-4">Total Beds</th>
                          <th className="py-3 px-4">Occupied Beds</th>
                          <th className="py-3 px-4">Occupancy Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {operational.wards.map((w) => (
                          <tr key={w.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4 font-mono font-bold text-gray-900">{w.code}</td>
                            <td className="py-3 px-4 font-bold text-gray-800">{w.name}</td>
                            <td className="py-3 px-4 text-gray-600 font-medium">{w.department}</td>
                            <td className="py-3 px-4 font-bold text-gray-700">{w.totalBeds}</td>
                            <td className="py-3 px-4 font-bold text-blue-700">{w.occupiedBeds}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-2 rounded-full ${w.occupancyRate > 80 ? 'bg-amber-500' : 'bg-[#0B5E5E]'}`}
                                    style={{ width: `${w.occupancyRate}%` }}
                                  ></div>
                                </div>
                                <span className="font-bold text-xs text-gray-900">{w.occupancyRate}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 3. MARKETING & REFERRALS ROI TAB */}
            {activeTab === 'Marketing' && marketing && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign className="text-emerald-600" size={18} />
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Ad Spend</p>
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{formatCurrency(marketing.campaigns.totalSpend)}</h3>
                    <span className="text-xs text-gray-500 font-medium mt-1 block">Budget: {formatCurrency(marketing.campaigns.totalBudget)}</span>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="text-blue-600" size={18} />
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Leads Acquired</p>
                    </div>
                    <h3 className="text-2xl font-extrabold text-blue-700 mt-1">{marketing.campaigns.totalLeads}</h3>
                    <span className="text-xs text-emerald-600 font-semibold mt-1 block">Avg CPL: ₹{marketing.campaigns.costPerLead}</span>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="text-green-600" size={18} />
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lead Conversion Rate</p>
                    </div>
                    <h3 className="text-2xl font-extrabold text-emerald-700 mt-1">{marketing.campaigns.conversionRate}</h3>
                    <span className="text-xs text-gray-500 font-medium mt-1 block">{marketing.campaigns.totalConversions} Surgeries Booked</span>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      <Activity className="text-purple-600" size={18} />
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Direct Referral Revenue</p>
                    </div>
                    <h3 className="text-2xl font-extrabold text-purple-700 mt-1">{formatCurrency(marketing.referrals.totalRevenueGenerated)}</h3>
                    <span className="text-xs text-gray-500 font-medium mt-1 block">{marketing.referrals.totalPatientsReferred} Referred Patients</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Campaigns */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                    <h3 className="font-bold text-base text-gray-900">Top Performing Ad Campaigns</h3>
                    <div className="space-y-3">
                      {marketing.campaigns.topCampaigns.map((c, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm text-gray-900">{c.name}</p>
                            <p className="text-xs text-gray-500 font-medium">{c.platform} &bull; {c.department}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm text-blue-700">{c.leads_count} Leads</p>
                            <p className="text-xs font-bold text-emerald-700">{formatCurrency(Number(c.revenue_generated))}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Referring Doctor Partners */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                    <h3 className="font-bold text-base text-gray-900">Top Doctor Referral Partners</h3>
                    <div className="space-y-3">
                      {marketing.referrals.topPartners.map((d, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm text-gray-900">{d.name}</p>
                            <p className="text-xs text-gray-500 font-medium">{d.clinic_name} ({d.specialty})</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm text-purple-700">{d.patients_referred} Patients</p>
                            <p className="text-xs font-bold text-[#0B5E5E]">{formatCurrency(Number(d.revenue_generated))}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">Report Parameters</h3>
              <button onClick={() => setShowFilters(false)} className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors text-sm font-semibold">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Date Range</label>
                <select
                  value={tempDateRange}
                  onChange={(e) => setTempDateRange(e.target.value)}
                  className="cursor-pointer w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium"
                >
                  <option value="This Month">This Month</option>
                  <option value="Last Month">Last Month</option>
                  <option value="Q3 2026">Q3 2026</option>
                  <option value="Year to Date">Year to Date</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Department</label>
                <select
                  value={tempDept}
                  onChange={(e) => setTempDept(e.target.value)}
                  className="cursor-pointer w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium"
                >
                  <option value="All Departments">All Departments</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Orthopaedics">Orthopaedics</option>
                  <option value="Gynaecology">Gynaecology</option>
                  <option value="General Medicine">General Medicine</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 bg-gray-50/50 border-t border-gray-100">
              <button
                onClick={() => {
                  setTempDateRange("This Month");
                  setTempDept("All Departments");
                }}
                className="cursor-pointer px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  setDateRange(tempDateRange);
                  setDepartment(tempDept);
                  setShowFilters(false);
                  showToast('Parameters applied!');
                }}
                className="cursor-pointer px-5 py-2 text-xs font-bold text-white bg-[#0B5E5E] rounded-lg hover:bg-[#0B5E5E]/90"
              >
                Apply Parameters
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
