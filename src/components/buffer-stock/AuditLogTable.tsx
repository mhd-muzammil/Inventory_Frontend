import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ScrollText } from "lucide-react";
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
import { getAuditLogs } from "@/api/bufferStock";
import { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import type { BufferAuditLog } from "@/types/bufferStock";
import type { PaginationMeta } from "@/types";
import { REGION_LABELS } from "@/types";

const ACTION_COLORS: Record<string, string> = {
  stock_created: "bg-blue-100 text-blue-700",
  stock_updated: "bg-blue-100 text-blue-700",
  stock_adjusted: "bg-indigo-100 text-indigo-700",
  case_created: "bg-cyan-100 text-cyan-700",
  case_status_changed: "bg-slate-100 text-slate-700",
  case_closed: "bg-green-100 text-green-700",
  oow_requested: "bg-amber-100 text-amber-700",
  oow_approved: "bg-green-100 text-green-700",
  oow_rejected: "bg-red-100 text-red-700",
  transfer_requested: "bg-purple-100 text-purple-700",
  transfer_approved: "bg-green-100 text-green-700",
  transfer_rejected: "bg-red-100 text-red-700",
  transfer_received: "bg-emerald-100 text-emerald-700",
  replenishment_created: "bg-teal-100 text-teal-700",
  replenishment_received: "bg-green-100 text-green-700",
  proof_uploaded: "bg-indigo-100 text-indigo-700",
  part_allocated: "bg-blue-100 text-blue-700",
  part_released: "bg-slate-100 text-slate-700",
};

export function AuditLogTable() {
  const [actionFilter, setActionFilter] = useState<string>("");
  const [regionFilter, setRegionFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<BufferAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({ total: 0, page: 1, per_page: 20, pages: 1 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAuditLogs({
        action: actionFilter || undefined,
        region: regionFilter || undefined,
        page,
        per_page: 30,
      });
      setData(res.items);
      setPagination({ total: res.total, page: res.page, per_page: res.per_page, pages: res.pages });
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [actionFilter, regionFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const start = (pagination.page - 1) * pagination.per_page + 1;
  const end = Math.min(pagination.page * pagination.per_page, pagination.total);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="case_created">Case Created</SelectItem>
            <SelectItem value="case_status_changed">Status Changed</SelectItem>
            <SelectItem value="oow_approved">OOW Approved</SelectItem>
            <SelectItem value="oow_rejected">OOW Rejected</SelectItem>
            <SelectItem value="transfer_requested">Transfer Requested</SelectItem>
            <SelectItem value="transfer_approved">Transfer Approved</SelectItem>
            <SelectItem value="replenishment_received">Replenishment Received</SelectItem>
            <SelectItem value="part_allocated">Part Allocated</SelectItem>
            <SelectItem value="stock_adjusted">Stock Adjusted</SelectItem>
          </SelectContent>
        </Select>

        <Select value={regionFilter} onValueChange={(v) => { setRegionFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {Object.entries(REGION_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : data.length === 0 ? (
        <Card className="p-12 text-center">
          <ScrollText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No audit logs found.</p>
        </Card>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((log, i) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.015 }}
                    className="border-b border-slate-200 dark:border-slate-700"
                  >
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${ACTION_COLORS[log.action] || "bg-slate-100 text-slate-700"}`}>
                        {log.action_display}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {log.entity_type}#{log.entity_id}
                    </TableCell>
                    <TableCell className="text-sm">{log.actor_name || "System"}</TableCell>
                    <TableCell>
                      {log.region && <Badge variant="secondary" className="text-xs">{log.region}</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-[200px] truncate">
                      {Object.entries(log.details || {})
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(", ")}
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
