import client from "./client";
import type { BufferEntry } from "@/types";

export async function getBufferEntries(): Promise<BufferEntry[]> {
  const { data } = await client.get<{ items: BufferEntry[] } | BufferEntry[]>("/buffer/");
  // Backend returns paginated { items: [...] } format
  if (Array.isArray(data)) return data;
  return data.items ?? [];
}

export async function createBufferEntry(payload: Record<string, unknown>): Promise<BufferEntry> {
  const { data } = await client.post<BufferEntry>("/buffer/", payload);
  return data;
}

export async function updateBufferEntry(id: number | string, payload: Record<string, unknown>): Promise<BufferEntry> {
  const { data } = await client.put<BufferEntry>(`/buffer/${id}/`, payload);
  return data;
}

export async function releaseBufferEntry(id: number | string): Promise<void> {
  await client.delete(`/buffer/${id}/`);
}
