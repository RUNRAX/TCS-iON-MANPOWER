// ─────────────────────────────────────────────────────────────
// types/database.ts
// Auto-generated Supabase types + custom extensions
// Run: npm run db:types  to regenerate from Supabase
// ─────────────────────────────────────────────────────────────

export type UserRole = "admin" | "employee";

export type ProfileStatus = "pending" | "approved" | "rejected" | "inactive";

export type ShiftStatus = "draft" | "published" | "completed" | "cancelled";

export type AssignmentStatus = "pending" | "confirmed" | "absent" | "completed";

export type PaymentStatus = "pending" | "processing" | "cleared" | "failed";

export type NotificationType =
  | "shift_created"
  | "shift_confirmed"
  | "shift_reminder"
  | "payment_cleared"
  | "profile_approved"
  | "profile_rejected"
  | "custom";

// ── Raw DB row types (snake_case — matches PostgreSQL)
export interface DbUser {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbEmployeeProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  alt_phone: string | null;
  email: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  // Encrypted at application layer — stored as ciphertext
  bank_account_encrypted: string | null;
  bank_ifsc_encrypted: string | null;
  bank_name: string | null;
  id_proof_type: "aadhaar" | "pan" | "voter_id" | "passport" | null;
  id_proof_url: string | null; // Supabase Storage path
  photo_url: string | null; // Supabase Storage path
  status: ProfileStatus;
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbExamShift {
  id: string;
  title: string;
  exam_date: string; // ISO date string
  shift_number: number;
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  venue: string;
  venue_address: string | null;
  max_employees: number;
  min_employees: number;
  status: ShiftStatus;
  notes: string | null;
  created_by: string; // admin user_id
  broadcast_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbShiftAssignment {
  id: string;
  employee_id: string;
  shift_id: string;
  status: AssignmentStatus;
  confirmed_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPayment {
  id: string;
  employee_id: string;
  shift_id: string;
  amount: number; // in INR paise (divide by 100 for rupees)
  status: PaymentStatus;
  reference_number: string | null;
  notes: string | null;
  cleared_by: string | null; // admin user_id
  cleared_at: string | null;
  payslip_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbNotification {
  id: string;
  employee_id: string;
  type: NotificationType;
  title: string;
  message: string;
  whatsapp_sent: boolean;
  whatsapp_message_id: string | null;
  whatsapp_status: "queued" | "sent" | "delivered" | "read" | "failed" | null;
  email_sent: boolean;
  is_read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface DbAuditLog {
  id: string;
  user_id: string;
  action: string; // e.g. 'employee.create', 'shift.broadcast', 'payment.clear'
  entity_type: string; // e.g. 'employee', 'shift', 'payment'
  entity_id: string | null;
  before_value: Record<string, unknown> | null;
  after_value: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ── Application-level types (camelCase — for frontend use)
export interface Employee {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  altPhone: string | null;
  email: string;
  city: string;
  state: string;
  pincode: string;
  bankName: string | null;
  idProofType: DbEmployeeProfile["id_proof_type"];
  idProofUrl: string | null;
  photoUrl: string | null;
  status: ProfileStatus;
  createdAt: string;
}

export interface ExamShift {
  id: string;
  title: string;
  examDate: string;
  shiftNumber: number;
  startTime: string;
  endTime: string;
  venue: string;
  venueAddress: string | null;
  maxEmployees: number;
  minEmployees: number;
  status: ShiftStatus;
  confirmedCount: number;
  broadcastSentAt: string | null;
  createdAt: string;
}

export interface ShiftWithAssignment extends ExamShift {
  myStatus: AssignmentStatus | null;
  myAssignmentId: string | null;
}

export interface PaymentRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  shiftId: string;
  shiftDate: string;
  shiftNumber: number;
  amountRupees: number;
  status: PaymentStatus;
  referenceNumber: string | null;
  clearedAt: string | null;
  payslipUrl: string | null;
}

// ── API Response wrappers
export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── Dashboard stats
export interface AdminStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingApprovals: number;
  upcomingShifts: number;
  totalShiftsThisMonth: number;
  totalPayoutsThisMonth: number; // in rupees
  confirmedVsRequired: { shiftId: string; confirmed: number; required: number }[];
}

export interface EmployeeStats {
  totalShiftsDone: number;
  upcomingShifts: number;
  totalEarnings: number; // in rupees
  pendingPayment: number; // in rupees
  clearedPayment: number; // in rupees
}
