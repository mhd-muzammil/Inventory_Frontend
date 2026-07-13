import client from "./client";

export interface SubAdmin {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  region: string;
  region_display: string;
  is_active: boolean;
  // Section paths this user may open (see @/lib/sections).
  allowed_sections?: string[];
}

export interface CreateSubAdminPayload {
  username: string;
  password: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  region: string;
  allowed_sections?: string[];
}

export async function getSubAdmins(): Promise<SubAdmin[]> {
  const { data } = await client.get<SubAdmin[]>("/auth/sub-admins/");
  return data;
}

export async function createSubAdmin(payload: CreateSubAdminPayload): Promise<SubAdmin> {
  const { data } = await client.post<SubAdmin>("/auth/sub-admins/", payload);
  return data;
}

export async function updateSubAdmin(id: number, payload: Partial<CreateSubAdminPayload>): Promise<SubAdmin> {
  const { data } = await client.put<SubAdmin>(`/auth/sub-admins/${id}/`, payload);
  return data;
}

export async function deleteSubAdmin(id: number): Promise<void> {
  await client.delete(`/auth/sub-admins/${id}/`);
}
