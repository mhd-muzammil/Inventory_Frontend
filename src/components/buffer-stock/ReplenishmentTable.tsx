import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import { getReplenishments, receiveReplenishment } from "@/api/bufferStock";
import { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import { REPLENISHMENT_STATUS_LABELS } from "@/types/bufferStock";
import type { ReplenishmentOrder } from "@/types/bufferStock";
import type { PaginationMeta } from "@/types";

export function ReplenishmentTable() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ReplenishmentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({ total: 0, page: 1, per_page: 20, pages: 1 });
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReplenishments({
        status: statusFilter || undefined,
        page,
        per_page: 20,
      });
      setData(res.items);
      setPagination({ total: res.total, page: res.page, per_page: res.per_page, pages: res.pages });
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReceive = async (id: number) => {
    setActionLoading(id);
    try {
      await receiveReplenishment(id);
      toast({ title: "Replenishment received. Stock updated." });
      fetchData();
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const start = (pagination.page - 1) * pagination.per_page + 1;
  const end = Math.min(pagination.page * pagination.per_page, pagination.total);

  const statusColor = (s: string) => {
    if (s === "received") return "bg-green-100 text-green-700";
    if (s === "shipped") return "bg-blue-100 text-blue-700";
    if (s === "ordered") return "bg-amber-100 text-amber-700";
    if (s === "cancelled") return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(REPLENISHMENT_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : data.length === 0 ? (
        <Card className="p-12 text-center">
          <RotateCcw className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No replenishment orders found.</p>
        </Card>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                  <TableHead>Order #</TableHead>
                  <TableHead>Case #</TableHead>
                  <TableHead>Part</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ordered</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((r, i) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <TableCell className="font-mono text-sm font-medium">{r.order_number}</TableCell>
                    <TableCell className="font-mono text-sm">{r.case_number || "—"}</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{r.part_number}</span>
                      <span className="block text-xs text-slate-400">{r.part_name}</span>
                    </TableCell>
                    <TableCell className="font-semibold">{r.quantity}</TableCell>
                    <TableCell><Badge variant="secondary">{r.region}</Badge></TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${statusColor(r.status)}`}>
                        {REPLENISHMENT_STATUS_LABELS[r.status] || r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {r.order_date ? new Date(r.order_date).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {r.received_at ? new Date(r.received_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      {r.status !== "received" && r.status !== "cancelled" && (
                        <Button
                          size="sm" variant="default"
                          disabled={actionLoading === r.id}
                          onClick={() => handleReceive(r.id)}
                        >
                          Mark Received
                        </Button>
                      )}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>

          {pagination.total > 0 && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Showing {start}–{end} of {pagination.total}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= pagination.pages}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
