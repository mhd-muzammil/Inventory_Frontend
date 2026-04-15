import type { Region, PaginationMeta } from "./index";

// ============================================================
// ENUMS
// ============================================================

export type BufferStockCategory =
  | "print_head"
  | "toner"
  | "fuser"
  | "drum"
  | "formatter"
  | "scanner"
  | "adf"
  | "roller"
  | "power_supply"
  | "other";

export type BufferCaseType = "iw" | "oow";

export type BufferCaseStatus =
  | "created"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "part_allocated"
  | "transfer_requested"
  | "engineer_assigned"
  | "in_progress"
  | "service_completed"
  | "pending_replenishment"
  | "replenishment_ordered"
  | "stock_replenished"
  | "closed"
  | "cancelled";

export type TransferStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "in_transit"
  | "received"
  | "cancelled";

export type OOWApprovalStatus = "pending" | "approved" | "rejected";

export type ReplenishmentStatus =
  | "pending"
  | "ordered"
  | "shipped"
  | "received"
  | "cancelled";

export type AuditAction =
  | "stock_created"
  | "stock_updated"
  | "stock_adjusted"
  | "case_created"
  | "case_status_changed"
  | "case_closed"
  | "oow_requested"
  | "oow_approved"
  | "oow_rejected"
  | "transfer_requested"
  | "transfer_approved"
  | "transfer_rejected"
  | "transfer_received"
  | "replenishment_created"
  | "replenishment_received"
  | "proof_uploaded"
  | "part_allocated"
  | "part_released";

// ============================================================
// MODELS
// ============================================================

export interface BufferStockItem {
  id: number;
  part_number: string;
  part_name: string;
  description: string;
  category: BufferStockCategory;
  category_display: string;
  brand: string;
  region: Region;
  region_display: string;
  qty_on_hand: number;
  qty_reserved: number;
  qty_in_transit: number;
  qty_available: number;
  reorder_level: number;
  unit_cost: number | null;
  storage_location: string;
  provided_by: string;
  last_replenished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSummary {
  id: number;
  full_name: string;
  role: string;
}

export interface OOWApproval {
  id: number;
  buffer_case: number;
  case_number: string;
  case_type: BufferCaseType;
  customer_name: string;
  part_name: string;
  region: Region;
  status: OOWApprovalStatus;
  requested_by: number;
  requested_by_name: string;
  approved_by: number | null;
  approved_by_name: string | null;
  approver_role: string;
  reason: string;
  requested_at: string;
  responded_at: string | null;
}

export interface CaseProof {
  id: number;
  buffer_case: number;
  proof_type: "image" | "video" | "document";
  file: string;
  description: string;
  uploaded_by: number;
  uploaded_by_name: string;
  uploaded_at: string;
}

export interface ReplenishmentOrder {
  id: number;
  order_number: string;
  buffer_case: number | null;
  case_number: string;
  buffer_stock_item: number;
  part_number: string;
  part_name: string;
  quantity: number;
  region: Region;
  status: ReplenishmentStatus;
  ordered_by: number;
  ordered_by_name: string;
  received_by: number | null;
  received_by_name: string | null;
  order_date: string | null;
  expected_delivery: string | null;
  received_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface BufferCase {
  id: number;
  case_number: string;
  case_id: string;
  case_type: BufferCaseType;
  case_type_display: string;
  status: BufferCaseStatus;
  status_display: string;
  region: Region;
  region_display: string;
  customer_name: string;
  customer_contact: string;
  customer_email: string;
  customer_address: string;
  product_name: string;
  serial_number: string;
  model_number: string;
  buffer_stock_item: number | null;
  buffer_stock_item_detail: BufferStockItem | null;
  part_number: string;
  part_name: string;
  qty_used: number;
  source_region: string;
  assigned_engineer: number | null;
  assigned_engineer_name: string | null;
  approved_by: number | null;
  approved_by_name: string | null;
  approved_at: string | null;
  resolution_summary: string;
  service_notes: string;
  proof_uploaded: boolean;
  proofs: CaseProof[];
  oow_approval: OOWApproval | null;
  replenishment: ReplenishmentOrder | null;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface InterRegionTransfer {
  id: number;
  transfer_number: string;
  buffer_stock_item: number;
  part_number: string;
  part_name: string;
  quantity: number;
  source_region: Region;
  source_region_display: string;
  destination_region: Region;
  destination_region_display: string;
  status: TransferStatus;
  status_display: string;
  related_case: number | null;
  requested_by: number;
  requested_by_name: string;
  approved_by: number | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rejection_reason: string;
  received_by: number | null;
  received_by_name: string | null;
  received_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface BufferAuditLog {
  id: number;
  action: AuditAction;
  action_display: string;
  entity_type: string;
  entity_id: number;
  actor: number | null;
  actor_name: string | null;
  details: Record<string, unknown>;
  region: string;
  created_at: string;
}

// ============================================================
// DASHBOARD
// ============================================================

export interface RegionStockSummary {
  region: string;
  region_display: string;
  total_items: number;
  total_qty: number;
  total_reserved: number;
  low_stock_count: number;
}

export interface BufferStockDashboard {
  total_stock_items: number;
  total_qty: number;
  low_stock_count: number;
  total_cases: number;
  open_cases: number;
  iw_cases: number;
  oow_cases: number;
  pending_approvals: number;
  cases_by_status: Partial<Record<BufferCaseStatus, number>>;
  pending_transfers: number;
  in_transit_transfers: number;
  pending_replenishments: number;
  region_stock: RegionStockSummary[];
}

// ============================================================
// FILTERS
// ============================================================

export interface BufferStockFilters {
  view?: "my_region" | "overall";
  region?: Region;
  search?: string;
  category?: BufferStockCategory;
  low_stock?: boolean;
  page?: number;
  per_page?: number;
}

export interface BufferCaseFilters {
  case_type?: BufferCaseType;
  status?: BufferCaseStatus;
  region?: Region;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface TransferFilters {
  status?: TransferStatus;
  page?: number;
  per_page?: number;
}

// ============================================================
// LABEL MAPS
// ============================================================

export const BUFFER_CASE_STATUS_LABELS: Record<BufferCaseStatus, string> = {
  created: "Created",
  pending_approval: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  part_allocated: "Part Allocated",
  transfer_requested: "Transfer Requested",
  engineer_assigned: "Engineer Assigned",
  in_progress: "In Progress",
  service_completed: "Service Completed",
  pending_replenishment: "Pending Replenishment",
  replenishment_ordered: "Replenishment Ordered",
  stock_replenished: "Stock Replenished",
  closed: "Closed",
  cancelled: "Cancelled",
};

export const BUFFER_CASE_TYPE_LABELS: Record<BufferCaseType, string> = {
  iw: "In-Warranty",
  oow: "Out-of-Warranty",
};

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  in_transit: "In Transit",
  received: "Received",
  cancelled: "Cancelled",
};

export const REPLENISHMENT_STATUS_LABELS: Record<ReplenishmentStatus, string> = {
  pending: "Pending",
  ordered: "Ordered",
  shipped: "Shipped",
  received: "Received",
  cancelled: "Cancelled",
};

export const BUFFER_CATEGORY_LABELS: Record<BufferStockCategory, string> = {
  print_head: "Print Head",
  toner: "Toner Cartridge",
  fuser: "Fuser Unit",
  drum: "Drum Unit",
  formatter: "Formatter Board",
  scanner: "Scanner Assembly",
  adf: "ADF Assembly",
  roller: "Roller Kit",
  power_supply: "Power Supply",
  other: "Other",
};

export const CASE_STATUS_COLORS: Record<BufferCaseStatus, string> = {
  created: "bg-slate-100 text-slate-700",
  pending_approval: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  part_allocated: "bg-blue-100 text-blue-700",
  transfer_requested: "bg-purple-100 text-purple-700",
  engineer_assigned: "bg-indigo-100 text-indigo-700",
  in_progress: "bg-cyan-100 text-cyan-700",
  service_completed: "bg-teal-100 text-teal-700",
  pending_replenishment: "bg-orange-100 text-orange-700",
  replenishment_ordered: "bg-yellow-100 text-yellow-700",
  stock_replenished: "bg-emerald-100 text-emerald-700",
  closed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export const TRANSFER_STATUS_COLORS: Record<TransferStatus, string> = {
  requested: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  in_transit: "bg-blue-100 text-blue-700",
  received: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-700",
};
