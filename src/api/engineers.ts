import client from "./client";
import type { Engineer } from "@/types";

export interface CreateEngineerPayload {
  name: string;
  email?: string;
  phone?: string;
  region?: string;
  status?: string;
}

export interface UpdateEngineerPayload {
  name?: string;
  email?: string;
  phone?: string;
  region?: string;
  status?: string;
}

/** List engineers (region-scoped for management). */
export async function getEngineers(): Promise<Engineer[]> {
  const { data } = await client.get<Engineer[]>("/auth/engineers/");
  return data;
}

/** List active engineers for assignment dropdown, filtered by ticket region. */
export async function getEngineersForAssignment(region?: string): Promise<Engineer[]> {
  const params = region ? { region } : {};
  const { data } = await client.get<Engineer[]>("/users/engineers/", { params });
  return data;
}

/** Create a new engineer. */
export async function createEngineer(payload: CreateEngineerPayload): Promise<Engineer> {
  const { data } = await client.post<Engineer>("/auth/engineers/", payload);
  return data;
}

/** Update an existing engineer. */
export async function updateEngineer(id: number, payload: UpdateEngineerPayload): Promise<Engineer> {
  const { data } = await client.put<Engineer>(`/auth/engineers/${id}/`, payload);
  return data;
}

/** Deactivate an engineer (soft delete). */
export async function deleteEngineer(id: number): Promise<void> {
  await client.delete(`/auth/engineers/${id}/`);
}
