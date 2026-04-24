import client from "./client";
import type { BufferPart, PaginatedResponse } from "@/types";

export async function getBufferParts(filters?: {
  search?: string;
  page?: number;
  per_page?: number;
  view?: "my_region" | "overall";
  region?: string;
}): Promise<PaginatedResponse<BufferPart>> {
  const { data } = await client.get<PaginatedResponse<BufferPart>>("/buffer-parts/", { params: filters });
  return data;
}

export async function createBufferPart(payload: {
  part_number: string;
  part_name: string;
  quantity: number;
  general_name?: string;
  region?: string;
}): Promise<BufferPart> {
  const { data } = await client.post<BufferPart>("/buffer-parts/", payload);
  return data;
}

export async function updateBufferPart(id: number, payload: Record<string, unknown>): Promise<BufferPart> {
  const { data } = await client.put<BufferPart>(`/buffer-parts/${id}/`, payload);
  return data;
}

export async function deleteBufferPart(id: number): Promise<void> {
  await client.delete(`/buffer-parts/${id}/`);
}

// ── Summary ──────────────────────────────────────────────────

export interface BufferPartSummary {
  regions: { region: string; total: number }[];
  total: number;
}

export async function getBufferPartSummary(view?: "my_region" | "overall", region?: string): Promise<BufferPartSummary> {
  const params: Record<string, string> = {};
  if (view) params.view = view;
  if (region) params.region = region;
  
  const { data } = await client.get<BufferPartSummary>("/buffer-parts/summary/", { params });
  return data;
}

