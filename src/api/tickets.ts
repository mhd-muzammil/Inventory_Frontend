import client from "./client";
import { buildParams } from "@/lib/utils";
import type {
  Ticket,
  TimelineEntry,
  AvailableTransition,
  TicketFilters,
  PaginatedResponse,
} from "@/types";

// ── List & CRUD ──────────────────────────────────────────────

export async function getTickets(filters?: TicketFilters): Promise<PaginatedResponse<Ticket>> {
  const params = buildParams(filters ?? {});
  const { data } = await client.get<PaginatedResponse<Ticket>>("/tickets/", { params });
  return data;
}

export async function getTicket(id: number | string): Promise<Ticket> {
  const { data } = await client.get<Ticket>(`/tickets/${id}/`);
  return data;
}

export async function createTicket(payload: Record<string, unknown>): Promise<Ticket> {
  const { data } = await client.post<Ticket>("/tickets/", payload);
  return data;
}

export async function updateTicket(id: number | string, payload: Record<string, unknown>): Promise<Ticket> {
  const { data } = await client.put<Ticket>(`/tickets/${id}/`, payload);
  return data;
}

export async function deleteTicket(id: number | string): Promise<void> {
  await client.delete(`/tickets/${id}/`);
}

// ── Workflow Transitions ─────────────────────────────────────

export async function transitionTicket(
  id: number | string,
  payload: { to_status: string; comment?: string; assignee_id?: number; engineer_id?: number; metadata?: Record<string, unknown> },
): Promise<Ticket> {
  const { data } = await client.post<Ticket>(`/tickets/${id}/transition/`, payload);
  return data;
}

export async function getAvailableTransitions(id: number | string): Promise<AvailableTransition[]> {
  const { data } = await client.get<AvailableTransition[]>(`/tickets/${id}/transitions/`);
  return data;
}

// ── Timeline ─────────────────────────────────────────────────

export async function getTicketTimeline(id: number | string): Promise<TimelineEntry[]> {
  const { data } = await client.get<TimelineEntry[]>(`/tickets/${id}/timeline/`);
  return data;
}

// ── OTP ──────────────────────────────────────────────────────

export async function sendOTP(phone: string): Promise<void> {
  await client.post("/tickets/send-otp/", { phone });
}

export async function verifyOTPAndSubmit(
  phone: string,
  otp: string,
  formData: Record<string, unknown>,
): Promise<Ticket> {
  const { data } = await client.post<Ticket>("/tickets/verify-and-submit/", {
    phone,
    otp,
    form_data: formData,
  });
  return data;
}

// ── Special Queries ──────────────────────────────────────────

export async function getMyQueue(): Promise<Ticket[]> {
  const { data } = await client.get<Ticket[]>("/tickets/my-queue/");
  return data;
}

export async function getBreachedTickets(): Promise<Ticket[]> {
  const { data } = await client.get<Ticket[]>("/tickets/breached/");
  return data;
}
