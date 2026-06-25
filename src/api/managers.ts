import client from "./client";

export interface Manager {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  region: string;
  region_display: string;
  is_active: boolean;
  allowed_sections?: string[];
}

export interface CreateManagerPayload {
  username: string;
  password: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  region?: string;
  allowed_sections?: string[];
  is_active?: boolean;
}

export async function getManagers(): Promise<Manager[]> {
  const { data } = await client.get<Manager[]>("/auth/managers/");
  return data;
}

export async function createManager(payload: CreateManagerPayload): Promise<Manager> {
  const { data } = await client.post<Manager>("/auth/managers/", payload);
  return data;
}

export async function updateManager(id: number, payload: Partial<CreateManagerPayload>): Promise<Manager> {
  const { data } = await client.put<Manager>(`/auth/managers/${id}/`, payload);
  return data;
}

export async function deleteManager(id: number): Promise<void> {
  await client.delete(`/auth/managers/${id}/`);
}
