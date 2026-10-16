const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'BILLING' | 'MARKETING';
  department?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }> | any;
}

class ApiError extends Error {
  statusCode: number;
  errors?: any;

  constructor(message: string, statusCode: number, errors?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

/**
 * Core HTTP Request Wrapper
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const token = typeof window !== 'undefined' ? localStorage.getItem('hospital_crm_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await res.json().catch(() => ({
      success: false,
      message: 'Network response could not be parsed',
    }));

    if (!res.ok) {
      if (res.status === 401 && typeof window !== 'undefined') {
        // Token expired or invalid
        if (!endpoint.includes('/auth/login')) {
          localStorage.removeItem('hospital_crm_token');
          localStorage.removeItem('hospital_crm_refresh_token');
          localStorage.removeItem('hospital_crm_user');
          if (typeof document !== 'undefined') {
            document.cookie = 'hospital_crm_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          }
          window.location.href = '/login';
        }
      }
      throw new ApiError(data.message || 'An error occurred during request', res.status, data.errors);
    }

    return data;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Unable to connect to hospital server', 500);
  }
}

/**
 * Authentication Service APIs
 */
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    return apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  getMe: async () => {
    return apiClient<User>('/auth/me', {
      method: 'GET',
    });
  },

  logout: async () => {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('hospital_crm_refresh_token') : null;
    return apiClient('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }).catch(() => null);
  },
};

export interface Patient {
  id: string;
  uuid?: string;
  uhid: string;
  name: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
  gender?: string;
  genderAge: string;
  contact: string;
  email?: string | null;
  abha: 'Linked' | 'Pending';
  department?: string;
  source?: string;
  status: string;
  statusType: 'primary' | 'neutral' | 'warning' | 'alert' | 'success';
  lastVisit: string;
  createdAt?: string;
}

export interface PatientsResponse {
  patients: Patient[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Patients Management APIs
 */
export const patientApi = {
  getAll: async (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    return apiClient<PatientsResponse>(`/patients?${query.toString()}`);
  },

  getById: async (id: string) => {
    return apiClient<Patient>(`/patients/${id}`);
  },

  getProfile360: async (id: string) => {
    return apiClient<any>(`/patients/${id}/profile-360`);
  },

  create: async (data: {
    firstName: string;
    lastName?: string;
    dob: string;
    gender: string;
    phone: string;
    email?: string;
    department?: string;
    source?: string;
  }) => {
    return apiClient<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<{
    firstName: string;
    lastName: string;
    dob: string;
    gender: string;
    phone: string;
    email: string;
    abha: 'Linked' | 'Pending';
    department: string;
    source: string;
    status: string;
    statusType: string;
  }>) => {
    return apiClient<Patient>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiClient(`/patients/${id}`, {
      method: 'DELETE',
    });
  },
};

export interface Doctor {
  id: string;
  uuid?: string;
  doctorCode: string;
  name: string;
  specialty: string;
  department: string;
  qualification?: string;
  registrationNo?: string;
  phone: string;
  email?: string | null;
  opdRoom?: string;
  consultationFee: number;
  availableTiming?: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  patientsAttended: number;
  createdAt?: string;
}

/**
 * Doctors Management APIs
 */
export const doctorApi = {
  getAll: async (params?: { search?: string; department?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.department) query.set('department', params.department);
    if (params?.status) query.set('status', params.status);

    return apiClient<Doctor[]>(`/doctors?${query.toString()}`);
  },

  getById: async (id: string) => {
    return apiClient<Doctor>(`/doctors/${id}`);
  },

  create: async (data: {
    name: string;
    specialty: string;
    department: string;
    qualification?: string;
    registrationNo?: string;
    phone: string;
    email?: string;
    opdRoom?: string;
    consultationFee?: number;
    availableTiming?: string;
    status?: string;
  }) => {
    return apiClient<Doctor>('/doctors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<Doctor>) => {
    return apiClient<Doctor>(`/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiClient(`/doctors/${id}`, {
      method: 'DELETE',
    });
  },
};

export interface Appointment {
  id: string;
  uuid?: string;
  code?: string;
  time: string;
  timeSlot?: string;
  date?: string;
  patient: string;
  patientName?: string;
  patientUhid?: string | null;
  patientId?: string | null;
  doctor: string;
  doctorName?: string;
  doctorId?: string | null;
  dept: string;
  department?: string;
  source: string;
  status: string;
  statusType: 'primary' | 'success' | 'warning' | 'neutral' | 'alert';
  notes?: string | null;
  createdAt?: string;
}

/**
 * Appointments Management APIs
 */
export const appointmentApi = {
  getAll: async (params?: { search?: string; status?: string; doctor?: string; date?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.doctor) query.set('doctor', params.doctor);
    if (params?.date) query.set('date', params.date);

    return apiClient<Appointment[]>(`/appointments?${query.toString()}`);
  },

  getById: async (id: string) => {
    return apiClient<Appointment>(`/appointments/${id}`);
  },

  book: async (data: {
    patientName: string;
    patientUhid?: string;
    patientId?: string;
    doctorName: string;
    doctorId?: string;
    department: string;
    appointmentDate: string;
    timeSlot: string;
    source?: string;
    status?: string;
    statusType?: string;
    notes?: string;
  }) => {
    return apiClient<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<{
    status: string;
    statusType: string;
    timeSlot: string;
    appointmentDate: string;
    doctorName: string;
    notes: string;
  }>) => {
    return apiClient<Appointment>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  cancel: async (id: string) => {
    return apiClient(`/appointments/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Lead & Enquiries Model
 */
export interface Lead {
  id: string;
  uuid?: string;
  leadCode?: string;
  name: string;
  phone?: string;
  email?: string;
  treatment: string;
  source?: string;
  stage: 'new' | 'contacted' | 'quote' | 'visited' | 'wonLost';
  priority?: string;
  estimatedValue?: number;
  tag?: string;
  tagType?: 'primary' | 'warning' | 'success' | 'alert' | 'neutral';
  notes?: string;
  assignedTo?: string;
  meta?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type KanbanBoardData = {
  new: Lead[];
  contacted: Lead[];
  quote: Lead[];
  visited: Lead[];
  wonLost: Lead[];
};

/**
 * Leads & Enquiries APIs
 */
export const leadApi = {
  getAll: async (params?: { search?: string; stage?: string; source?: string; priority?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.stage) query.set('stage', params.stage);
    if (params?.source) query.set('source', params.source);
    if (params?.priority) query.set('priority', params.priority);

    return apiClient<Lead[]>(`/leads?${query.toString()}`);
  },

  getBoard: async (params?: { search?: string; source?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.source) query.set('source', params.source);

    return apiClient<KanbanBoardData>(`/leads/board?${query.toString()}`);
  },

  getById: async (id: string) => {
    return apiClient<Lead>(`/leads/${id}`);
  },

  create: async (data: {
    name: string;
    treatment: string;
    source?: string;
    phone?: string;
    email?: string;
    priority?: string;
    stage?: string;
    estimatedValue?: number;
    notes?: string;
    tag?: string;
    tagType?: string;
  }) => {
    return apiClient<Lead>('/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<Lead>) => {
    return apiClient<Lead>(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateStage: async (id: string, stage: string) => {
    return apiClient<Lead>(`/leads/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage }),
    });
  },

  convertToPatient: async (id: string, data?: {
    firstName?: string;
    lastName?: string;
    dob?: string;
    gender?: string;
    phone?: string;
    email?: string;
    department?: string;
  }) => {
    return apiClient<{ lead: Lead; patient: Patient }>(`/leads/${id}/convert`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  delete: async (id: string) => {
    return apiClient(`/leads/${id}`, {
      method: 'DELETE',
    });
  },
};

export interface Ward {
  id: string;
  code: string;
  name: string;
  floor: string;
  wardType: string;
  department: string;
  dailyRate: number;
  totalBeds: number;
  occupied: number;
  vacant: number;
  cleaning: number;
  dischargeToday: number;
  critical: number;
}

export interface Bed {
  id: string;
  bedNumber: string;
  status: 'occupied' | 'vacant' | 'cleaning' | 'discharge' | 'critical';
  dailyRate: number;
  wardId: string;
  wardName: string;
  wardCode: string;
  floor: string;
  wardType: string;
  department: string;
  admission?: {
    id: string;
    admissionNumber: string;
    admittedAt: string;
    expectedDischarge?: string;
    diagnosis?: string;
    doctorName?: string;
    patient?: {
      id: string;
      name: string;
      uhid: string;
      gender: string;
      contact: string;
    };
  } | null;
}

export interface BedSummary {
  totalBeds: number;
  occupied: number;
  vacant: number;
  cleaning: number;
  dischargeToday: number;
  critical: number;
  occupancyRate: string;
}

export const bedsApi = {
  getWards: async () => {
    return apiClient<Ward[]>('/beds/wards');
  },

  getBeds: async (params?: { wardId?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.wardId) query.append('wardId', params.wardId);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString();
    return apiClient<Bed[]>(`/beds${qs ? `?${qs}` : ''}`);
  },

  getSummary: async () => {
    return apiClient<BedSummary>('/beds/summary');
  },

  admitPatient: async (data: {
    bedId: string;
    patientId: string;
    doctorId?: string;
    doctorName?: string;
    diagnosis?: string;
    notes?: string;
    expectedDischarge?: string;
  }) => {
    return apiClient('/beds/admit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  transferPatient: async (data: { currentBedId: string; newBedId: string; notes?: string }) => {
    return apiClient('/beds/transfer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  dischargePatient: async (bedId: string, dischargeNotes?: string) => {
    return apiClient(`/beds/${bedId}/discharge`, {
      method: 'POST',
      body: JSON.stringify({ dischargeNotes }),
    });
  },

  markBedClean: async (bedId: string) => {
    return apiClient(`/beds/${bedId}/clean`, {
      method: 'PATCH',
    });
  },

  updateStatus: async (bedId: string, status: string) => {
    return apiClient(`/beds/${bedId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

export type BillStatus = 'Estimate' | 'Pre-Auth' | 'Claim Pending' | 'Settled' | 'Overdue';

export interface Bill {
  id: string;
  uuid?: string;
  invoiceNumber: string;
  patient: string;
  patientId?: string;
  uhid: string;
  type: string;
  insurance: string;
  grossAmount: number;
  discount: number;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  paymentMode: string;
  status: BillStatus;
  date: string;
  claim?: {
    id: string;
    claimCode: string;
    policyNumber?: string;
    requestedAmount: number;
    approvedAmount: number;
    status: string;
  } | null;
}

export interface BillingSummary {
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  countEstimates: number;
  countPreAuth: number;
  countClaimsPending: number;
  countSettled: number;
  countOverdue: number;
}

export const billingApi = {
  getAll: async (params?: { search?: string; status?: string; type?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.type) query.append('type', params.type);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const qs = query.toString();
    return apiClient<{ invoices: Bill[]; pagination: { total: number; page: number; totalPages: number } }>(
      `/billing${qs ? `?${qs}` : ''}`
    );
  },

  getSummary: async () => {
    return apiClient<BillingSummary>('/billing/summary');
  },

  create: async (data: {
    patientId?: string;
    patientName: string;
    uhid?: string;
    billType?: string;
    insurance?: string;
    grossAmount: number;
    discount?: number;
    paidAmount?: number;
    paymentMode?: string;
    status?: string;
    notes?: string;
    policyNumber?: string;
  }) => {
    return apiClient<Bill>('/billing', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (id: string, data: { status: string; paidAmount?: number }) => {
    return apiClient<Bill>(`/billing/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

export type CampaignStatus = 'Active' | 'Paused' | 'Completed';

export interface Campaign {
  id: string;
  uuid?: string;
  campaignCode: string;
  name: string;
  platform: string;
  department: string;
  status: CampaignStatus;
  budget: number;
  spend: number;
  leads: number;
  conversions: number;
  revenue?: number;
  roiMultiplier?: number;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface CampaignSummary {
  totalBudget: number;
  totalSpend: number;
  totalLeads: number;
  totalConversions: number;
  totalRevenue: number;
  overallRoi: string;
  activeCampaigns: number;
  pausedCampaigns: number;
  completedCampaigns: number;
}

export const campaignApi = {
  getAll: async (params?: { search?: string; status?: string; platform?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.platform) query.append('platform', params.platform);
    const qs = query.toString();
    return apiClient<Campaign[]>(`/campaigns${qs ? `?${qs}` : ''}`);
  },

  getSummary: async () => {
    return apiClient<CampaignSummary>('/campaigns/summary');
  },

  create: async (data: {
    name: string;
    platform: string;
    department?: string;
    budget: number;
    spend?: number;
    status?: string;
    notes?: string;
  }) => {
    return apiClient<Campaign>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (id: string, status: CampaignStatus) => {
    return apiClient<Campaign>(`/campaigns/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  update: async (id: string, data: Partial<Campaign>) => {
    return apiClient<Campaign>(`/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiClient(`/campaigns/${id}`, {
      method: 'DELETE',
    });
  },
};

// Referring Doctors & Network Types
export type ReferralDoctorStatus = 'Active' | 'Inactive' | 'Pending';

export interface ReferringDoctor {
  id: string;
  uuid: string;
  doctorCode: string;
  name: string;
  specialty: string;
  clinic: string;
  phone: string;
  email: string;
  city: string;
  patientsReferred: number;
  revenueGenerated: number;
  commissionRate: number;
  status: ReferralDoctorStatus;
  notes?: string;
  recentCases?: Array<{
    id: string;
    patient_name: string;
    procedure_name: string;
    bill_amount: number;
    referral_fee: number;
    referral_date: string;
    status: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReferralSummary {
  totalDoctors: number;
  totalPatientsReferred: number;
  totalRevenueGenerated: number;
  activeDoctors: number;
  pendingDoctors: number;
  inactiveDoctors: number;
  topPerformer?: {
    name: string;
    clinic_name: string;
    patients_referred: number;
    revenue_generated: number;
  } | null;
}

export const referralApi = {
  getAll: async (params?: { search?: string; specialty?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.specialty) query.append('specialty', params.specialty);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString();
    return apiClient<ReferringDoctor[]>(`/referrals${qs ? `?${qs}` : ''}`);
  },

  getSummary: async () => {
    return apiClient<ReferralSummary>('/referrals/summary');
  },

  getById: async (id: string) => {
    return apiClient<ReferringDoctor>(`/referrals/${id}`);
  },

  create: async (data: {
    name: string;
    specialty: string;
    clinic: string;
    phone: string;
    email?: string;
    city?: string;
    status?: ReferralDoctorStatus;
    commissionRate?: number;
    notes?: string;
  }) => {
    return apiClient<ReferringDoctor>('/referrals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<ReferringDoctor>) => {
    return apiClient<ReferringDoctor>(`/referrals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiClient(`/referrals/${id}`, {
      method: 'DELETE',
    });
  },

  logCase: async (id: string, data: {
    patientName: string;
    procedureName?: string;
    billAmount: number;
    commissionRate?: number;
    referralDate?: string;
    status?: string;
  }) => {
    return apiClient<any>(`/referrals/${id}/cases`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Reports & Analytics Types
export interface FinancialReport {
  totalRevenue: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionRatio: number;
  totalInvoices: number;
  tpa: {
    totalRequested: number;
    totalApproved: number;
    pendingAmount: number;
    totalClaims: number;
    settledClaims: number;
  };
  avgRevenuePerBed: number;
  departmentBreakdown: Array<{
    department: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
}

export interface OperationalReport {
  beds: {
    total: number;
    occupied: number;
    vacant: number;
    cleaning: number;
    discharge: number;
    critical: number;
    occupancyRate: number;
  };
  averageLengthOfStayDays: number;
  avgOpdWaitTimeMins: number;
  wards: Array<{
    id: string;
    code: string;
    name: string;
    type: string;
    department: string;
    totalBeds: number;
    occupiedBeds: number;
    occupancyRate: number;
  }>;
  appointments: {
    total: number;
    completed: number;
    scheduled: number;
    cancelled: number;
  };
  totalRegisteredPatients: number;
}

export interface MarketingReport {
  campaigns: {
    total: number;
    totalBudget: number;
    totalSpend: number;
    totalLeads: number;
    totalConversions: number;
    totalRevenue: number;
    conversionRate: string;
    costPerLead: number;
    costPerAcquisition: number;
    roas: string;
    topCampaigns: Array<{
      name: string;
      platform: string;
      department: string;
      leads_count: number;
      spend: number;
      conversions_count: number;
      revenue_generated: number;
    }>;
  };
  referrals: {
    totalDoctors: number;
    totalPatientsReferred: number;
    totalRevenueGenerated: number;
    topPartners: Array<{
      name: string;
      clinic_name: string;
      specialty: string;
      patients_referred: number;
      revenue_generated: number;
    }>;
  };
}

export const reportApi = {
  getFinancial: async (params?: { dateRange?: string; department?: string }) => {
    const query = new URLSearchParams();
    if (params?.dateRange) query.append('dateRange', params.dateRange);
    if (params?.department) query.append('department', params.department);
    const qs = query.toString();
    return apiClient<FinancialReport>(`/reports/financial${qs ? `?${qs}` : ''}`);
  },

  getOperational: async () => {
    return apiClient<OperationalReport>('/reports/operational');
  },

  getMarketing: async () => {
    return apiClient<MarketingReport>('/reports/marketing');
  },

  getExecutive: async () => {
    return apiClient<{
      financial: FinancialReport;
      operational: OperationalReport;
      marketing: MarketingReport;
      generatedAt: string;
    }>('/reports/executive');
  },
};

/**
 * Settings & Hospital Profile APIs
 */
export interface HospitalProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  updated_at?: string;
}

export interface CrmUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MARKETING' | 'DOCTOR' | 'RECEPTIONIST';
  department?: string | null;
  phone?: string | null;
  is_active: boolean;
  created_at?: string;
  last_login_at?: string | null;
}

export const settingsApi = {
  getHospitalProfile: async () => {
    return apiClient<HospitalProfile>('/settings/hospital-profile');
  },

  updateHospitalProfile: async (data: Partial<HospitalProfile>) => {
    return apiClient<HospitalProfile>('/settings/hospital-profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getUsers: async () => {
    return apiClient<CrmUser[]>('/settings/users');
  },

  createUser: async (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    department?: string;
    phone?: string;
  }) => {
    return apiClient<CrmUser>('/settings/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateUserRole: async (id: string, data: { role?: string; is_active?: boolean }) => {
    return apiClient<CrmUser>(`/settings/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteUser: async (id: string) => {
    return apiClient(`/settings/users/${id}`, {
      method: 'DELETE',
    });
  },

  getIntegrations: async () => {
    return apiClient<IntegrationItem[]>('/settings/integrations');
  },

  toggleIntegration: async (id: string, is_enabled: boolean) => {
    return apiClient<IntegrationItem>(`/settings/integrations/${id}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ is_enabled }),
    });
  },

  updateIntegrationConfig: async (id: string, config: Record<string, unknown>) => {
    return apiClient<IntegrationItem>(`/settings/integrations/${id}/config`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  },
};

export interface IntegrationItem {
  id: 'email_smtp' | 'whatsapp_cloud' | 'meta_ads' | 'sms_gateway';
  provider: string;
  name: string;
  description: string;
  is_enabled: boolean;
  config: Record<string, any>;
  status: string;
  updated_at?: string;
}

export type NPSCategory = 'Promoter' | 'Passive' | 'Detractor';

export interface FeedbackAspects {
  doctorCare: number;
  cleanliness: number;
  nursingStaff: number;
  billingClarity: number;
}

export interface FeedbackItem {
  id: string;
  uuid?: string;
  patientId?: string;
  patient: string;
  phone?: string;
  email?: string;
  department: string;
  doctor: string;
  npsScore: number;
  rating: number;
  category: NPSCategory;
  comment: string;
  aspects: FeedbackAspects;
  status: 'Reviewed' | 'Action Required' | 'Resolved';
  followUpNotes?: string;
  surveyChannel: string;
  date: string;
  createdAt?: string;
}

export interface FeedbackMetrics {
  totalReviews: number;
  npsScore: number;
  avgRating: number;
  promoterPct: number;
  passivePct: number;
  detractorPct: number;
  actionRequired: number;
}

export interface FeedbackResponseData {
  feedbacks: FeedbackItem[];
  metrics: FeedbackMetrics;
}

export const feedbackApi = {
  getAll: async (params?: { search?: string; category?: string; department?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.category) q.append('category', params.category);
    if (params?.department) q.append('department', params.department);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiClient<FeedbackResponseData>(`/feedback${qs}`);
  },

  create: async (data: Partial<FeedbackItem> & { patientName: string; npsScore: number }) => {
    return apiClient<FeedbackItem>('/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  sendSurvey: async (payload: {
    targetAudience: string;
    channel: string;
    customEmail?: string;
    customPhone?: string;
    patientName?: string;
  }) => {
    return apiClient<{ success: boolean; surveyUrl: string; message: string }>('/feedback/send-survey', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateStatus: async (id: string, payload: { status: string; followUpNotes?: string }) => {
    return apiClient<FeedbackItem>(`/feedback/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};

export interface DashboardData {
  kpis: {
    todayOpd: number;
    opdAttended: number;
    bedOccupancy: string;
    bedOccupancyText: string;
    newLeads: number;
    adsLeadsText: string;
    leadConversion: string;
    revenueToday: string;
    pendingTpaClaims: number;
    delayedTpaClaims: number;
    npsScore: string;
    npsTotalReviews: number;
    npsDetractors: number;
  };
  appointments: Array<{
    id: string;
    time: string;
    patient: string;
    doctor: string;
    dept: string;
    source: string;
    status: string;
  }>;
  funnel: {
    enquiries: number;
    contacted: number;
    scheduled: number;
    visited: number;
    converted: number;
  };
  wards: Array<{
    ward: string;
    occupied: number;
    total: number;
  }>;
  footfall?: Array<{
    day: string;
    count: number;
  }>;
  recentInvoices?: Array<{
    id: string;
    invoiceNumber: string;
    patientName: string;
    amount: string;
    rawAmount: number;
    status: string;
    timeAgo: string;
  }>;
}

export const dashboardApi = {
  getOverview: async () => {
    return apiClient<DashboardData>('/dashboard/overview');
  },
};



