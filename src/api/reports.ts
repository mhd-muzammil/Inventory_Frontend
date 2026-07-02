import client from "./client";
import type { CategoryBreakdown } from "@/types";

export interface ReportSummary {
  rtpl: {
    inventory_value: number;
    total_inflow: number;
    total_outflow: number;
    category_count: number;
  };
  hp_stock: {
    total_items: number;
    pending: number;
    stock_check: number;
    issued: number;
    defective: number;
    closed: number;
  };
  buffer_stock: {
    total_parts: number;
    total_quantity: number;
    usable: number;
    defective: number;
    taken_by_engineer: number;
  };
}

export interface RecentMovement {
  id: number;
  part_number: string;
  part_name: string;
  movement_type: string;
  quantity: number;
  performed_by: string;
  notes: string;
  created_at: string;
}

export interface HPEvent {
  id: number;
  case_id: string;
  work_order_id: string;
  status: string;
  status_display: string;
  engineer_name: string;
  region: string;
  created_by: string;
  updated_at: string;
}

export interface BufferEvent {
  id: number;
  part_number: string;
  part_name: string;
  quantity: number;
  status: string;
  status_display: string;
  engineer_name: string;
  region: string;
  created_by: string;
  created_at: string;
}

export interface UnifiedRecentMovements {
  rtpl: RecentMovement[];
  hp: HPEvent[];
  buffer: BufferEvent[];
}

export async function getSummary(): Promise<ReportSummary> {
  const { data } = await client.get<ReportSummary>("/reports/summary");
  return data;
}

export async function getByCategory(): Promise<CategoryBreakdown[]> {
  const { data } = await client.get<CategoryBreakdown[]>("/reports/by-category");
  return data;
}

export async function getRecentMovements(): Promise<UnifiedRecentMovements> {
  const { data } = await client.get<UnifiedRecentMovements>("/reports/recent-movements");
  return data;
}
