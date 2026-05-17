import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { HPStockItem } from "@/api/hpStock";
import type { PaginationMeta, Region } from "@/types";
import { REGION_LABELS } from "@/types";
import { Badge } from "@/components/ui/badge";

interface Props {
  data: HPStockItem[];
  loading: boolean;
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onEdit: (item: HPStockItem) => void;
  onDelete: (id: number) => void;
}

export function HPStockTable({ data, loading, pagination, onPageChange, onEdit, onDelete }: Props) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case ID / WO</TableHead>
              <TableHead>Delivery / Service Event</TableHead>
              <TableHead>Material / Sales Order</TableHead>
              <TableHead>Region & Engineer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                <TableHead className="font-semibold">Case ID / WO</TableHead>
                <TableHead className="font-semibold">Delivery / Service Event</TableHead>
                <TableHead className="font-semibold">Material / Sales Order</TableHead>
                <TableHead className="font-semibold">GVRMA No</TableHead>
                <TableHead className="font-semibold">Region & Engineer</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <TableCell>
                    <div className="font-medium text-slate-900 dark:text-slate-100">{item.case_id || "N/A"}</div>
                    <div className="text-xs text-slate-500">{item.work_order_id || "N/A"}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-900 dark:text-slate-100">{item.delivery_no || "N/A"}</div>
                    <div className="text-xs text-slate-500">{item.service_event_no || "N/A"}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-900 dark:text-slate-100">{item.material_order_no || "N/A"}</div>
                    <div className="text-xs text-slate-500">{item.hp_sales_order_no || "N/A"}</div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{item.gvrma_no || "N/A"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-fit">
                        {REGION_LABELS[item.region as Region] || item.region || "No Region"}
                      </span>
                      <span className="text-xs text-slate-500">{item.engineer_name || "Unassigned"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'CLOSED' ? 'default' : 'secondary'}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(item)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/50">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {pagination.total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-500 dark:text-slate-400">
          <span>
            Showing {(pagination.page - 1) * pagination.per_page + 1}-
            {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page <= 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page >= pagination.pages}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
