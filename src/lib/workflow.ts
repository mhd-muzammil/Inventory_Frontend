import type { TicketStatus, UserRole, TicketPriority, SLAHealth } from "@/types";

// ============================================================
// STATUS DISPLAY CONFIGURATION
// ============================================================

export interface StatusConfig {
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  dotClass: string;
  order: number;
}

export const STATUS_CONFIG: Record<TicketStatus, StatusConfig> = {
  cso_created:        { label: "CSO Created",       color: "#6366f1", bgClass: "bg-indigo-100 dark:bg-indigo-950/50",   textClass: "text-indigo-700 dark:text-indigo-300",  dotClass: "bg-indigo-500",  order: 0 },
  assigned:           { label: "Assigned",           color: "#8b5cf6", bgClass: "bg-violet-100 dark:bg-violet-950/50",   textClass: "text-violet-700 dark:text-violet-300",  dotClass: "bg-violet-500",  order: 1 },
  diagnosis:          { label: "Diagnosis",          color: "#3b82f6", bgClass: "bg-blue-100 dark:bg-blue-950/50",       textClass: "text-blue-700 dark:text-blue-300",      dotClass: "bg-blue-500",    order: 2 },
  part_requested:     { label: "Part Requested",     color: "#f59e0b", bgClass: "bg-amber-100 dark:bg-amber-950/50",     textClass: "text-amber-700 dark:text-amber-300",    dotClass: "bg-amber-500",   order: 3 },
  part_approved:      { label: "Part Approved",      color: "#10b981", bgClass: "bg-emerald-100 dark:bg-emerald-950/50", textClass: "text-emerald-700 dark:text-emerald-300", dotClass: "bg-emerald-500", order: 4 },
  quotation_sent:     { label: "Quotation Sent",     color: "#06b6d4", bgClass: "bg-cyan-100 dark:bg-cyan-950/50",       textClass: "text-cyan-700 dark:text-cyan-300",      dotClass: "bg-cyan-500",    order: 5 },
  cx_pending:         { label: "Customer Pending",   color: "#f97316", bgClass: "bg-orange-100 dark:bg-orange-950/50",   textClass: "text-orange-700 dark:text-orange-300",  dotClass: "bg-orange-500",  order: 6 },
  cx_approved:        { label: "Customer Approved",  color: "#22c55e", bgClass: "bg-green-100 dark:bg-green-950/50",     textClass: "text-green-700 dark:text-green-300",    dotClass: "bg-green-500",   order: 7 },
  cx_rejected:        { label: "Customer Rejected",  color: "#ef4444", bgClass: "bg-red-100 dark:bg-red-950/50",         textClass: "text-red-700 dark:text-red-300",        dotClass: "bg-red-500",     order: 8 },
  part_ordered:       { label: "Part Ordered",       color: "#a855f7", bgClass: "bg-purple-100 dark:bg-purple-950/50",   textClass: "text-purple-700 dark:text-purple-300",  dotClass: "bg-purple-500",  order: 9 },
  part_received:      { label: "Part Received",      color: "#14b8a6", bgClass: "bg-teal-100 dark:bg-teal-950/50",       textClass: "text-teal-700 dark:text-teal-300",      dotClass: "bg-teal-500",    order: 10 },
  in_progress:        { label: "In Progress",        color: "#2563eb", bgClass: "bg-blue-100 dark:bg-blue-950/50",       textClass: "text-blue-700 dark:text-blue-300",      dotClass: "bg-blue-600",    order: 11 },
  ready_for_delivery: { label: "Ready for Delivery", color: "#84cc16", bgClass: "bg-lime-100 dark:bg-lime-950/50",       textClass: "text-lime-700 dark:text-lime-300",      dotClass: "bg-lime-500",    order: 12 },
  closed:             { label: "Closed",             color: "#6b7280", bgClass: "bg-gray-100 dark:bg-gray-800/50",       textClass: "text-gray-600 dark:text-gray-400",      dotClass: "bg-gray-500",    order: 13 },
  under_observation:  { label: "Under Observation",  color: "#ec4899", bgClass: "bg-pink-100 dark:bg-pink-950/50",       textClass: "text-pink-700 dark:text-pink-300",      dotClass: "bg-pink-500",    order: 14 },
};

// ============================================================
// WORKFLOW TRANSITION MAP
// ============================================================

export interface TransitionDef {
  to: TicketStatus;
  label: string;
  roles: UserRole[];
  requiresComment: boolean;
  requiresField?: string;
  requiresParts?: boolean; // true = only if requires_parts, false = only if !requires_parts
}

export const WORKFLOW_TRANSITIONS: Record<TicketStatus, TransitionDef[]> = {
  cso_created: [
    { to: "assigned", label: "Assign Engineer", roles: ["manager", "sub_admin", "super_admin", "admin"], requiresComment: false, requiresField: "current_assignee_id" },
  ],
  assigned: [
    { to: "diagnosis", label: "Start Diagnosis", roles: ["engineer", "sub_admin", "super_admin", "admin"], requiresComment: false },
  ],
  diagnosis: [
    { to: "part_requested", label: "Request Parts", roles: ["engineer", "sub_admin", "super_admin", "admin"], requiresComment: true, requiresParts: true },
    { to: "in_progress", label: "Start Repair (No Parts)", roles: ["engineer", "sub_admin", "super_admin", "admin"], requiresComment: true, requiresParts: false },
    { to: "closed", label: "Return Product", roles: ["engineer", "sub_admin", "super_admin", "admin"], requiresComment: true, requiresParts: false },
  ],
  part_requested: [
    // Only manager / admin can approve parts — sub_admin is explicitly excluded
    { to: "part_approved", label: "Approve Parts", roles: ["manager", "super_admin", "admin"], requiresComment: false },
    { to: "diagnosis", label: "Reject \u2014 Re-diagnose", roles: ["manager", "super_admin", "admin"], requiresComment: true },
  ],
  part_approved: [
    { to: "quotation_sent", label: "Send Quotation", roles: ["cc_team", "sub_admin", "super_admin", "admin"], requiresComment: false },
  ],
  quotation_sent: [
    { to: "cx_pending", label: "Awaiting Customer", roles: ["cc_team", "sub_admin", "super_admin", "admin"], requiresComment: false },
  ],
  cx_pending: [
    { to: "part_ordered", label: "Customer Approved \u2014 Order Parts", roles: ["cc_team", "sub_admin", "super_admin", "admin"], requiresComment: false },
    { to: "closed", label: "Customer Rejected \u2014 Close", roles: ["cc_team", "sub_admin", "super_admin", "admin"], requiresComment: true },
    { to: "quotation_sent", label: "Re-negotiate \u2014 Resend", roles: ["cc_team", "sub_admin", "super_admin", "admin"], requiresComment: true },
  ],
  // cx_approved / cx_rejected removed — handled directly from cx_pending
  cx_approved: [],
  cx_rejected: [],
  part_ordered: [
    { to: "part_received", label: "Parts Received", roles: ["manager", "sub_admin", "super_admin", "admin"], requiresComment: false },
  ],
  part_received: [
    { to: "in_progress", label: "Start Repair", roles: ["engineer", "sub_admin", "super_admin", "admin"], requiresComment: false },
  ],
  in_progress: [
    { to: "part_requested", label: "Request Parts", roles: ["engineer", "sub_admin", "super_admin", "admin"], requiresComment: true },
    { to: "ready_for_delivery", label: "Mark Ready", roles: ["engineer", "sub_admin", "super_admin", "admin"], requiresComment: true },
  ],
  ready_for_delivery: [
    { to: "closed", label: "Deliver & Close", roles: ["receptionist", "manager", "sub_admin", "super_admin", "admin"], requiresComment: false },
  ],
  closed: [
    { to: "under_observation", label: "Under Observation", roles: ["manager", "sub_admin", "super_admin", "admin"], requiresComment: true },
  ],
  under_observation: [
    { to: "closed", label: "Final Close", roles: ["manager", "sub_admin", "super_admin", "admin"], requiresComment: true },
  ],
};

// ============================================================
// PRIORITY DISPLAY
// ============================================================

export interface PriorityConfig {
  label: string;
  bgClass: string;
  textClass: string;
  dotClass: string;
}

export const PRIORITY_CONFIG: Record<TicketPriority, PriorityConfig> = {
  low:      { label: "Low",      bgClass: "bg-slate-100 dark:bg-slate-800",   textClass: "text-slate-600 dark:text-slate-400", dotClass: "bg-slate-400" },
  medium:   { label: "Medium",   bgClass: "bg-blue-100 dark:bg-blue-950/50",  textClass: "text-blue-700 dark:text-blue-300",   dotClass: "bg-blue-500" },
  high:     { label: "High",     bgClass: "bg-amber-100 dark:bg-amber-950/50",textClass: "text-amber-700 dark:text-amber-300", dotClass: "bg-amber-500" },
  critical: { label: "Critical", bgClass: "bg-red-100 dark:bg-red-950/50",    textClass: "text-red-700 dark:text-red-300",     dotClass: "bg-red-500" },
};

// ============================================================
// SLA HEALTH DISPLAY
// ============================================================

export interface SLAHealthConfig {
  label: string;
  bgClass: string;
  textClass: string;
  dotClass: string;
  icon: "check" | "alert-triangle" | "alert-circle";
}

export const SLA_HEALTH_CONFIG: Record<SLAHealth, SLAHealthConfig> = {
  on_track: { label: "On Track", bgClass: "bg-green-100 dark:bg-green-950/50", textClass: "text-green-700 dark:text-green-300", dotClass: "bg-green-500", icon: "check" },
  warning:  { label: "Warning",  bgClass: "bg-amber-100 dark:bg-amber-950/50", textClass: "text-amber-700 dark:text-amber-300", dotClass: "bg-amber-500", icon: "alert-triangle" },
  breached: { label: "Breached", bgClass: "bg-red-100 dark:bg-red-950/50",     textClass: "text-red-700 dark:text-red-300",     dotClass: "bg-red-500",   icon: "alert-circle" },
};

// ============================================================
// DEFAULT SLA TABLE (for frontend reference / display)
// ============================================================

export interface SLADefault {
  status: TicketStatus;
  sla_minutes: number;
  responsible_role: UserRole;
  label: string;
}

export const DEFAULT_SLAS: SLADefault[] = [
  { status: "cso_created",        sla_minutes: 30,    responsible_role: "receptionist", label: "Assign within 30 min" },
  { status: "assigned",           sla_minutes: 60,    responsible_role: "manager",      label: "Start diagnosis within 1 hr" },
  { status: "diagnosis",          sla_minutes: 240,   responsible_role: "engineer",     label: "Complete diagnosis within 4 hrs" },
  { status: "part_requested",     sla_minutes: 120,   responsible_role: "manager",      label: "Approve parts within 2 hrs" },
  { status: "part_approved",      sla_minutes: 120,   responsible_role: "cc_team",      label: "Send quotation within 2 hrs" },
  { status: "quotation_sent",     sla_minutes: 60,    responsible_role: "cc_team",      label: "Mark customer pending within 1 hr" },
  { status: "cx_pending",         sla_minutes: 1440,  responsible_role: "cc_team",      label: "Customer responds within 24 hrs" },
  { status: "part_ordered",       sla_minutes: 2880,  responsible_role: "manager",      label: "Parts arrive within 48 hrs" },
  { status: "part_received",      sla_minutes: 120,   responsible_role: "manager",      label: "Start repair within 2 hrs" },
  { status: "in_progress",        sla_minutes: 480,   responsible_role: "engineer",     label: "Complete repair within 8 hrs" },
  { status: "ready_for_delivery", sla_minutes: 240,   responsible_role: "receptionist", label: "Deliver within 4 hrs" },
  { status: "under_observation",  sla_minutes: 10080, responsible_role: "engineer",     label: "Observe for 7 days" },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/** Get available transitions for a given status + user role */
export function getAvailableTransitions(
  currentStatus: TicketStatus,
  userRole: UserRole,
  requiresParts?: boolean,
): TransitionDef[] {
  const transitions = WORKFLOW_TRANSITIONS[currentStatus] || [];
  return transitions.filter((t) => {
    if (!t.roles.includes(userRole)) return false;
    if (t.requiresParts === true && requiresParts === false) return false;
    if (t.requiresParts === false && requiresParts === true) return false;
    return true;
  });
}

/** Check if a user role can perform any action on a given status */
export function canActOnStatus(status: TicketStatus, role: UserRole): boolean {
  return getAvailableTransitions(status, role).length > 0;
}

/** Get the "happy path" for display (all statuses a ticket goes through with parts) */
export function getFullPath(requiresParts: boolean): TicketStatus[] {
  if (requiresParts) {
    return [
      "cso_created", "assigned", "diagnosis",
      "part_requested", "part_approved", "quotation_sent",
      "cx_pending", "part_ordered", "part_received",
      "in_progress", "ready_for_delivery", "closed",
    ];
  }
  return [
    "cso_created", "assigned", "diagnosis",
    "in_progress", "ready_for_delivery", "closed",
  ];
}

/** Get the responsible role for a given status */
export function getResponsibleRole(status: TicketStatus): UserRole {
  const sla = DEFAULT_SLAS.find((s) => s.status === status);
  return sla?.responsible_role ?? "admin";
}

/** Format minutes into human-readable duration */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null || minutes <= 0) return "0m";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs < 24) return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  const days = Math.floor(hrs / 24);
  const remHrs = hrs % 24;
  return remHrs > 0 ? `${days}d ${remHrs}h` : `${days}d`;
}

/** Determine SLA health from elapsed time and SLA limit */
export function computeSLAHealth(elapsedMins: number, slaMins: number | null, warningPercent = 75): SLAHealth {
  if (slaMins == null || slaMins <= 0) return "on_track";
  if (elapsedMins > slaMins) return "breached";
  if (elapsedMins > slaMins * (warningPercent / 100)) return "warning";
  return "on_track";
}

/** Check if a status is terminal */
export function isTerminalStatus(status: TicketStatus): boolean {
  return status === "closed";
}

/** Get all statuses as ordered list */
export function getAllStatuses(): TicketStatus[] {
  return Object.entries(STATUS_CONFIG)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([status]) => status as TicketStatus);
}
