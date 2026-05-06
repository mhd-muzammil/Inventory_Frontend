import client from "./client";
import { buildParams } from "@/lib/utils";
import type { PartRequest, PartRequestFilters, PaginatedResponse } from "@/types";

export async function getPartRequests(filters?: PartRequestFilters): Promise<PaginatedResponse<PartRequest>> {
  const params = buildParams(filters ?? {});
  const { data } = await client.get<PaginatedResponse<PartRequest>>("/part-requests/", { params });
  return data;
}

export async function getPartRequest(id: number | string): Promise<PartRequest> {
  const { data } = await client.get<PartRequest>(`/part-requests/${id}/`);
  return data;
}

export async function createPartRequest(payload: Record<string, unknown>): Promise<PartRequest> {
  const { data } = await client.post<PartRequest>("/part-requests/", payload);
  return data;
}

export async function updatePartRequest(id: number | string, payload: Record<string, unknown>): Promise<PartRequest> {
  const { data } = await client.put<PartRequest>(`/part-requests/${id}/`, payload);
  return data;
}

export async function approvePartRequest(id: number | string, comment?: string): Promise<PartRequest> {
  const { data } = await client.post<PartRequest>(`/part-requests/${id}/approve/`, { comment });
  return data;
}

export async function rejectPartRequest(id: number | string, rejection_reason: string): Promise<PartRequest> {
  const { data } = await client.post<PartRequest>(`/part-requests/${id}/reject/`, { rejection_reason });
  return data;
}

export async function getPendingPartRequests(): Promise<PaginatedResponse<PartRequest>> {
  const { data } = await client.get<PaginatedResponse<PartRequest>>("/part-requests/pending/");
  return data;
}
