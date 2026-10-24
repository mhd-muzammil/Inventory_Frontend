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
  // Has the spare physically landed? Mirrored from Flex's Good Part Installed
  // Status every sync, or set at the receiving desk. "" means nobody classified
  // it yet, which is treated as visible, never as absent.
  part_received_status?: '' | 'RECEIVED' | 'IN_TRANSIT';
  part_received_source?: '' | 'FLEX' | 'MANUAL';
  part_received_at?: string | null;
  part_received_by_name?: string;
  // Raw last-seen Flex value, never sticky - the audit trail behind a mismatch.
  flex_installed_status?: string;
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
  // Rows the received-spare filter is hiding right now (0 when it is off).
  in_transit_total?: number;
  received_spare_only?: boolean;
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
    in_transit?: number;
  }[];
}

export interface GetHPStockParams {
  page?: number;
  per_page?: number;
  search?: string;
  region?: string;
  view?: 'my_region' | 'overall';
  // 'true' closed | 'dc_cut_request' | 'false' active | 'in_transit' receiving desk
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
  // How many work orders the listed parts belong to (`total` counts parts).
  work_orders?: number;
}

export const getHPStockItems = async (params?: GetHPStockParams): Promise<GetHPStockResponse> => {
  const { data } = await api.get('/hp-stock/items/', { params });
  return {
    items: data.items,
    total: data.total,
    page: data.page,
    per_page: data.per_page,
    pages: data.pages,
    work_orders: data.work_orders,
  };
};

// One item in full. The table's rows leave out inventory_details (a case's whole
// OpenCall report history, up to ~1 MB), so the case details popup loads it here.
export const getHPStockItem = async (id: number): Promise<HPStockItem> => {
  const { data } = await api.get(`/hp-stock/items/${id}/`);
  return data;
};

export const getHPStockSummary = async (view: 'my_region' | 'overall', region?: string, date?: string, listDate?: string): Promise<HPStockSummary> => {
  // `date` (YYYY-MM-DD) switches the four stage cards to a day-based count: how many
  // cases reached that stage on that day (from history), instead of the all-time total.
  // `listDate` is the table's day: the In Transit badge and the region cards' DC Cut /
  // Closed numbers then count that day's snapshot, like the tabs.
  const { data } = await api.get('/hp-stock/items/summary/', { params: { view, region, date, list_date: listDate } });
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

// Tick spares off at the receiving desk. The courier drops a batch, so this takes
// a list - and it is what stops an employee waiting up to 15 minutes for the next
// Flex export before they can work a part that is already in their hand.
export const markHPStockReceived = async (
  ids: number[]
): Promise<{ updated: number; requested: number }> => {
  const { data } = await api.post('/hp-stock/items/mark_received/', { ids });
  return data;
};

// Org-wide HP Stock display rules. `can_edit` mirrors the server's role check, so
// the UI can show the switch to everyone but only let admins move it.
export interface HPStockSettings {
  received_spare_only: boolean;
  updated_by_name?: string;
  updated_at?: string;
  can_edit?: boolean;
}

export const getHPStockSettings = async (): Promise<HPStockSettings> => {
  const { data } = await api.get('/hp-stock/settings/');
  return data;
};

export const updateHPStockSettings = async (
  payload: Partial<Pick<HPStockSettings, 'received_spare_only'>>
): Promise<HPStockSettings> => {
  const { data } = await api.patch('/hp-stock/settings/', payload);
  return data;
};
