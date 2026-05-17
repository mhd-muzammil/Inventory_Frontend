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
  region: string;
  status: string;
  engineer_name: string;
  created_by_name?: string;
  transition_history?: Array<{
    from_status: string;
    to_status: string;
    comment: string;
    updated_by: string;
    timestamp: string;
    engineer_name?: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface HPStockSummary {
  total: number;
  regions: { region: string; total: number }[];
}

export interface GetHPStockParams {
  page?: number;
  per_page?: number;
  search?: string;
  region?: string;
  view?: 'my_region' | 'overall';
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

export const createHPStockItem = async (payload: Partial<HPStockItem>): Promise<HPStockItem> => {
  const { data } = await api.post('/hp-stock/items/', payload);
  return data;
};

export const updateHPStockItem = async (id: number, payload: Partial<HPStockItem>): Promise<HPStockItem> => {
  const { data } = await api.patch(`/hp-stock/items/${id}/`, payload);
  return data;
};

export const deleteHPStockItem = async (id: number): Promise<void> => {
  await api.delete(`/hp-stock/items/${id}/`);
};

export const transitionHPStockItem = async (
  id: number,
  payload: { engineer_name?: string; remarks?: string; to_status?: string }
): Promise<HPStockItem> => {
  const { data } = await api.post(`/hp-stock/items/${id}/transition/`, payload);
  return data;
};
