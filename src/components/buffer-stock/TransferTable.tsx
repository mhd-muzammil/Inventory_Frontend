import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRightLeft, Plus } from "lucide-react";
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
import {
  getTransfers, approveTransfer, rejectTransfer,
  markTransferInTransit, receiveTransfer,
} from "@/api/bufferStock";
import { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/authStore";
import { TRANSFER_STATUS_LABELS, TRANSFER_STATUS_COLORS } from "@/types/bufferStock";
import type { InterRegionTransfer, TransferStatus } from "@/types/bufferStock";
import type { PaginationMeta } from "@/types";
import { TransferFormDialog } from "./TransferFormDialog";

export function TransferTable() {
  const user = useAuthStore((s) => s.user);
  const canApprove = user?.role && ["super_admin", "admin", "manager"].includes(user.role);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<InterRegionTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({ total: 0, page: 1, per_page: 20, pages: 1 });
  const [formOpen, setFormOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTransfers({
        status: (statusFilter || undefined) as TransferStatus | undefined,
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

  const handleAction = async (id: number, fn: () => Promise<unknown>) => {
    setActionLoading(id);
    try {
      await fn();
      toast({ title: "Transfer updated" });
      fetchData();
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const start = (pagination.page - 1) * pagination.per_page + 1;
  const end = Math.min(pagination.page * pagination.per_page, pagination.total);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(TRANSFER_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => setFormOpen(true)} className="gap-2 ml-auto">
          <Plus className="w-4 h-4" /> Request Transfer
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : data.length === 0 ? (
        <Card className="p-12 text-center">
          <ArrowRightLeft className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No transfer requests found.</p>
        </Card>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                  <TableHead>Transfer #</TableHead>
                  <TableHead>Part</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((t, i) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <TableCell className="font-mono text-sm font-medium">{t.transfer_number}</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{t.part_number}</span>
                      <span className="block text-xs text-slate-400">{t.part_name}</span>
                    </TableCell>
                    <TableCell className="font-semibold">{t.quantity}</TableCell>
                    <TableCell><Badge variant="secondary">{t.source_region_display}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{t.destination_region_display}</Badge></TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${TRANSFER_STATUS_COLORS[t.status]}`}>
                        {t.status_display}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{t.requested_by_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {t.status === "requested" && canApprove && (
                          <>
                            <Button
                              size="sm" variant="default"
                              disabled={actionLoading === t.id}
                              onClick={() => handleAction(t.id, () => approveTransfer(t.id))}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm" variant="destructive"
                              disabled={actionLoading === t.id}
                              onClick={() => handleAction(t.id, () => rejectTransfer(t.id, "Rejected"))}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {t.status === "approved" && (
                          <Button
                            size="sm" variant="outline"
                            disabled={actionLoading === t.id}
                            onClick={() => handleAction(t.id, () => markTransferInTransit(t.id))}
                          >
                            Ship
                          </Button>
                        )}
                        {t.status === "in_transit" && (
                          <Button
                            size="sm" variant="default"
                            disabled={actionLoading === t.id}
                            onClick={() => handleAction(t.id, () => receiveTransfer(t.id))}
                          >
                            Receive
                          </Button>
                        )}
                      </div>
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

      <TransferFormDialog open={formOpen} onOpenChange={setFormOpen} onSuccess={fetchData} />
    </div>
  );
}
