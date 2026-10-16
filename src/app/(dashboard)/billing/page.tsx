"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, Filter, Plus, FileText, CheckCircle, Clock, AlertCircle, 
  Download, RefreshCw, ShieldCheck, CreditCard, ChevronRight, CheckCircle2 
} from "lucide-react";
import { billingApi, Bill, BillStatus, BillingSummary, patientApi, Patient } from "@/lib/api";

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState("");
  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals & Selection
  const [showFilters, setShowFilters] = useState(false);
  const [showAddBill, setShowAddBill] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Invoice Form state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [billType, setBillType] = useState("OPD");
  const [customBillType, setCustomBillType] = useState("");
  const [insurance, setInsurance] = useState("Self Pay");
  const [customInsurance, setCustomInsurance] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [grossAmount, setGrossAmount] = useState<number | "">("");
  const [discount, setDiscount] = useState<number | "">("");
  const [paidAmount, setPaidAmount] = useState<number | "">("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [billStatus, setBillStatus] = useState<BillStatus>("Estimate");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const tabs = ['All', 'Estimates', 'Pre-Auth', 'Active Claims', 'Settled & Dues'];

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [billsRes, summaryRes] = await Promise.all([
        billingApi.getAll({
          search: searchQuery || undefined,
          status: activeTab !== 'All' ? activeTab : undefined,
        }),
        billingApi.getSummary(),
      ]);

      if (billsRes.success && billsRes.data) {
        setBills(billsRes.data.invoices);
      }
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (err: any) {
      console.error("Failed to load billing records:", err);
      showToast("Error loading bills from server");
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load patients for New Bill modal
  const fetchPatients = async () => {
    try {
      const res = await patientApi.getAll({ limit: 50 });
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.patients || []);
        setPatients(list);
        if (list.length > 0 && !selectedPatientId) {
          setSelectedPatientId(list[0].uuid || list[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    }
  };

  const handleOpenAddBill = () => {
    fetchPatients();
    setShowAddBill(true);
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenPatient = patients.find(p => (p.uuid === selectedPatientId || p.id === selectedPatientId));
    if (!chosenPatient) {
      showToast("Please select a patient");
      return;
    }

    try {
      setIsSubmitting(true);
      const finalBillType = billType === 'Other' ? (customBillType.trim() || 'General Medical Service') : billType;
      const finalInsurance = insurance === 'Other' ? (customInsurance.trim() || 'Private TPA') : insurance;

      const res = await billingApi.create({
        patientId: chosenPatient.uuid || chosenPatient.id,
        patientName: chosenPatient.name,
        uhid: chosenPatient.uhid,
        billType: finalBillType,
        insurance: finalInsurance,
        policyNumber,
        grossAmount: Number(grossAmount) || 0,
        discount: Number(discount) || 0,
        paidAmount: Number(paidAmount) || 0,
        paymentMode,
        status: billStatus,
      });

      if (res.success) {
        showToast(`Invoice ${res.data?.invoiceNumber || ''} created successfully!`);
        setShowAddBill(false);
        // Reset form
        setGrossAmount("");
        setDiscount("");
        setPaidAmount("");
        setPolicyNumber("");
        setCustomBillType("");
        setCustomInsurance("");
        setBillType("OPD");
        setInsurance("Self Pay");
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (invoiceId: string, newStatus: string) => {
    try {
      setIsSubmitting(true);
      const res = await billingApi.updateStatus(invoiceId, { status: newStatus });
      if (res.success) {
        showToast(`Invoice updated to ${newStatus}`);
        setSelectedBill(null);
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusStyles = (status: BillStatus) => {
    switch (status) {
      case 'Settled': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Claim Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Estimate': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Pre-Auth': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Overdue': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  // 1. Real CSV / Excel Export
  const handleExport = () => {
    if (bills.length === 0) {
      showToast("No billing records to export");
      return;
    }

    const headers = ["Invoice ID", "Patient Name", "UHID", "Bill Type", "Insurance / Payer", "Gross Amount", "Discount", "Net Amount", "Paid Amount", "Due Amount", "Payment Mode", "Status", "Date", "TPA Claim Code"];
    const rows = bills.map(b => [
      `"${b.id}"`,
      `"${b.patient}"`,
      `"${b.uhid}"`,
      `"${b.type}"`,
      `"${b.insurance}"`,
      b.grossAmount || b.amount,
      b.discount || 0,
      b.amount,
      b.paidAmount,
      b.dueAmount,
      `"${b.paymentMode}"`,
      `"${b.status}"`,
      `"${b.date}"`,
      `"${b.claim?.claimCode || 'N/A'}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hospital_Billing_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Exported all billing records to CSV/Excel successfully!");
  };

  // 2. Real Professional Hospital Invoice Print & PDF Generator
  const handleDownloadPDF = (bill: Bill) => {
    const printWindow = window.open('', '_blank', 'width=850,height=900');
    if (!printWindow) {
      showToast("Please allow popups to download/print the invoice");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${bill.id} - Hospital CRM</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0B5E5E; padding-bottom: 20px; }
          .brand h1 { margin: 0; color: #0B5E5E; font-size: 24px; }
          .brand p { margin: 4px 0 0; color: #64748b; font-size: 13px; }
          .invoice-meta { text-align: right; }
          .invoice-meta h2 { margin: 0; font-size: 20px; color: #0f172a; }
          .invoice-meta p { margin: 3px 0; color: #64748b; font-size: 13px; }
          .info-grid { display: flex; justify-content: space-between; margin: 30px 0; background: #f8fafc; padding: 16px 20px; border-radius: 8px; }
          .info-box h4 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; }
          .info-box p { margin: 2px 0; font-size: 14px; font-weight: 600; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #0B5E5E; color: #ffffff; text-align: left; padding: 12px; font-size: 13px; }
          td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          .text-right { text-align: right; }
          .totals { width: 320px; margin-left: auto; margin-top: 25px; }
          .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #475569; }
          .totals-row.final { border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; font-weight: 800; font-size: 16px; color: #0B5E5E; padding: 10px 0; margin-top: 6px; }
          .tpa-box { margin-top: 30px; border: 1px solid #bfdbfe; background: #eff6ff; padding: 14px 18px; border-radius: 8px; font-size: 13px; }
          .footer { margin-top: 60px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; color: #94a3b8; font-size: 12px; }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">
            <h1>HOSPITAL CRM ENTERPRISE</h1>
            <p>Super Specialty Healthcare & Research Institute</p>
            <p>100 Feet Road, Indiranagar, Bengaluru - 560038</p>
            <p>Phone: +91 80 4912 3456 &bull; GSTIN: 29AABCH1234F1Z5</p>
          </div>
          <div class="invoice-meta">
            <h2>TAX INVOICE</h2>
            <p><strong>Invoice No:</strong> ${bill.id}</p>
            <p><strong>Date:</strong> ${bill.date}</p>
            <p><strong>Status:</strong> ${bill.status.toUpperCase()}</p>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <h4>Billed To (Patient)</h4>
            <p>${bill.patient}</p>
            <p style="font-family: monospace; font-weight: normal; color: #64748b;">UHID: ${bill.uhid}</p>
          </div>
          <div class="info-box">
            <h4>Billing Category</h4>
            <p>${bill.type}</p>
            <p style="font-weight: normal; color: #64748b;">Payment: ${bill.paymentMode}</p>
          </div>
          <div class="info-box">
            <h4>Insurance / Payer</h4>
            <p>${bill.insurance}</p>
            <p style="font-weight: normal; color: #64748b;">${bill.insurance !== 'Self Pay' ? 'Cashless / TPA' : 'Direct Patient Settlement'}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Sl.</th>
              <th>Description / Procedure / Package</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Rate (₹)</th>
              <th class="text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td><strong>${bill.type}</strong><br><span style="color: #64748b; font-size: 12px;">Healthcare services, medical care & room facilities</span></td>
              <td class="text-right">1</td>
              <td class="text-right">${(bill.grossAmount || bill.amount).toLocaleString('en-IN')}</td>
              <td class="text-right">${(bill.grossAmount || bill.amount).toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Gross Total:</span>
            <span>₹${(bill.grossAmount || bill.amount).toLocaleString('en-IN')}</span>
          </div>
          <div class="totals-row">
            <span>Discount / Concession:</span>
            <span>- ₹${(bill.discount || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="totals-row final">
            <span>Net Payable:</span>
            <span>₹${bill.amount.toLocaleString('en-IN')}</span>
          </div>
          <div class="totals-row" style="color: #15803d; font-weight: 600;">
            <span>Amount Paid:</span>
            <span>₹${bill.paidAmount.toLocaleString('en-IN')}</span>
          </div>
          ${bill.dueAmount > 0 ? `
            <div class="totals-row" style="color: #b91c1c; font-weight: 700;">
              <span>Balance Due:</span>
              <span>₹${bill.dueAmount.toLocaleString('en-IN')}</span>
            </div>
          ` : ''}
        </div>

        ${bill.claim ? `
          <div class="tpa-box">
            <strong>Cashless TPA Claim Details:</strong><br>
            Insurer / TPA: <b>${bill.insurance}</b> &bull; Claim Code: <b>${bill.claim.claimCode}</b> &bull; Policy No: <b>${bill.claim.policyNumber || 'N/A'}</b><br>
            Pre-Auth Approved Limit: <b>₹${bill.claim.approvedAmount.toLocaleString('en-IN')}</b> &bull; Claim Status: <b>${bill.claim.status}</b>
          </div>
        ` : ''}

        <div class="footer">
          <p>This is a computer-generated tax invoice and requires no physical signature.</p>
          <p>Thank you for choosing Hospital CRM. For billing queries, contact accounts@hospitalcrm.com</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="h-full flex flex-col bg-[#F6F8F8] animate-in fade-in duration-300 relative">
      
      {/* Header Area */}
      <div className="bg-white shrink-0 z-10 shadow-sm border-b border-gray-100">
        <header className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-10 pt-4 md:pt-8 pb-4 md:pb-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Billing & TPA Desk</h1>
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#0B5E5E] bg-[#E7F4EE] px-2.5 py-1 rounded-full">
                <ShieldCheck size={14} /> Cashless & TPA Portal
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1 font-medium">Manage Surgical Estimates, Pre-Auth Approvals, Claims & Patient Dues</p>
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
                placeholder="Search invoice, patient, UHID..."
                className="cursor-text pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full md:w-72 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20 font-medium"
              />
            </div>

            <button 
              onClick={() => { loadData(); showToast("Refreshed billing records"); }}
              className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>

            <button 
              onClick={handleExport}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download size={16} /> Export
            </button>

            <button 
              onClick={handleOpenAddBill}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-[#0B5E5E] text-white rounded-lg text-sm font-semibold hover:bg-[#0B5E5E]/90 transition-colors shadow-sm"
            >
              <Plus size={16} /> New Invoice / Estimate
            </button>
          </div>
        </header>

        {/* Quick KPI Ribbon */}
        {summary && (
          <div className="px-4 md:px-10 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase">Total Invoiced</span>
                <p className="text-lg font-extrabold text-gray-900">{formatCurrency(summary.totalBilled)}</p>
              </div>
              <CreditCard className="text-gray-400" size={20} />
            </div>

            <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase">Collected Revenue</span>
                <p className="text-lg font-extrabold text-emerald-800">{formatCurrency(summary.totalCollected)}</p>
              </div>
              <CheckCircle className="text-emerald-600" size={20} />
            </div>

            <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-700 uppercase">Active Claims</span>
                <p className="text-lg font-extrabold text-amber-800">{summary.countClaimsPending + summary.countPreAuth} Pending</p>
              </div>
              <Clock className="text-amber-600" size={20} />
            </div>

            <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-rose-700 uppercase">Outstanding Dues</span>
                <p className="text-lg font-extrabold text-rose-800">{formatCurrency(summary.totalOutstanding)}</p>
              </div>
              <AlertCircle className="text-rose-600" size={20} />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="px-4 md:px-10 pb-4 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                activeTab === tab
                  ? 'bg-[#0B5E5E] text-white border-[#0B5E5E] shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 overflow-auto p-4 md:p-10 scrollbar-hide">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto scrollbar-hide">
          <table className="w-full min-w-max text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50/70 text-gray-600 font-bold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Invoice / Estimate ID</th>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Bill Type</th>
                <th className="px-6 py-4">Insurance / Payer</th>
                <th className="px-6 py-4">Net Amount</th>
                <th className="px-6 py-4">Paid / Due</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-400">
                    <RefreshCw size={20} className="animate-spin inline mr-2 text-[#0B5E5E]" /> Loading billing ledger...
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-500 font-medium">
                    No billing records found matching your query.
                  </td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr 
                    key={bill.id} 
                    onClick={() => setSelectedBill(bill)}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-gray-900">
                      {bill.id}
                      {bill.claim && (
                        <span className="block text-[11px] font-normal text-[#0B5E5E]">
                          {bill.claim.claimCode}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{bill.patient}</div>
                      <div className="text-xs text-gray-400 font-mono">UHID: {bill.uhid}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-700">
                      {bill.type}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                        bill.insurance === 'Self Pay' 
                          ? 'bg-gray-100 text-gray-700' 
                          : 'bg-blue-50 text-blue-700 border border-blue-100 font-bold'
                      }`}>
                        {bill.insurance !== 'Self Pay' && <ShieldCheck size={12} />}
                        {bill.insurance}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {formatCurrency(bill.amount)}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium">
                      <span className="text-emerald-700 font-semibold">{formatCurrency(bill.paidAmount)}</span>
                      {bill.dueAmount > 0 && (
                        <span className="text-rose-600 block">Due: {formatCurrency(bill.dueAmount)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium text-xs">
                      {bill.date}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyles(bill.status)}`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPDF(bill);
                          }}
                          className="p-1.5 text-gray-400 hover:text-[#0B5E5E] hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                          title="Print / Download PDF"
                        >
                          <Download size={15} />
                        </button>
                        <button className="text-gray-400 group-hover:text-[#0B5E5E] transition-colors p-1 cursor-pointer">
                          <ChevronRight size={18} />
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

      {/* 1. Add Bill Modal */}
      {showAddBill && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-gray-100">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-[#0B5E5E]/5">
              <div>
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <Plus size={20} className="text-[#0B5E5E]" /> Generate Invoice / Cost Estimate
                </h3>
                <p className="text-xs text-gray-500">OPD Consultation, IPD Package, or TPA Pre-Auth</p>
              </div>
              <button onClick={() => setShowAddBill(false)} className="text-gray-400 hover:text-gray-600 text-sm font-semibold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateBill} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Select Registered Patient
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20 cursor-pointer"
                  required
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.uuid || p.id}>
                      {p.name} &bull; UHID: {p.uhid} ({p.department || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Bill Type</label>
                  <select 
                    value={billType} 
                    onChange={(e) => setBillType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium cursor-pointer"
                  >
                    <option value="OPD">OPD Consultation</option>
                    <option value="IPD - General Ward">IPD - General Ward</option>
                    <option value="IPD - ICU Stay">IPD - ICU Stay</option>
                    <option value="IPD - TKR">IPD - TKR Surgery</option>
                    <option value="IPD - Maternity">IPD - Maternity</option>
                    <option value="Surgery Estimate">Surgery Estimate</option>
                    <option value="Diagnostics">Diagnostics & Imaging</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Emergency & Daycare">Emergency & Daycare</option>
                    <option value="Other">+ Other / Custom Procedure...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Insurance / TPA Payer</label>
                  <select 
                    value={insurance} 
                    onChange={(e) => setInsurance(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium cursor-pointer"
                  >
                    <option value="Self Pay">Self Pay / Cash</option>
                    <option value="Star Health">Star Health</option>
                    <option value="HDFC Ergo">HDFC Ergo</option>
                    <option value="ICICI Lombard">ICICI Lombard</option>
                    <option value="Care Health">Care Health</option>
                    <option value="Medi Assist">Medi Assist TPA</option>
                    <option value="Vidal Health">Vidal Health TPA</option>
                    <option value="Bajaj Allianz">Bajaj Allianz</option>
                    <option value="Niva Bupa">Niva Bupa Health</option>
                    <option value="Corporate / Ayushman">Corporate / Ayushman Bharat</option>
                    <option value="Other">+ Other TPA / Corporate...</option>
                  </select>
                </div>
              </div>

              {/* Conditional Custom Bill Type Input */}
              {billType === 'Other' && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="block text-xs font-bold text-[#0B5E5E] uppercase tracking-wider mb-1.5">
                    Specify Custom Bill Type / Procedure Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customBillType}
                    onChange={(e) => setCustomBillType(e.target.value)}
                    placeholder="e.g. Laparoscopic Cholecystectomy, Dental Implant Package"
                    className="w-full px-3 py-2 border border-[#0B5E5E]/40 rounded-lg text-sm bg-emerald-50/20 font-medium focus:ring-2 focus:ring-[#0B5E5E]/20"
                  />
                </div>
              )}

              {/* Conditional Custom Insurance Input */}
              {insurance === 'Other' && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="block text-xs font-bold text-blue-700 uppercase tracking-wider mb-1.5">
                    Specify Insurance Provider / Corporate Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customInsurance}
                    onChange={(e) => setCustomInsurance(e.target.value)}
                    placeholder="e.g. Tata AIG, Paramount TPA, Infosys Corporate Credit"
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm bg-blue-50/20 font-medium focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              )}

              {insurance !== 'Self Pay' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">TPA Policy / Card Number</label>
                  <input
                    type="text"
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    placeholder="e.g. SH-POL-992810"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-[#0B5E5E]/20"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Gross (₹)</label>
                  <input 
                    type="number" 
                    required 
                    value={grossAmount}
                    onChange={(e) => setGrossAmount(Number(e.target.value))}
                    placeholder="0.00" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Discount (₹)</label>
                  <input 
                    type="number" 
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    placeholder="0.00" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Paid Now (₹)</label>
                  <input 
                    type="number" 
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    placeholder="0.00" 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Payment Mode</label>
                  <select 
                    value={paymentMode} 
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium"
                  >
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Credit Card</option>
                    <option>TPA Insurance</option>
                    <option>Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Billing Stage</label>
                  <select 
                    value={billStatus} 
                    onChange={(e) => setBillStatus(e.target.value as BillStatus)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium"
                  >
                    <option value="Estimate">Estimate</option>
                    <option value="Pre-Auth">Pre-Auth</option>
                    <option value="Claim Pending">Claim Pending</option>
                    <option value="Settled">Settled</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowAddBill(false)} 
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0B5E5E] rounded-lg hover:bg-[#0B5E5E]/90 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Generating..." : "Generate Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Invoice Details & TPA Actions Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-gray-100">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                  <FileText className="text-[#0B5E5E]" size={22} /> {selectedBill.id}
                </h3>
                <p className="text-xs text-gray-500 mt-1 font-mono">{selectedBill.date} &middot; UHID: {selectedBill.uhid}</p>
              </div>
              <button onClick={() => setSelectedBill(null)} className="cursor-pointer text-gray-400 hover:text-gray-600 text-sm font-semibold">✕</button>
            </div>
            
            <div className="p-6 bg-[#F6F8F8] space-y-4">
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Patient Details</p>
                  <p className="font-bold text-gray-900 text-base">{selectedBill.patient}</p>
                  <p className="text-xs text-gray-500 font-mono">UHID: {selectedBill.uhid}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Invoice Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyles(selectedBill.status)}`}>
                    {selectedBill.status}
                  </span>
                </div>
              </div>

              {/* TPA Cashless Claim Info */}
              {selectedBill.claim && (
                <div className="bg-blue-50/80 p-5 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between mb-3 border-b border-blue-100 pb-2">
                    <span className="text-xs font-bold text-blue-900 uppercase flex items-center gap-1.5">
                      <ShieldCheck size={15} /> Cashless TPA Claim #{selectedBill.claim.claimCode}
                    </span>
                    <span className="text-xs font-semibold bg-white text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                      {selectedBill.claim.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500 block">Payer / Insurer:</span>
                      <span className="font-bold text-gray-900">{selectedBill.insurance}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Policy Number:</span>
                      <span className="font-mono text-gray-900">{selectedBill.claim.policyNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Approved Limit:</span>
                      <span className="font-bold text-emerald-700">{formatCurrency(selectedBill.claim.approvedAmount)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount Breakdown */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="font-bold text-gray-900 text-sm mb-3 border-b border-gray-50 pb-2">Financial Breakdown</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Gross Total</span>
                    <span>{formatCurrency(selectedBill.grossAmount || selectedBill.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Discount</span>
                    <span>- {formatCurrency(selectedBill.discount || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-900 font-bold text-sm pt-2 border-t border-gray-100">
                    <span>Net Billable</span>
                    <span className="text-[#0B5E5E]">{formatCurrency(selectedBill.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 text-emerald-700 font-semibold">
                    <span>Paid Amount ({selectedBill.paymentMode})</span>
                    <span>{formatCurrency(selectedBill.paidAmount)}</span>
                  </div>
                  {selectedBill.dueAmount > 0 && (
                    <div className="flex justify-between items-center text-rose-600 font-bold">
                      <span>Outstanding Due</span>
                      <span>{formatCurrency(selectedBill.dueAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Status Action Controls */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-gray-600">Update Stage:</span>
                <div className="flex items-center gap-2">
                  {selectedBill.status !== 'Pre-Auth' && selectedBill.insurance !== 'Self Pay' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedBill.id, 'Pre-Auth')}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-lg border border-blue-200 cursor-pointer"
                    >
                      Pre-Auth Approved
                    </button>
                  )}
                  {selectedBill.status !== 'Claim Pending' && selectedBill.insurance !== 'Self Pay' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedBill.id, 'Claim Pending')}
                      className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold rounded-lg border border-amber-200 cursor-pointer"
                    >
                      Claim Submitted
                    </button>
                  )}
                  {selectedBill.status !== 'Settled' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedBill.id, 'Settled')}
                      className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Mark Settled
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 bg-white border-t border-gray-100">
              <button 
                onClick={() => handleDownloadPDF(selectedBill)}
                className="cursor-pointer px-4 py-2 text-xs font-bold bg-[#0B5E5E] text-white rounded-lg hover:bg-[#0B5E5E]/90 flex items-center gap-2 shadow-xs transition-colors"
              >
                <Download size={14} /> Print / Download PDF
              </button>
              <button 
                onClick={() => setSelectedBill(null)}
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
