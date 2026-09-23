export const RESIDENT_STATUS = Object.freeze({ PENDING: 'pending', VERIFIED: 'verified', REJECTED: 'rejected', SUSPENDED: 'suspended', ARCHIVED: 'archived' });
const R = RESIDENT_STATUS;

/** Verification workflow. Archived is set automatically at move-out (or manually), and is terminal. */
export const VERIFY_TRANSITIONS = Object.freeze({
  [R.PENDING]: [R.VERIFIED, R.REJECTED],
  [R.VERIFIED]: [R.SUSPENDED, R.ARCHIVED],
  [R.REJECTED]: [R.PENDING],
  [R.SUSPENDED]: [R.VERIFIED, R.ARCHIVED],
  [R.ARCHIVED]: [],
});
export const canVerifyTransition = (from, to) => (VERIFY_TRANSITIONS[from] || []).includes(to);

/** Biodata fields an admin may mark as required (Settings → residentForm.requiredFields). */
export const BIODATA_FIELDS = ['photoUrl', 'fatherName', 'motherName', 'dateOfBirth', 'phone', 'email', 'emergencyContact', 'permanentAddress', 'presentAddress', 'nationality', 'occupation', 'institution', 'department', 'bloodGroup', 'guardian', 'expectedLeavingDate'];
/** Minimal by default — we do not collect more sensitive data than needed. */
export const DEFAULT_REQUIRED_FIELDS = ['dateOfBirth', 'emergencyContact', 'permanentAddress'];

const filled = (v) => (typeof v === 'string' ? v.trim() !== '' : v !== null && v !== undefined);
export function isFieldFilled(resident, key) {
  if (key === 'emergencyContact' || key === 'guardian') return filled(resident[key]?.name) && filled(resident[key]?.phone);
  return filled(resident[key]);
}
export const missingFields = (resident, required) => required.filter((k) => !isFieldFilled(resident, k));

export const MOVE_OUT = Object.freeze({ NONE: 'none', REQUESTED: 'requested', APPROVED: 'approved', REJECTED: 'rejected', COMPLETED: 'completed' });

export const DUE_TYPES = ['rent', 'late_fee', 'adjustment', 'other'];
export const PAYMENT_METHODS = ['cash', 'bkash', 'nagad', 'rocket', 'bank_transfer', 'other'];
export const COMPLAINT_CATEGORIES = ['food', 'room', 'maintenance', 'electricity', 'water', 'internet', 'security', 'staff', 'noise', 'other'];
export const COMPLAINT_STATUSES = ['open', 'assigned', 'in_progress', 'resolved', 'closed'];
export const COMPLAINT_TRANSITIONS = Object.freeze({
  open: ['assigned', 'in_progress', 'resolved', 'closed'],
  assigned: ['in_progress', 'resolved', 'closed'],
  in_progress: ['resolved', 'closed'],
  resolved: ['closed', 'in_progress'],
  closed: [],
});
export const WARNING_TYPES = ['rent_overdue', 'repeated_complaints', 'rule_violation', 'disciplinary', 'other'];
