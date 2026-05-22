import client from "./client";
import type { Customer, PaginatedResponse, CustomerQueryParams } from "@/types";

export async function getCustomers(params?: CustomerQueryParams): Promise<PaginatedResponse<Customer>> {
  const { data } = await client.get<PaginatedResponse<Customer>>("/customers/", { params });
  return data;
}

export async function getCustomer(id: string): Promise<Customer> {
  const { data } = await client.get<Customer>(`/customers/${id}/`);
  return data;
}

export async function createCustomer(payload: Partial<Customer>): Promise<Customer> {
  const { data } = await client.post<Customer>("/customers/", payload);
  return data;
}

export async function updateCustomer(id: string, payload: Partial<Customer>): Promise<Customer> {
  const { data } = await client.put<Customer>(`/customers/${id}/`, payload);
  return data;
}

export async function deleteCustomer(id: string): Promise<void> {
  await client.delete(`/customers/${id}/`);
}

