import client from "./client";
import { buildParams } from "@/lib/utils";
import type { Quotation, QuotationFilters, PaginatedResponse, QuotationSummary } from "@/types";
import { validators } from "tailwind-merge";

export async function getQuotationSummary(): Promise<QuotationSummary> {
  const { data } = await client.get<QuotationSummary>("/quotations/summary/");
  return data;
}

export async function getQuotations(filters?: QuotationFilters): Promise<PaginatedResponse<Quotation>> {
  const params = buildParams(filters ?? {});
  const { data } = await client.get<PaginatedResponse<Quotation>>("/quotations/", { params });
  return data;
}

export async function getQuotation(id: number | string): Promise<Quotation> {
  const { data } = await client.get<Quotation>(`/quotations/${id}/`);
  return data;
}

export async function createQuotation(payload: Record<string, unknown>): Promise<Quotation> {
  const { data } = await client.post<Quotation>("/quotations/", payload);
  return data;
}

export async function updateQuotation(id: number | string, payload: Record<string, unknown>): Promise<Quotation> {
  const { data } = await client.put<Quotation>(`/quotations/${id}/`, payload);
  return data;
}

export async function sendQuotation(id: number | string): Promise<Quotation> {
  const { data } = await client.post<Quotation>(`/quotations/${id}/send/`);
  return data;
}

export async function recordCustomerResponse(
  id: number | string,
  payload: { response: "approved" | "rejected"; reason?: string },
): Promise<Quotation> {
  const { data } = await client.post<Quotation>(`/quotations/${id}/customer-response/`, payload);
  return data;
}
