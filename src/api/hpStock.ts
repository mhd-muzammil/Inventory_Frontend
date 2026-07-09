import api from './client';
import type { PaginationMeta } from '@/types';

export interface HPStockItem {
  id: number;
  case_id: string;
  work_order_id: string;
  delivery_no: string;
  service_event_no: string;
  material_order_no: string;
  hp_sales_order_no: string;
  gvrma_no: string;
  good_part_image?: string;
  good_part_image_back?: string;
  return_part_image?: string;
  dc_cut_request_message?: string;
  dc_cut_approved?: boolean;
  dc_cut_chat?: Array<{
    sender: string;
    message: string;
    timestamp: string;
  }>;
  region: string;
  status: string;
  engineer_name: string;
  engineer_phone?: string;
  part_description?: string;
  customer_name?: string;
  inventory_details?: string;
  opencall_case_details?: Record<string, any>;
  created_by_name?: string;
  transition_history?: Array<{
    from_status: string;
    to_status: string;
    comment: string;
    updated_by: string;
    timestamp: string;
    engineer_name?: string;
    engineer_phone?: string;
  }>;
  created_at: string;
  updated_at: string;
  case_created_time?: string;
}

export interface HPStockSummary {
  total: number;
  active_total?: number;
  dc_cut_request_total?: number;
  closed_total?: number;
  regions: { region: string; total: number; active?: number; dc_cut_request?: number; closed?: number }[];
}

export interface GetHPStockParams {
  page?: number;
  per_page?: number;
  search?: string;
  region?: string;
  view?: 'my_region' | 'overall';
  is_closed?: boolean | string;
  date?: string;
}

export interface GetHPStockResponse {
  items: HPStockItem[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export const getHPStockItems = async (params?: GetHPStockParams): Promise<GetHPStockResponse> => {
  const { data } = await api.get('/hp-stock/items/', { params });
  return {
    items: data.items,
    total: data.total,
    page: data.page,
    per_page: data.per_page,
    pages: data.pages,
  };
};

export const getHPStockSummary = async (view: 'my_region' | 'overall', region?: string): Promise<HPStockSummary> => {
  const { data } = await api.get('/hp-stock/items/summary/', { params: { view, region } });
  return data;
};

export const createHPStockItem = async (payload: Partial<HPStockItem> | FormData): Promise<HPStockItem> => {
  const { data } = await api.post('/hp-stock/items/', payload, {
    headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
  });
  return data;
};

export const updateHPStockItem = async (id: number, payload: Partial<HPStockItem> | FormData): Promise<HPStockItem> => {
  const { data } = await api.patch(`/hp-stock/items/${id}/`, payload, {
    headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
  });
  return data;
};

export const deleteHPStockItem = async (id: number): Promise<void> => {
  await api.delete(`/hp-stock/items/${id}/`);
};

export const transitionHPStockItem = async (
  id: number,
  payload: { engineer_name?: string; engineer_phone?: string; otp?: string; remarks?: string; to_status?: string; dc_cut_request_message?: string } | FormData
): Promise<HPStockItem> => {
  const { data } = await api.post(`/hp-stock/items/${id}/transition/`, payload, {
    headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
  });
  return data;
};

export const sendHPStockOTP = async (
  id: number,
  payload: { phone: string; to_status: string }
): Promise<{ otp: string; whatsapp_url: string; detail: string }> => {
  const { data } = await api.post(`/hp-stock/items/${id}/send_otp/`, payload);
  return data;
};

export const approveHPStockDCCut = async (id: number): Promise<HPStockItem> => {
  const { data } = await api.post(`/hp-stock/items/${id}/approve_dc_cut/`);
  return data;
};

export const sendHPStockDCCutChatMessage = async (id: number, message: string): Promise<HPStockItem> => {
  const { data } = await api.post(`/hp-stock/items/${id}/send_dc_cut_chat_message/`, { message });
  return data;
};
