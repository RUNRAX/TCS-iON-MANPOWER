import { z } from "zod";

// ── Shared field validators
const phoneRegex = /^[6-9]\d{9}$/;  // Indian mobile numbers
const ifscRegex  = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const pincodeRegex = /^\d{6}$/;

// ─────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email or phone is required")
    .max(255),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128),
});

export const VerifyOtpSchema = z.object({
  identifier: z.string().min(1),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric"),
  type: z.enum(["login", "signup", "phone_change"]),
});

export const ForgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
});

export const ResetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// ─────────────────────────────────────────────────────────
// ADMIN — EMPLOYEE MANAGEMENT
// ─────────────────────────────────────────────────────────

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
] as const;

export const AddEmployeeSchema = z.object({
  // ── Essential (Required) ──
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100)
    .regex(/^[a-zA-Z\s.'-]+$/, "Name contains invalid characters"),
  email: z
    .string()
    .email("Invalid email address")
    .max(255)
    .toLowerCase(),
  phone: z
    .string()
    .regex(phoneRegex, "Enter a valid 10-digit Indian mobile number"),
  state: z
    .string()
    .min(2, "State is required")
    .max(100),
  city: z
    .string()
    .min(2, "City is required")
    .max(100),
  idProofType: z.enum(["aadhaar", "pan", "voter_id", "passport"], {
    errorMap: () => ({ message: "Select a valid ID proof type" }),
  }),

  // ── Optional ──
  altPhone: z
    .string()
    .regex(phoneRegex, "Enter a valid 10-digit Indian mobile number")
    .optional()
    .or(z.literal("")),
  addressLine1: z
    .string()
    .min(5, "Address too short")
    .max(200)
    .optional()
    .or(z.literal("")),
  addressLine2: z.string().max(200).optional().or(z.literal("")),
  pincode: z
    .string()
    .regex(pincodeRegex, "Enter a valid 6-digit pincode")
    .optional()
    .or(z.literal("")),
  bankAccount: z
    .string()
    .min(9, "Account number too short")
    .max(18, "Account number too long")
    .regex(/^\d+$/, "Account number must be numeric")
    .optional()
    .or(z.literal("")),
  bankIfsc: z
    .string()
    .regex(ifscRegex, "Enter a valid IFSC code (e.g. SBIN0001234)")
    .toUpperCase()
    .optional()
    .or(z.literal("")),
  bankName: z
    .string()
    .min(2, "Bank name required")
    .max(100)
    .optional()
    .or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

/** Schema for developer (super_admin) creating admin accounts */
export const CreateAdminSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100),
  email: z
    .string()
    .email("Invalid email address")
    .max(255)
    .toLowerCase(),
  phone: z
    .string()
    .regex(phoneRegex, "Enter a valid 10-digit Indian mobile number"),
  centerCode: z
    .string()
    .length(3, "Center code must be exactly 3 letters")
    .regex(/^[A-Z]{3}$/, "Center code must be 3 uppercase letters")
    .toUpperCase(),
});

export const ApproveEmployeeSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID"),
  action: z.enum(["approve", "reject"]),
  reason: z
    .string()
    .max(500)
    .optional(),
}).refine(
  (data) => data.action !== "reject" || (data.reason && data.reason.length >= 10),
  { message: "Rejection reason is required (min 10 chars)", path: ["reason"] }
);

export const UpdateEmployeeSchema = z.object({
  isActive: z.boolean().optional(),
  phone: z
    .string()
    .regex(phoneRegex, "Enter a valid 10-digit Indian mobile number")
    .optional(),
  role: z.enum(["admin", "employee"]).optional(),
});

// ─────────────────────────────────────────────────────────
// EMPLOYEE — PROFILE / KYC
// ─────────────────────────────────────────────────────────

export const EmployeeProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100)
    .regex(/^[a-zA-Z\s.'-]+$/, "Name contains invalid characters"),
  phone: z
    .string()
    .regex(phoneRegex, "Enter a valid 10-digit Indian mobile number"),
  altPhone: z
    .string()
    .regex(phoneRegex, "Enter a valid 10-digit Indian mobile number")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Invalid email address").toLowerCase(),
  addressLine1: z
    .string()
    .min(5, "Address too short")
    .max(200),
  addressLine2: z.string().max(200).optional().or(z.literal("")),
  city: z
    .string()
    .min(2, "City name required")
    .max(100)
    .regex(/^[a-zA-Z\s]+$/, "City name contains invalid characters"),
  state: z.string().min(2, "State required").max(100),
  pincode: z
    .string()
    .regex(pincodeRegex, "Enter a valid 6-digit pincode"),
  // Bank details — will be encrypted before storing
  bankAccount: z
    .string()
    .min(9, "Account number too short")
    .max(18, "Account number too long")
    .regex(/^\d+$/, "Account number must be numeric"),
  bankIfsc: z
    .string()
    .regex(ifscRegex, "Enter a valid IFSC code (e.g. SBIN0001234)")
    .toUpperCase(),
  bankName: z
    .string()
    .min(2, "Bank name required")
    .max(100),
  idProofType: z.enum(["aadhaar", "pan", "voter_id", "passport"], {
    errorMap: () => ({ message: "Select a valid ID proof type" }),
  }),
});

// ─────────────────────────────────────────────────────────
// ADMIN — SHIFTS
// ─────────────────────────────────────────────────────────

export const CreateShiftSchema = z.object({
  title: z
    .string()
    .min(3, "Title required")
    .max(200),
  examDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .refine((d) => new Date(d) >= new Date(new Date().toDateString()), {
      message: "Exam date cannot be in the past",
    }),
  shiftNumber: z
    .number()
    .int()
    .min(1, "Shift number minimum is 1")
    .max(10, "Shift number maximum is 10"),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM format"),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM format"),
  venue: z.string().min(3, "Venue required").max(200),
  venueAddress: z.string().max(500).optional().or(z.literal("")),
  maxEmployees: z
    .number()
    .int()
    .min(1)
    .max(500, "Maximum 500 employees per shift"),
  minEmployees: z
    .number()
    .int()
    .min(1),
  notes: z.string().max(1000).optional().or(z.literal("")),
}).refine(
  (data) => data.startTime < data.endTime,
  { message: "End time must be after start time", path: ["endTime"] }
).refine(
  (data) => data.minEmployees <= data.maxEmployees,
  { message: "Min employees cannot exceed max employees", path: ["minEmployees"] }
);

export const BroadcastSchema = z.object({
  shiftId: z.string().uuid("Invalid shift ID"),
  targetGroup: z.enum(["all", "confirmed", "unresponded"]).default("all"),
  customMessage: z.string().max(1000).optional(),
});

/** Schema for super_admin system-wide broadcast */
export const SystemBroadcastSchema = z.object({
  subject: z
    .string()
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject cannot exceed 200 characters"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message cannot exceed 2000 characters"),
  targets: z
    .enum(["all_employees", "all_admins", "everyone"])
    .default("all_employees"),
  centerCode: z
    .string()
    .length(3, "Center code must be exactly 3 letters")
    .regex(/^[A-Z]{3}$/, "Center code must be 3 uppercase letters")
    .optional(),
});

// ─────────────────────────────────────────────────────────
// EMPLOYEE — SHIFT ACTIONS
// ─────────────────────────────────────────────────────────

export const ConfirmShiftSchema = z.object({
  shiftId: z.string().uuid("Invalid shift ID"),
});

// ─────────────────────────────────────────────────────────
// ADMIN — PAYMENTS
// ─────────────────────────────────────────────────────────

export const ClearPaymentSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID"),
  shiftId: z.string().uuid("Invalid shift ID"),
  amountRupees: z
    .number()
    .positive("Amount must be positive")
    .max(100000, "Amount exceeds maximum (₹1,00,000)"),
  referenceNumber: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export const BulkPaymentSchema = z.object({
  payments: z
    .array(ClearPaymentSchema)
    .min(1, "At least one payment required")
    .max(50, "Maximum 50 payments per bulk operation"),
});

// ─────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ─────────────────────────────────────────────────────────
// TYPE EXPORTS
// ─────────────────────────────────────────────────────────

export type LoginInput              = z.infer<typeof LoginSchema>;
export type VerifyOtpInput          = z.infer<typeof VerifyOtpSchema>;
export type AddEmployeeInput        = z.infer<typeof AddEmployeeSchema>;
export type ApproveEmployeeInput    = z.infer<typeof ApproveEmployeeSchema>;
export type EmployeeProfileInput    = z.infer<typeof EmployeeProfileSchema>;
export type CreateShiftInput        = z.infer<typeof CreateShiftSchema>;
export type BroadcastInput          = z.infer<typeof BroadcastSchema>;
export type SystemBroadcastInput    = z.infer<typeof SystemBroadcastSchema>;
export type CreateAdminInput        = z.infer<typeof CreateAdminSchema>;
export type ConfirmShiftInput       = z.infer<typeof ConfirmShiftSchema>;
export type ClearPaymentInput       = z.infer<typeof ClearPaymentSchema>;
export type PaginationInput         = z.infer<typeof PaginationSchema>;

