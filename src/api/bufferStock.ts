import client from "./client";
import type { PaginatedResponse } from "@/types";
import type {
  BufferStockItem,
  BufferCase,
  InterRegionTransfer,
  OOWApproval,
  ReplenishmentOrder,
  BufferAuditLog,
  BufferStockDashboard,
  BufferStockFilters,
  BufferCaseFilters,
  TransferFilters,
} from "@/types/bufferStock";

const BASE = "/buffer-stock";

// ─── Dashboard ─────────────────────────────────────────────────────────────

export async function getBufferStockDashboard(): Promise<BufferStockDashboard> {
  const { data } = await client.get<BufferStockDashboard>(`${BASE}/dashboard/`);
  return data;
}

// ─── Stock Items ───────────────────────────────────────────────────────────

export async function getBufferStockItems(
  filters?: BufferStockFilters,
): Promise<PaginatedResponse<BufferStockItem>> {
  const { data } = await client.get<PaginatedResponse<BufferStockItem>>(
    `${BASE}/items/`,
    { params: filters },
  );
  return data;
}

export async function getBufferStockItem(id: number): Promise<BufferStockItem> {
  const { data } = await client.get<BufferStockItem>(`${BASE}/items/${id}/`);
  return data;
}

export async function createBufferStockItem(
  payload: Record<string, unknown>,
): Promise<BufferStockItem> {
  const { data } = await client.post<BufferStockItem>(`${BASE}/items/`, payload);
  return data;
}

export async function updateBufferStockItem(
  id: number,
  payload: Record<string, unknown>,
): Promise<BufferStockItem> {
  const { data } = await client.put<BufferStockItem>(`${BASE}/items/${id}/`, payload);
  return data;
}

export async function deleteBufferStockItem(id: number): Promise<void> {
  await client.delete(`${BASE}/items/${id}/`);
}

export async function adjustBufferStock(
  id: number,
  payload: { quantity: number; reason: string },
): Promise<BufferStockItem> {
  const { data } = await client.post<BufferStockItem>(
    `${BASE}/items/${id}/adjust/`,
    payload,
  );
  return data;
}

// ─── Cases ─────────────────────────────────────────────────────────────────

export async function getBufferCases(
  filters?: BufferCaseFilters,
): Promise<PaginatedResponse<BufferCase>> {
  const { data } = await client.get<PaginatedResponse<BufferCase>>(
    `${BASE}/cases/`,
    { params: filters },
  );
  return data;
}

export async function getBufferCase(id: number): Promise<BufferCase> {
  const { data } = await client.get<BufferCase>(`${BASE}/cases/${id}/`);
  return data;
}

export async function createBufferCase(
  payload: Record<string, unknown>,
): Promise<BufferCase> {
  const { data } = await client.post<BufferCase>(`${BASE}/cases/`, payload);
  return data;
}

export async function updateBufferCase(
  id: number,
  payload: Record<string, unknown>,
): Promise<BufferCase> {
  const { data } = await client.put<BufferCase>(`${BASE}/cases/${id}/`, payload);
  return data;
}

export async function allocatePart(
  caseId: number,
  payload: { buffer_stock_item_id: number; qty_used: number },
): Promise<BufferCase> {
  const { data } = await client.post<BufferCase>(
    `${BASE}/cases/${caseId}/allocate-part/`,
    payload,
  );
  return data;
}

export async function assignEngineer(
  caseId: number,
  engineerId: number,
): Promise<BufferCase> {
  const { data } = await client.post<BufferCase>(
    `${BASE}/cases/${caseId}/assign-engineer/`,
    { engineer_id: engineerId },
  );
  return data;
}

export async function transitionCase(
  caseId: number,
  toStatus: string,
  comment?: string,
): Promise<BufferCase> {
  const { data } = await client.post<BufferCase>(
    `${BASE}/cases/${caseId}/transition/`,
    { to_status: toStatus, comment },
  );
  return data;
}

export async function completeService(
  caseId: number,
  payload: { resolution_summary: string; service_notes?: string },
): Promise<BufferCase> {
  const { data } = await client.post<BufferCase>(
    `${BASE}/cases/${caseId}/complete-service/`,
    payload,
  );
  return data;
}

export async function triggerReplenishment(caseId: number): Promise<BufferCase> {
  const { data } = await client.post<BufferCase>(
    `${BASE}/cases/${caseId}/trigger-replenishment/`,
  );
  return data;
}

export async function uploadProof(
  caseId: number,
  formData: FormData,
): Promise<unknown> {
  const { data } = await client.post(
    `${BASE}/cases/${caseId}/upload-proof/`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}

// ─── OOW Approvals ─────────────────────────────────────────────────────────

export async function getOOWApprovals(
  filters?: { status?: string; page?: number; per_page?: number },
): Promise<PaginatedResponse<OOWApproval>> {
  const { data } = await client.get<PaginatedResponse<OOWApproval>>(
    `${BASE}/approvals/`,
    { params: filters },
  );
  return data;
}

export async function actionOOWApproval(
  id: number,
  payload: { action: "approve" | "reject"; reason: string },
): Promise<OOWApproval> {
  const { data } = await client.post<OOWApproval>(
    `${BASE}/approvals/${id}/action/`,
    payload,
  );
  return data;
}

// ─── Transfers ─────────────────────────────────────────────────────────────

export async function getTransfers(
  filters?: TransferFilters,
): Promise<PaginatedResponse<InterRegionTransfer>> {
  const { data } = await client.get<PaginatedResponse<InterRegionTransfer>>(
    `${BASE}/transfers/`,
    { params: filters },
  );
  return data;
}

export async function getTransfer(id: number): Promise<InterRegionTransfer> {
  const { data } = await client.get<InterRegionTransfer>(`${BASE}/transfers/${id}/`);
  return data;
}

export async function createTransfer(
  payload: Record<string, unknown>,
): Promise<InterRegionTransfer> {
  const { data } = await client.post<InterRegionTransfer>(
    `${BASE}/transfers/`,
    payload,
  );
  return data;
}

export async function approveTransfer(id: number): Promise<InterRegionTransfer> {
  const { data } = await client.post<InterRegionTransfer>(
    `${BASE}/transfers/${id}/approve/`,
  );
  return data;
}

export async function rejectTransfer(
  id: number,
  reason: string,
): Promise<InterRegionTransfer> {
  const { data } = await client.post<InterRegionTransfer>(
    `${BASE}/transfers/${id}/reject/`,
    { reason },
  );
  return data;
}

export async function markTransferInTransit(id: number): Promise<InterRegionTransfer> {
  const { data } = await client.post<InterRegionTransfer>(
    `${BASE}/transfers/${id}/in-transit/`,
  );
  return data;
}

export async function receiveTransfer(id: number): Promise<InterRegionTransfer> {
  const { data } = await client.post<InterRegionTransfer>(
    `${BASE}/transfers/${id}/receive/`,
  );
  return data;
}

// ─── Replenishment ─────────────────────────────────────────────────────────

export async function getReplenishments(
  filters?: { status?: string; region?: string; page?: number; per_page?: number },
): Promise<PaginatedResponse<ReplenishmentOrder>> {
  const { data } = await client.get<PaginatedResponse<ReplenishmentOrder>>(
    `${BASE}/replenishments/`,
    { params: filters },
  );
  return data;
}

export async function receiveReplenishment(id: number): Promise<ReplenishmentOrder> {
  const { data } = await client.post<ReplenishmentOrder>(
    `${BASE}/replenishments/${id}/receive/`,
  );
  return data;
}

// ─── Audit Logs ────────────────────────────────────────────────────────────

export async function getAuditLogs(
  filters?: { action?: string; entity_type?: string; region?: string; page?: number; per_page?: number; entity_id?: number },
): Promise<PaginatedResponse<BufferAuditLog>> {
  const { data } = await client.get<PaginatedResponse<BufferAuditLog>>(
    `${BASE}/audit-logs/`,
    { params: filters },
  );
  return data;
}
