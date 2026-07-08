import api from './client';
import type { PaginationMeta } from '@/types';

export interface HPStockRMAPart {
  id: number;
  part_number: string;
  description: string;
  category: string;
  price: string | number;
  hsn_code: string;
  igst: string;
  cgst: string;
  sgst: string;
  eosl_flag: string;
  validity: string | null;
  parts_status: string;
  created_at: string;
  updated_at: string;
}

export interface GetHPStockRMAPartsResponse {
  items: HPStockRMAPart[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export async function getHPStockRMAParts(params?: { search?: string; page?: number; per_page?: number }) {
  const { data } = await api.get<GetHPStockRMAPartsResponse>('/hp-stock/parts/', { params });
  return data;
}

export async function importHPStockRMAPartsExcel(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<{ detail: string; errors?: string[] }>('/hp-stock/parts/import_excel/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
}

export async function deleteAllHPStockRMAParts() {
  const { data } = await api.delete<{ detail: string }>('/hp-stock/parts/delete_all/');
  return data;
}
