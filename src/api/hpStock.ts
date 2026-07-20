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
  good_part_number?: string;
  part_order_number?: string;
  so_number?: string;
  sn_number?: string;
  // Read-only: matched from the HP Stock RMA Part catalog by good_part_number.
  price?: number | null;
  warranty_trade?: string;
  part_shipment_status?: string;
  good_part_image?: string;
  good_part_image_back?: string;
  return_part_image?: string;
  return_part_ct_image?: string;
  return_box_front_image?: string;
  return_box_back_image?: string;
  return_box_corner_right_image?: string;
  return_box_corner_left_image?: string;
  return_box_corner_top_image?: string;
  return_box_corner_bottom_image?: string;
  return_option_image_1?: string;
  return_option_image_2?: string;
  return_option_image_3?: string;
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
    image?: string;
    image_back?: string;
    return_images?: Array<{ label: string; url: string }>;
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
  // Cases that have completed each stage (workflow only moves forward).
  good_part_photo_total?: number;
  return_part_photo_total?: number;
  issued_total?: number;
  handover_total?: number;
  // Part taken by an engineer but not yet handed back (ISSUED..DOA, before HANDOVER).
  pending_return_total?: number;
  // Part value bands — super-admin only (absent from everyone else's payload).
  part_value_low_total?: number;
  part_value_mid_total?: number;
  part_value_high_total?: number;
  part_value_critical_total?: number;
  regions: {
    region: string;
    total: number;
    active?: number;
    dc_cut_request?: number;
    closed?: number;
    good_part_photo?: number;
    return_part_photo?: number;
    issued?: number;
    handover?: number;
    pending_return?: number;
  }[];
}

export interface GetHPStockParams {
  page?: number;
  per_page?: number;
  search?: string;
  region?: string;
  view?: 'my_region' | 'overall';
  is_closed?: boolean | string;
  date?: string;
  warranty_trade?: string;
  part_shipment_status?: string;
  // Lists cases that have completed this stage (matches the summary stage counts).
  stage_done?: string;
  // Paired with stage_done: lists only cases that reached that stage on this day
  // (YYYY-MM-DD), from history — so a date-scoped stage card's rows match its count.
  stage_on_date?: string;
  // Lists cases in a part value band: LOW | MID | HIGH | CRITICAL (super-admin only).
  value_band?: string;
}

export interface HPStockFilterOptions {
  warranty_trade: string[];
  part_shipment_status: string[];
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

export const getHPStockSummary = async (view: 'my_region' | 'overall', region?: string, date?: string): Promise<HPStockSummary> => {
  // `date` (YYYY-MM-DD) switches the four stage cards to a day-based count: how many
  // cases reached that stage on that day (from history), instead of the all-time total.
  const { data } = await api.get('/hp-stock/items/summary/', { params: { view, region, date } });
  return data;
};

// Region-wise "Active Part Cases" count from the OpenCall Overview, pushed into
// inventory by OpenCall. Read-only — displayed on the HP Stock region cards.
export interface PartsCallCount {
  report_date: string; // YYYY-MM-DD
  region: string;
  count: number;
}

export const getPartsCallCounts = async (): Promise<PartsCallCount[]> => {
  const { data } = await api.get('/hp-stock/parts-call-counts/');
  return Array.isArray(data) ? data : (data?.results ?? []);
};

// Part value band counts across DC Cut requests only. Super-admin only — the API
// returns {} for everyone else.
export interface DCCutValueCounts {
  part_value_low_total?: number;
  part_value_mid_total?: number;
  part_value_high_total?: number;
  part_value_critical_total?: number;
  total?: number;
}

export const getHPStockDCCutValueCounts = async (region?: string): Promise<DCCutValueCounts> => {
  const { data } = await api.get('/hp-stock/items/dc_cut_value_counts/', { params: { region } });
  return data;
};

export const getHPStockFilterOptions = async (): Promise<HPStockFilterOptions> => {
  const { data } = await api.get('/hp-stock/items/filter_options/');
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
