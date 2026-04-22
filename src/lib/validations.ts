import { z } from "zod/v4";

// ============================================================
// TICKET (CSO ENTRY) SCHEMA
// ============================================================

export const ticketSchema = z.object({
  // Work Order
  work_order: z.string().optional().default(""),
  // Customer Info
  cust_name: z.string().min(1, "Customer name is required"),
  cust_contact: z.string().optional().default(""),
  cust_email: z.string().email("Invalid email").optional().or(z.literal("")),
  cust_address: z.string().optional().default(""),
  location: z.string().optional().default(""),
  // Product Info
  product_name: z.string().optional().default(""),
  serial_number: z.string().optional().default(""),
  model_number: z.string().optional().default(""),
  brand: z.string().optional().default(""),
  case_id: z.string().nullable().optional(),
  condition_received: z.string().optional().default(""),
  // Service
  service_type: z.enum(["warranty", "non_warranty", "doc", "amc", "rental"]).default("warranty"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  region: z.enum(["vellore", "salem", "chennai", "kanchipuram", "hosur"]).optional(),
  issue_description: z.string().optional().default(""),
  // Dates
  cso_date: z.string().nullable().optional(),
  arrival_date: z.string().nullable().optional(),
  target_completion: z.string().nullable().optional(),
  // Part Details
  part_number: z.string().optional().default(""),
  part_usage: z.string().optional().default(""),
  failure_code: z.string().optional().default(""),
  part_description: z.string().optional().default(""),
  qty: z.coerce.number().min(0).optional().default(0),
  ct_code: z.string().optional().default(""),
  so_req_id: z.string().optional().default(""),
  removed_part_sno: z.string().optional().default(""),
  installed_part_sno: z.string().optional().default(""),
  // Engineer / Resolution
  engineer_name: z.string().optional().default(""),
  hp_id: z.string().optional().default(""),
  resolution_summary: z.string().optional().default(""),
  explanation: z.string().optional().default(""),
  customer_comments: z.string().optional().default(""),
});

export type TicketFormData = z.infer<typeof ticketSchema>;

// ============================================================
// DIAGNOSIS SCHEMA (Engineer fills during diagnosis)
// ============================================================

export const diagnosisSchema = z.object({
  requires_parts: z.boolean(),
  resolution_summary: z.string().optional().default(""),
  // Part details (if requires_parts)
  part_number: z.string().optional().default(""),
  part_usage: z.string().optional().default(""),
  failure_code: z.string().optional().default(""),
  part_description: z.string().optional().default(""),
  qty: z.coerce.number().min(0).default(0),
  ct_code: z.string().optional().default(""),
  explanation: z.string().optional().default(""),
});

export type DiagnosisFormData = z.infer<typeof diagnosisSchema>;

// ============================================================
// TRANSITION SCHEMA
// ============================================================

export const transitionSchema = z.object({
  to_status: z.string().min(1, "Target status is required"),
  comment: z.string().optional().default(""),
  assignee_id: z.coerce.number().optional(),
});

export type TransitionFormData = z.infer<typeof transitionSchema>;

// ============================================================
// PART REQUEST SCHEMA
// ============================================================

export const partRequestSchema = z.object({
  ticket_id: z.coerce.number().min(1, "Ticket is required"),
  part_number: z.string().min(1, "Part number is required"),
  part_name: z.string().min(1, "Part name is required"),
  description: z.string().optional().default(""),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  urgency: z.enum(["normal", "urgent", "critical"]).default("normal"),
  estimated_cost: z.coerce.number().min(0).optional(),
});

export type PartRequestFormData = z.infer<typeof partRequestSchema>;

// ============================================================
// QUOTATION SCHEMA
// ============================================================

export const quotationItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(1, "Min 1"),
  unit_price: z.coerce.number().min(0, "Min 0"),
  total: z.coerce.number(),
  part_request_id: z.coerce.number().optional(),
});

export const quotationSchema = z.object({
  ticket_id: z.coerce.number().min(1, "Ticket is required"),
  items: z.array(quotationItemSchema).min(1, "At least one item required"),
  labor_cost: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  tax_percent: z.coerce.number().min(0).default(18),
  valid_until: z.string().optional(),
  notes: z.string().optional().default(""),
});

export type QuotationFormData = z.infer<typeof quotationSchema>;

// ============================================================
// PURCHASE ORDER SCHEMA
// ============================================================

export const poItemSchema = z.object({
  part_request_id: z.coerce.number().optional(),
  part_number: z.string().min(1, "Part number is required"),
  part_name: z.string().min(1, "Part name is required"),
  quantity: z.coerce.number().min(1),
  unit_price: z.coerce.number().min(0).optional(),
});

export const purchaseOrderSchema = z.object({
  supplier_name: z.string().min(1, "Supplier name is required"),
  supplier_contact: z.string().optional().default(""),
  supplier_email: z.string().email("Invalid email").optional().or(z.literal("")),
  items: z.array(poItemSchema).min(1, "At least one item required"),
  expected_delivery: z.string().optional(),
  notes: z.string().optional().default(""),
});

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

// ============================================================
// STOCK SCHEMA
// ============================================================

export const stockItemSchema = z.object({
  part_number: z.string().min(1, "Part number is required"),
  part_name: z.string().min(1, "Part name is required"),
  description: z.string().optional().default(""),
  category: z.string().optional().default(""),
  brand: z.string().optional().default(""),
  qty_on_hand: z.coerce.number().min(0).default(0),
  reorder_level: z.coerce.number().min(0).default(5),
  reorder_qty: z.coerce.number().min(0).default(10),
  unit_cost: z.coerce.number().min(0).optional(),
  storage_location: z.string().optional().default(""),
});

export type StockItemFormData = z.infer<typeof stockItemSchema>;

export const stockAdjustSchema = z.object({
  quantity: z.coerce.number(),
  reason: z.string().min(1, "Reason is required"),
});

export type StockAdjustFormData = z.infer<typeof stockAdjustSchema>;

// ============================================================
// BUFFER SCHEMA
// ============================================================

export const bufferSchema = z.object({
  stock_item_id: z.coerce.number().min(1, "Stock item is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  reason: z.string().optional().default(""),
  reserved_for_ticket_id: z.coerce.number().optional(),
  expires_at: z.string().optional(),
});

export type BufferFormData = z.infer<typeof bufferSchema>;

export const bufferPartSchema = z.object({
  part_number: z.string().min(1, "Part number is required"),
  part_name: z.string().min(1, "Part name is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  general_name: z.string().optional().default(""),
  region: z.string().optional().default(""),
});

export type BufferPartFormData = z.infer<typeof bufferPartSchema>;

// ============================================================
// INVOICE SCHEMA
// ============================================================

export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(1),
  unit_price: z.coerce.number().min(0),
  total: z.coerce.number(),
});

export const invoiceSchema = z.object({
  ticket_id: z.coerce.number().min(1, "Ticket is required"),
  quotation_id: z.coerce.number().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item required"),
  discount: z.coerce.number().min(0).default(0),
  tax_percent: z.coerce.number().min(0).default(18),
  due_date: z.string().optional(),
  notes: z.string().optional().default(""),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

export const paymentSchema = z.object({
  payment_method: z.string().min(1, "Payment method is required"),
  paid_amount: z.coerce.number().min(0.01, "Amount must be > 0"),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

// ============================================================
// ENGINEER SCHEMA
// ============================================================

export const engineerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  phone: z.string().optional().default(""),
  region: z.enum(["vellore", "salem", "chennai", "kanchipuram", "hosur"]).optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type EngineerFormData = z.infer<typeof engineerSchema>;

// ============================================================
// CUSTOMER SCHEMA (keep existing)
// ============================================================

export const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone must be at least 10 characters"),
  company: z.string().min(2, "Company must be at least 2 characters"),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

// ============================================================
// AUTH SCHEMAS (keep existing)
// ============================================================

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
