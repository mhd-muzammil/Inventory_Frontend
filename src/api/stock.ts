import client from "./client";
import { buildParams } from "@/lib/utils";
import type { StockItem, StockMovement, StockFilters, PaginatedResponse } from "@/types";

export async function getStockItems(filters?: StockFilters): Promise<PaginatedResponse<StockItem>> {
  const params = buildParams(filters ?? {});
  const { data } = await client.get<PaginatedResponse<StockItem>>("/stock/", { params });
  return data;
}

export async function getStockItem(id: number | string): Promise<StockItem> {
  const { data } = await client.get<StockItem>(`/stock/${id}/`);
  return data;
}

export async function createStockItem(payload: Record<string, unknown>): Promise<StockItem> {
  const { data } = await client.post<StockItem>("/stock/", payload);
  return data;
}

export async function updateStockItem(id: number | string, payload: Record<string, unknown>): Promise<StockItem> {
  const { data } = await client.put<StockItem>(`/stock/${id}/`, payload);
  return data;
}

export async function getStockMovements(stockItemId: number | string): Promise<StockMovement[]> {
  const { data } = await client.get<StockMovement[]>(`/stock/${stockItemId}/movements/`);
  return data;
}

export async function reserveStock(
  stockItemId: number | string,
  payload: { quantity: number; ticket_id: number },
): Promise<void> {
  await client.post(`/stock/${stockItemId}/reserve/`, payload);
}

export async function releaseStock(
  stockItemId: number | string,
  payload: { quantity: number; ticket_id: number },
): Promise<void> {
  await client.post(`/stock/${stockItemId}/release/`, payload);
}

export async function adjustStock(payload: {
  stock_item_id: number;
  quantity: number;
  reason: string;
}): Promise<void> {
  await client.post("/stock/adjust/", payload);
}

export async function getLowStock(): Promise<StockItem[]> {
  const { data } = await client.get<{ items: StockItem[] } | StockItem[]>("/stock/low/");
  if (Array.isArray(data)) return data;
  return data.items ?? [];
}

export async function searchStock(query: string): Promise<StockItem[]> {
  const { data } = await client.get<{ items: StockItem[] } | StockItem[]>("/stock/search/", { params: { q: query } });
  if (Array.isArray(data)) return data;
  return data.items ?? [];
}
