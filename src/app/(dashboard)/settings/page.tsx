"use client";

import React, { useState, useEffect, useCallback } from "react";
import { User, Shield, Bell, Link2, Building, Mail, Phone, MapPin, Save, RefreshCw, Plus, Key, CheckCircle, Trash2, X, Eye, EyeOff, MessageSquare, Share2, Smartphone, Send } from "lucide-react";
import { settingsApi, HospitalProfile, CrmUser, IntegrationItem } from "@/lib/api";

type SettingsTab = 'General' | 'Roles & Access' | 'Integrations';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('General');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Live Hospital Profile State
  const [profile, setProfile] = useState<HospitalProfile>({
    id: 'default',
    name: 'ApexCare Hospital & Research Centre',
    email: 'contact@apexcare.com',
    phone: '+91 1800 123 4567',
    address: '123 Health Ave, Mumbai, Maharashtra 400001, India',
  });

  // Roles & Access State
  const [users, setUsers] = useState<CrmUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  // Integrations State
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [configuringIntegration, setConfiguringIntegration] = useState<IntegrationItem | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  // New User Form State
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ADMIN',
    department: 'Administration',
    phone: '',
  });

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await settingsApi.getHospitalProfile();
      if (res.data) {
        setProfile(res.data);
      }
    } catch (err: unknown) {
      console.error("Failed to load hospital profile:", err);
      showToast("Could not load hospital profile from server");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const res = await settingsApi.getUsers();
      if (res.data) {
        setUsers(res.data);
      }
    } catch (err: unknown) {
      console.error("Failed to load CRM users:", err);
      showToast("Could not load users list");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadIntegrations = useCallback(async () => {
    try {
      setIntegrationsLoading(true);
      const res = await settingsApi.getIntegrations();
      if (res.data) {
        setIntegrations(res.data);
      }
    } catch (err: unknown) {
      console.error("Failed to load integrations:", err);
      showToast("Could not load integrations list");
    } finally {
      setIntegrationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'General') {
      loadProfile();
    } else if (activeTab === 'Roles & Access') {
      loadUsers();
    } else if (activeTab === 'Integrations') {
      loadIntegrations();
    }
  }, [activeTab, loadProfile, loadUsers, loadIntegrations]);

  const tabs: { name: SettingsTab, icon: React.ReactNode }[] = [
    { name: 'General', icon: <Building size={16} /> },
    { name: 'Roles & Access', icon: <Shield size={16} /> },
    { name: 'Integrations', icon: <Link2 size={16} /> },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'General') {
      try {
        setSaving(true);
        const res = await settingsApi.updateHospitalProfile(profile);
        if (res.data) {
          setProfile(res.data);
        }
        showToast("Hospital profile saved & updated successfully!");
      } catch (err: unknown) {
        console.error("Error updating hospital profile:", err);
        showToast("Failed to save changes. Please try again.");
      } finally {
        setSaving(false);
      }
    } else {
      showToast(`${activeTab} settings saved successfully!`);
    }
  };

  // Handle granting access to new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      showToast("Please fill all required fields");
      return;
    }

    try {
      setCreatingUser(true);
      const res = await settingsApi.createUser(newUser);
      if (res.data) {
        showToast(`Access granted! Login credentials dispatched to ${newUser.email}`);
        setShowInviteModal(false);
        setNewUser({
          name: '',
          email: '',
          password: '',
          role: 'ADMIN',
          department: 'Administration',
          phone: '',
        });
        loadUsers();
      }
    } catch (err: any) {
      console.error("Error granting user access:", err);
      showToast(err?.message || "Failed to create user access");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await settingsApi.updateUserRole(userId, { role: newRole });
      showToast(`User role updated to ${newRole}`);
      loadUsers();
    } catch (err: unknown) {
      console.error("Failed to update role:", err);
      showToast("Could not update user role");
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to revoke CRM access for ${userName}?`)) return;
    try {
      await settingsApi.deleteUser(userId);
      showToast(`Revoked CRM access for ${userName}`);
      loadUsers();
    } catch (err: any) {
      console.error("Failed to revoke user:", err);
      showToast(err?.message || "Could not delete user");
    }
  };

  const handleToggleIntegration = async (id: string, currentStatus: boolean) => {
    try {
      const res = await settingsApi.toggleIntegration(id, !currentStatus);
      if (res.data) {
        showToast(`${res.data.name} ${!currentStatus ? 'enabled' : 'disabled'} successfully!`);
        loadIntegrations();
      }
    } catch (err: any) {
      console.error("Failed to toggle integration:", err);
      showToast(err?.message || "Could not toggle integration");
    }
  };

  const handleSaveIntegrationConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configuringIntegration) return;

    try {
      setSavingConfig(true);
      const res = await settingsApi.updateIntegrationConfig(
        configuringIntegration.id,
        configuringIntegration.config || {}
      );
      if (res.data) {
        showToast(`${res.data.name} configuration updated and verified!`);
        setConfiguringIntegration(null);
        loadIntegrations();
      }
    } catch (err: any) {
      console.error("Failed to update integration config:", err);
      showToast(err?.message || "Could not save configuration");
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#F6F8F8] animate-in fade-in duration-300 relative">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B5E5E] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Area */}
      <div className="bg-white shrink-0 z-10 shadow-sm border-b border-gray-100">
        <header className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-10 py-4 md:py-6 gap-4 border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">Manage hospital profile, user roles, and system preferences</p>
          </div>
        </header>

        {/* Tabs */}
        <div className="px-4 md:px-10 flex items-center gap-4 md:gap-6 overflow-x-auto whitespace-nowrap scrollbar-hide pt-4">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`cursor-pointer px-4 py-2 mb-4 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === tab.name
                ? 'border-2 border-[#0B5E5E] text-[#0B5E5E] shadow-sm'
                : 'border-2 border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-10 scrollbar-hide">

        <div className={`mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 transition-all ${activeTab === 'General' ? 'max-w-4xl' : 'max-w-7xl'
          }`}>

          {activeTab === 'General' && (
            <form onSubmit={handleSave} className="animate-in fade-in slide-in-from-bottom-2">
              <div className="p-8 border-b border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Hospital Profile & Organization Details</h3>
                    <p className="text-xs text-gray-400 mt-0.5">This information appears on patient invoices, OPD receipts, and clinical reports.</p>
                  </div>
                  {loading && (
                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                      <RefreshCw size={12} className="animate-spin" /> Loading...
                    </span>
                  )}
                </div>

                {/* Static Hospital Logo / Brand Identity */}
                <div className="flex items-center gap-5 mb-8 p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/60">
                  <div className="w-16 h-16 rounded-xl bg-[#0B5E5E] flex flex-col items-center justify-center text-white shrink-0 shadow-sm">
                    <Building size={28} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900">{profile.name || 'ApexCare Hospital'}</h4>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Official Brand Identity & Emblem (Standard System Logo)</p>
                  </div>
                </div>

                {/* Only Name, Email, Phone Number, Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="cursor-pointer block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Hospital Name *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Building size={16} className="text-gray-400" /></div>
                      <input
                        type="text"
                        value={profile.name || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                        required
                        placeholder="e.g. ApexCare Hospital & Research Centre"
                        className="cursor-text w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="cursor-pointer block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Email Address *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Mail size={16} className="text-gray-400" /></div>
                      <input
                        type="email"
                        value={profile.email || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                        required
                        placeholder="e.g. contact@apexcare.com"
                        className="cursor-text w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="cursor-pointer block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Phone Number *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Phone size={16} className="text-gray-400" /></div>
                      <input
                        type="tel"
                        value={profile.phone || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                        required
                        placeholder="e.g. +91 1800 123 4567"
                        className="cursor-text w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20 font-medium"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="cursor-pointer block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Hospital Address *</label>
                    <div className="relative">
                      <div className="absolute top-3 left-3 flex items-start pointer-events-none"><MapPin size={16} className="text-gray-400" /></div>
                      <textarea
                        rows={3}
                        value={profile.address || ''}
                        onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                        required
                        placeholder="e.g. 123 Health Ave, Mumbai, Maharashtra 400001, India"
                        className="cursor-text w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20 font-medium resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-50/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={loadProfile}
                  disabled={loading || saving}
                  className="cursor-pointer px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="cursor-pointer flex items-center gap-2 px-6 py-2.5 bg-[#0B5E5E] text-white rounded-lg text-sm font-semibold hover:bg-[#0B5E5E]/90 transition-colors shadow-sm disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save size={16} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'Roles & Access' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <div className="p-8 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">User Management & Permissions</h3>
                    <p className="text-xs text-gray-400 mt-0.5">As Super Admin, provision access credentials for Admin and Marketing teams.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={loadUsers}
                      className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer"
                      title="Refresh users list"
                    >
                      <RefreshCw size={16} className={usersLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-[#0B5E5E] text-white rounded-lg text-xs font-bold hover:bg-[#0B5E5E]/90 transition-colors shadow-sm"
                    >
                      <Plus size={16} /> Grant User Access
                    </button>
                  </div>
                </div>

                {usersLoading ? (
                  <div className="p-12 text-center text-gray-400">
                    <RefreshCw className="animate-spin inline mr-2" size={16} /> Fetching CRM system users...
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-x-auto scrollbar-hide">
                    <table className="w-full min-w-max text-sm text-left">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-4 font-bold text-gray-600 text-xs uppercase tracking-wider">User Name</th>
                          <th className="px-6 py-4 font-bold text-gray-600 text-xs uppercase tracking-wider">Email Address</th>
                          <th className="px-6 py-4 font-bold text-gray-600 text-xs uppercase tracking-wider">Department</th>
                          <th className="px-6 py-4 font-bold text-gray-600 text-xs uppercase tracking-wider">Assigned Role</th>
                          <th className="px-6 py-4 font-bold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 font-bold text-gray-600 text-xs uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${user.role === 'SUPER_ADMIN' ? 'bg-amber-100 text-amber-800' :
                                user.role === 'MARKETING' ? 'bg-purple-100 text-purple-800' :
                                  user.role === 'ADMIN' ? 'bg-emerald-100 text-[#0B5E5E]' :
                                    'bg-blue-100 text-blue-800'
                                }`}>
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <span className="block font-semibold text-gray-900">{user.name}</span>
                                {user.role === 'SUPER_ADMIN' && (
                                  <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Master Access</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600 font-medium text-xs">{user.email}</td>
                            <td className="px-6 py-4 text-gray-500 font-medium text-xs">{user.department || 'General'}</td>
                            <td className="px-6 py-4">
                              {user.role === 'SUPER_ADMIN' ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200">
                                  <Shield size={12} /> Super Admin
                                </span>
                              ) : (
                                <select
                                  value={user.role}
                                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                  className="cursor-pointer px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20"
                                >
                                  <option value="ADMIN">Admin</option>
                                  <option value="MARKETING">Marketing Team</option>
                                  <option value="DOCTOR">Doctor</option>
                                  <option value="RECEPTIONIST">Receptionist</option>
                                </select>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {user.role !== 'SUPER_ADMIN' ? (
                                <button
                                  onClick={() => handleDeleteUser(user.id, user.name)}
                                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                                  title={`Revoke CRM portal access for ${user.name}`}
                                >
                                  <Trash2 size={13} />
                                  <span>Revoke Access</span>
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-400 font-semibold px-2 py-1 bg-gray-50 rounded-md">
                                  Owner
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}



          {activeTab === 'Integrations' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <div className="p-8 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Hospital Communications & Ecosystem Integrations</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Manage external channel gateways, real-time lead sync, and communication protocols.</p>
                  </div>
                  <button
                    onClick={loadIntegrations}
                    className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer self-start sm:self-auto"
                    title="Refresh integrations status"
                  >
                    <RefreshCw size={16} className={integrationsLoading ? 'animate-spin' : ''} />
                  </button>
                </div>

                {integrationsLoading ? (
                  <div className="p-12 text-center text-gray-400">
                    <RefreshCw className="animate-spin inline mr-2" size={16} /> Checking integration gateways...
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-5 py-4 font-bold text-gray-600 text-xs uppercase tracking-wider w-1/4">Gateway / Service</th>
                          <th className="px-5 py-4 font-bold text-gray-600 text-xs uppercase tracking-wider w-1/3">Purpose & Scope</th>
                          <th className="px-5 py-4 font-bold text-gray-600 text-xs uppercase tracking-wider">Active Configuration</th>
                          <th className="px-4 py-4 font-bold text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">Status</th>
                          <th className="px-4 py-4 font-bold text-gray-600 text-xs uppercase tracking-wider text-center whitespace-nowrap">Toggle</th>
                          <th className="px-5 py-4 font-bold text-gray-600 text-xs uppercase tracking-wider text-right whitespace-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {integrations.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  item.id === 'whatsapp_cloud' ? 'bg-emerald-50 text-emerald-600' :
                                  item.id === 'meta_ads' ? 'bg-blue-50 text-blue-600' :
                                  'bg-teal-50 text-[#0B5E5E]'
                                }`}>
                                  {item.id === 'whatsapp_cloud' && <MessageSquare size={18} />}
                                  {item.id === 'meta_ads' && <Share2 size={18} />}
                                  {item.id === 'email_smtp' && <Mail size={18} />}
                                </div>
                                <div>
                                  <span className="block font-semibold text-gray-900 text-sm">{item.name}</span>
                                  <span className="text-[11px] text-gray-400 font-mono">ID: {item.id}</span>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                                {item.description}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <div className="text-xs space-y-0.5">
                                {item.id === 'email_smtp' && (
                                  <div>
                                    <span className="text-gray-400">Sender: </span>
                                    <span className="font-semibold text-gray-900 font-mono">{item.config?.user || 'systemnotify00@gmail.com'}</span>
                                  </div>
                                )}
                                {item.id === 'whatsapp_cloud' && (
                                  <div>
                                    <span className="text-gray-400">Phone: </span>
                                    <span className="font-semibold text-gray-900 font-mono">{item.config?.phone || '+91 98765 43210'}</span>
                                  </div>
                                )}
                                {item.id === 'meta_ads' && (
                                  <div>
                                    <span className="text-gray-400">Page: </span>
                                    <span className="font-semibold text-gray-900">{item.config?.page || 'ApexCare Hospital Official'}</span>
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${item.is_enabled
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-gray-100 text-gray-500 border border-gray-200'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${item.is_enabled ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                                {item.status}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-center whitespace-nowrap">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={item.is_enabled}
                                  onChange={() => handleToggleIntegration(item.id, item.is_enabled)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B5E5E]"></div>
                              </label>
                            </td>

                            <td className="px-5 py-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setConfiguringIntegration({ ...item, config: { ...(item.config || {}) } })}
                                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0B5E5E] bg-emerald-50 hover:bg-emerald-100/80 rounded-lg transition-colors border border-emerald-100"
                                title={`Configure ${item.name}`}
                              >
                                <span>Configure</span>
                                <span>&rarr;</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Provision User Access Modal (Super Admin) */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0B5E5E] flex items-center justify-center">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Provision CRM Access</h3>
                  <p className="text-xs text-gray-400">Grant portal credentials for Admin or Marketing team</p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="cursor-pointer text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="cursor-pointer block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><User size={16} className="text-gray-400" /></div>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Sahil Sharma"
                    className="cursor-text w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="cursor-pointer block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Official Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Mail size={16} className="text-gray-400" /></div>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g. sahil.marketing@hospital.com"
                    className="cursor-text w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20 font-medium"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Credentials will be sent to this email address.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="cursor-pointer block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Assigned Role *
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => {
                      const r = e.target.value;
                      setNewUser(prev => ({
                        ...prev,
                        role: r,
                        department: r === 'MARKETING' ? 'Growth & Outreach' : 'Administration'
                      }));
                    }}
                    className="cursor-pointer w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20 font-semibold text-gray-800"
                  >
                    <option value="MARKETING">Marketing Team</option>
                    <option value="ADMIN">Hospital Admin</option>
                    <option value="DOCTOR">Doctor / Clinical</option>
                    <option value="RECEPTIONIST">Receptionist</option>
                  </select>
                </div>

                <div>
                  <label className="cursor-pointer block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newUser.department}
                    onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g. Marketing"
                    className="cursor-text w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="cursor-pointer block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Initial Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Key size={16} className="text-gray-400" /></div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Assign temporary password"
                    className="cursor-text w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B5E5E]/20 font-medium font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-start gap-2.5 text-xs text-[#0B5E5E]">
                <CheckCircle size={16} className="shrink-0 mt-0.5" />
                <span>
                  The user can immediately log in to <strong>http://localhost:3000</strong> using these credentials. An automated onboarding email is also dispatched.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="cursor-pointer px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-[#0B5E5E] text-white rounded-lg text-xs font-bold hover:bg-[#0B5E5E]/90 transition-colors shadow-sm disabled:opacity-60"
                >
                  {creatingUser ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Provisioning...
                    </>
                  ) : (
                    <>
                      <Key size={14} /> Send Credentials & Create Access
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Configure Integration Gateway Modal */}
      {configuringIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0B5E5E] flex items-center justify-center font-bold text-lg">
                  {configuringIntegration.id === 'whatsapp_cloud' && <MessageSquare size={20} />}
                  {configuringIntegration.id === 'meta_ads' && <Share2 size={20} />}
                  {configuringIntegration.id === 'email_smtp' && <Mail size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Configure {configuringIntegration.name}</h3>
                  <p className="text-xs text-gray-400">Production API parameters & gateway credentials</p>
                </div>
              </div>
              <button
                onClick={() => setConfiguringIntegration(null)}
                className="cursor-pointer text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveIntegrationConfig} className="p-6 space-y-4">
              {configuringIntegration.id === 'whatsapp_cloud' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      WhatsApp Business Phone Number
                    </label>
                    <input
                      type="text"
                      value={configuringIntegration.config?.phone || ''}
                      onChange={(e) => setConfiguringIntegration(prev => prev ? ({
                        ...prev,
                        config: { ...prev.config, phone: e.target.value }
                      }) : null)}
                      placeholder="+91 98765 43210"
                      className="cursor-text w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Meta WhatsApp Permanent Access Token
                    </label>
                    <input
                      type="password"
                      value={configuringIntegration.config?.access_token || 'EAABwzL123498...'}
                      onChange={(e) => setConfiguringIntegration(prev => prev ? ({
                        ...prev,
                        config: { ...prev.config, access_token: e.target.value }
                      }) : null)}
                      placeholder="Enter Meta Graph API Token"
                      className="cursor-text w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white font-mono"
                    />
                  </div>
                </>
              )}

              {configuringIntegration.id === 'meta_ads' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Facebook Page Name
                    </label>
                    <input
                      type="text"
                      value={configuringIntegration.config?.page || ''}
                      onChange={(e) => setConfiguringIntegration(prev => prev ? ({
                        ...prev,
                        config: { ...prev.config, page: e.target.value }
                      }) : null)}
                      placeholder="e.g. ApexCare Hospital Official"
                      className="cursor-text w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Meta Pixel / Ad Account ID
                    </label>
                    <input
                      type="text"
                      value={configuringIntegration.config?.pixel_id || ''}
                      onChange={(e) => setConfiguringIntegration(prev => prev ? ({
                        ...prev,
                        config: { ...prev.config, pixel_id: e.target.value }
                      }) : null)}
                      placeholder="act_982347102938471"
                      className="cursor-text w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white font-mono"
                    />
                  </div>
                </>
              )}

              {configuringIntegration.id === 'email_smtp' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      SMTP Host & Port
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        readOnly
                        value={configuringIntegration.config?.host || 'smtp.gmail.com'}
                        className="col-span-2 cursor-not-allowed bg-gray-50 px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600"
                      />
                      <input
                        type="text"
                        readOnly
                        value="Port 587"
                        className="cursor-not-allowed bg-gray-50 px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 text-center"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Verified Sender Email
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={configuringIntegration.config?.user || 'systemnotify00@gmail.com'}
                      className="cursor-not-allowed bg-gray-50 px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 w-full"
                    />
                  </div>
                </>
              )}

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-start gap-2 text-xs text-[#0B5E5E]">
                <CheckCircle size={15} className="shrink-0 mt-0.5" />
                <span>
                  Settings are stored securely in PostgreSQL and synchronized with production communication worker queues.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setConfiguringIntegration(null)}
                  className="cursor-pointer px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-[#0B5E5E] text-white rounded-lg text-xs font-bold hover:bg-[#0B5E5E]/90 transition-colors shadow-sm disabled:opacity-60"
                >
                  {savingConfig ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      <Save size={14} /> Save & Verify Connection
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
