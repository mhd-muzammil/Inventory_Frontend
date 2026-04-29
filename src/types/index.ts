// ============================================================
// ENUMS & LITERAL TYPES
// ============================================================

export type UserRole = "admin" | "manager" | "engineer" | "receptionist" | "cc_team" | "super_admin" | "sub_admin";
export type Region = "vellore" | "salem" | "chennai" | "kanchipuram" | "hosur";
export type ServiceType = "warranty" | "non_warranty" | "doa" | "amc" | "rental" | "trade";
export type TicketPriority = "low" | "medium" | "high" | "critical";

export type TicketStatus =
  | "cso_created"
  | "assigned"
  | "diagnosis"
  | "part_requested"
  | "part_approved"
  | "quotation_sent"
  | "cx_pending"
  | "cx_approved"
  | "cx_rejected"
  | "part_ordered"
  | "part_received"
  | "in_progress"
  | "ready_for_delivery"
  | "closed"
  | "under_observation";

export type SLAHealth = "on_track" | "warning" | "breached";
export type PartRequestStatus = "pending" | "approved" | "rejected" | "ordered" | "received" | "cancelled";
export type PartUrgency = "normal" | "urgent" | "critical";
export type QuotationStatus = "draft" | "sent" | "customer_approved" | "customer_rejected" | "negotiating" | "expired";
export type POStatus = "draft" | "sent" | "confirmed" | "shipped" | "partial_received" | "received" | "cancelled";
export type InvoiceStatus = "draft" | "sent" | "paid" | "partial" | "overdue" | "cancelled";
export type MovementType = "in" | "out" | "reserved" | "released" | "adjustment" | "buffer_in" | "buffer_out";

// ============================================================
// CORE MODELS
// ============================================================

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  region: Region | null;
  is_active: boolean;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export type EngineerStatus = "active" | "inactive";

export interface Engineer {
  id: number;
  name: string;
  email: string;
  phone: string;
  region: Region;
  region_display: string;
  status: EngineerStatus;
  status_display: string;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface EngineerSummary {
  id: number;
  name: string;
  phone: string;
  region: Region;
  region_display: string;
  status: EngineerStatus;
}

// ============================================================
// TICKETS
// ============================================================

export interface Ticket {
  id: number;
  ticket_number: string;
  form_number: string | null;
  work_order: string;
  // Customer
  cust_name: string;
  cust_contact: string;
  cust_email: string;
  cust_address: string;
  location: string;
  // Product
  product_name: string;
  serial_number: string;
  model_number: string;
  brand: string;
  case_id: string | null;
  condition_received: string;
  // Service
  service_type: ServiceType;
  service_type_display: string;
  priority: TicketPriority;
  issue_description: string;
  // Workflow
  current_status: TicketStatus;
  current_status_display: string;
  current_assignee: Pick<User, "id" | "full_name" | "role"> | null;
  assigned_engineer: EngineerSummary | null;
  assigned_at: string | null;
  requires_parts: boolean;
  was_under_observation: boolean;
  // Part details
  part_number: string;
  part_usage: string;
  failure_code: string;
  part_description: string;
  qty: number;
  ct_code: string;
  so_req_id: string;
  removed_part_sno: string;
  installed_part_sno: string;
  // Resolution
  resolution_summary: string;
  engineer_name: string;
  hp_id: string;
  explanation: string;
  customer_comments: string;
  // Tracking
  region: Region;
  region_display: string;
  created_by: Pick<User, "id" | "full_name" | "role">;
  otp_verified: boolean;
  // SLA (computed by backend)
  sla_health: SLAHealth;
  sla_remaining_mins: number | null;
  current_stage_elapsed_mins: number;
  total_delay_mins: number;
  // Dates
  cso_date: string | null;
  arrival_date: string | null;
  target_completion: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimelineEntry {
  id: number;
  ticket_id: number;
  from_status: TicketStatus | null;
  to_status: TicketStatus;
  actor: Pick<User, "id" | "full_name" | "role">;
  comment: string | null;
  metadata: Record<string, unknown>;
  entered_at: string;
  exited_at: string | null;
  duration_mins: number | null;
  sla_minutes: number | null;
  is_breached: boolean;
  breach_minutes: number;
  responsible_role: UserRole | null;
}

export interface AvailableTransition {
  to_status: TicketStatus;
  label: string;
  requires_comment: boolean;
  requires_field?: string;
}

// ============================================================
// PART REQUESTS
// ============================================================

export interface PartRequest {
  id: number;
  ticket_id: number;
  ticket_number: string;
  requested_by: Pick<User, "id" | "full_name" | "role">;
  part_number: string;
  part_name: string;
  description: string;
  quantity: number;
  urgency: PartUrgency;
  estimated_cost: number | null;
  status: PartRequestStatus;
  approved_by: Pick<User, "id" | "full_name"> | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// QUOTATIONS
// ============================================================

export interface QuotationItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  part_request_id?: number;
}

export interface Quotation {
  id: number;
  quotation_number: string;
  ticket_id: number;
  ticket_number: string;
  items: QuotationItem[];
  parts_cost: number;
  labor_cost: number;
  tax_percent: number;
  tax_amount: number;
  discount: number;
  total_amount: number;
  status: QuotationStatus;
  prepared_by: Pick<User, "id" | "full_name" | "role">;
  approved_by: Pick<User, "id" | "full_name"> | null;
  sent_at: string | null;
  customer_response_at: string | null;
  valid_until: string | null;
  notes: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// PURCHASE ORDERS
// ============================================================

export interface POItem {
  id?: number;
  part_request_id?: number;
  part_number: string;
  part_name: string;
  quantity: number;
  unit_price: number | null;
  total: number | null;
  received_qty: number;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_name: string;
  supplier_contact: string;
  supplier_email: string;
  items: POItem[];
  status: POStatus;
  ordered_by: Pick<User, "id" | "full_name">;
  approved_by: Pick<User, "id" | "full_name"> | null;
  total_amount: number;
  order_date: string | null;
  expected_delivery: string | null;
  actual_delivery: string | null;
  region: Region | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// STOCK & BUFFER
// ============================================================

export interface StockItem {
  id: number;
  part_number: string;
  part_name: string;
  description: string;
  category: string;
  brand: string;
  qty_on_hand: number;
  qty_reserved: number;
  qty_on_order: number;
  qty_available: number;
  reorder_level: number;
  reorder_qty: number;
  unit_cost: number | null;
  region: Region | null;
  storage_location: string;
  last_restocked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  stock_item_id: number;
  stock_item_name: string;
  movement_type: MovementType;
  quantity: number;
  reference_type: string | null;
  reference_id: number | null;
  performed_by: Pick<User, "id" | "full_name">;
  notes: string;
  created_at: string;
}

export interface BufferEntry {
  id: number;
  stock_item: Pick<StockItem, "id" | "part_number" | "part_name">;
  quantity: number;
  reason: string;
  reserved_by: Pick<User, "id" | "full_name">;
  reserved_for_ticket_id: number | null;
  reserved_for_ticket_number: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface BufferPart {
  id: number;
  part_number: string;
  part_name: string;
  quantity: number;
  general_name: string;
  region: Region | "";
  region_display: string;
  created_by: number | null;
  created_by_name: string | null;
  created_at: string;
}

// ============================================================
// INVOICES
// ============================================================

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  ticket_id: number;
  ticket_number: string;
  quotation_id: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_percent: number;
  tax_amount: number;
  discount: number;
  total: number;
  status: InvoiceStatus;
  payment_method: string | null;
  paid_amount: number;
  paid_at: string | null;
  due_date: string | null;
  created_by: Pick<User, "id" | "full_name">;
  region: Region | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// DASHBOARD & ANALYTICS
// ============================================================

export interface DashboardOverview {
  total_tickets: number;
  by_status: Partial<Record<TicketStatus, number>>;
  by_priority: Record<TicketPriority, number>;
  breached_count: number;
  warning_count: number;
  avg_resolution_hrs: number;
  tickets_today: number;
  closed_today: number;
  // Overall workflow KPIs
  assigned_count: number;
  unassigned_count: number;
  in_progress_count: number;
  part_pending_count: number;
  part_order_pending_count: number;
  part_quote_pending_count: number;
  ready_to_dispatch_count: number;
  cx_pending_count: number;
  completed_count: number;
  warranty_count: number;
  out_of_warranty_count: number;
  // Today's KPIs
  today_warranty: number;
  today_out_of_warranty: number;
  today_assigned: number;
  today_unassigned: number;
  today_part_pending: number;
  today_part_order_pending: number;
  today_part_quote_pending: number;
  today_cx_pending: number;
}

export interface RegionStats {
  region: string;
  total_tickets: number;
  open_tickets: number;
  breached: number;
  avg_resolution_hrs: number;
}

export interface DelayHeatmapCell {
  role: UserRole;
  status: TicketStatus;
  avg_delay_mins: number;
  breach_count: number;
  total_tickets: number;
  severe_count: number;
}

export interface EngineerPerformance {
  engineer_id: number;
  name: string;
  assigned: number;
  completed: number;
  in_progress: number;
  avg_resolution_hrs: number;
  sla_compliance_pct: number;
  total_delay_mins: number;
  breach_count: number;
}

export interface ManagerApprovalMetrics {
  manager_id: number;
  name: string;
  avg_approval_mins: number;
  pending_count: number;
  approved_count: number;
  breach_count: number;
}

export interface TicketAgingBucket {
  range: string;
  count: number;
  breached: number;
}

export interface SLABreachAlert {
  id: string;
  ticket_id: number;
  ticket_number: string;
  current_status: TicketStatus;
  responsible_role: UserRole;
  responsible_user: string | null;
  delay_minutes: number;
  entered_at: string;
  sla_minutes: number;
}

export interface SLAConfig {
  id: number;
  status: TicketStatus;
  service_type: ServiceType | null;
  priority: TicketPriority | null;
  sla_minutes: number;
  responsible_role: UserRole;
  warning_at_percent: number;
  escalation_after_mins: number | null;
  escalation_to_role: UserRole | null;
  is_active: boolean;
}

export interface TransitionRule {
  from_status: TicketStatus;
  to_status: TicketStatus;
  allowed_roles: UserRole[];
  requires_parts: boolean | null;
  label: string;
}

// ============================================================
// PAGINATION
// ============================================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// ============================================================
// QUERY PARAMS
// ============================================================

export interface TicketFilters {
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  service_type?: ServiceType;
  sla_health?: SLAHealth;
  assignee_id?: number;
  region?: Region;
  ordering?: string;
  page?: number;
  per_page?: number;
}

export interface PartRequestFilters {
  ticket_id?: number;
  status?: PartRequestStatus;
  urgency?: PartUrgency;
  page?: number;
  per_page?: number;
}

export interface QuotationFilters {
  ticket_id?: number;
  status?: QuotationStatus;
  page?: number;
  per_page?: number;
}

export interface POFilters {
  status?: POStatus;
  supplier?: string;
  page?: number;
  per_page?: number;
}

export interface StockFilters {
  search?: string;
  category?: string;
  low_stock_only?: boolean;
  region?: Region;
  page?: number;
  per_page?: number;
}

export interface InvoiceFilters {
  ticket_id?: number;
  status?: InvoiceStatus;
  page?: number;
  per_page?: number;
}

export interface CustomerQueryParams {
  search?: string;
  page?: number;
  per_page?: number;
}

// ============================================================
// LABEL MAPS
// ============================================================

export const REGION_LABELS: Record<Region, string> = {
  vellore: "Vellore",
  salem: "Salem",
  chennai: "Chennai",
  kanchipuram: "Kanchipuram",
  hosur: "Hosur",
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  warranty: "Warranty",
  non_warranty: "Non Warranty",
  doa: "DOA",
  amc: "AMC",
  rental: "Rental",
  trade: "Trade",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Manager",
  engineer: "Engineer",
  receptionist: "Receptionist",
  cc_team: "CC Team",
  super_admin: "Super Admin",
  sub_admin: "Sub Admin",
};

export const PART_REQUEST_STATUS_LABELS: Record<PartRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  ordered: "Ordered",
  received: "Received",
  cancelled: "Cancelled",
};

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  customer_approved: "Approved",
  customer_rejected: "Rejected",
  negotiating: "Negotiating",
  expired: "Expired",
};

export const PO_STATUS_LABELS: Record<POStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  confirmed: "Confirmed",
  shipped: "Shipped",
  partial_received: "Partial",
  received: "Received",
  cancelled: "Cancelled",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  partial: "Partial",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

// Legacy compat for existing Customer/Transaction code
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  total_transactions: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: "in" | "out";
  material_id: string;
  customer_id: string;
  material_name: string;
  customer_name: string;
  quantity: number;
  date: string;
  notes: string;
  created_at: string;
}

export interface TransactionQueryParams {
  type?: "in" | "out";
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}
