import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { getOOWApprovals, actionOOWApproval } from "@/api/bufferStock";
import { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/authStore";
import type { OOWApproval } from "@/types/bufferStock";
import type { PaginationMeta } from "@/types";

export function ApprovalQueue() {
  const user = useAuthStore((s) => s.user);
  const canApprove = user?.role && ["super_admin", "admin", "manager"].includes(user.role);

  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<OOWApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({ total: 0, page: 1, per_page: 20, pages: 1 });

  const [actionDialog, setActionDialog] = useState<{ approval: OOWApproval; type: "approve" | "reject" } | null>(null);
  const [reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOOWApprovals({
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

  const handleAction = async () => {
    if (!actionDialog) return;
    setActionLoading(true);
    try {
      await actionOOWApproval(actionDialog.approval.id, {
        action: actionDialog.type,
        reason,
      });
      toast({
        title: actionDialog.type === "approve"
          ? "OOW case approved"
          : "OOW case rejected",
      });
      setActionDialog(null);
      setReason("");
      fetchData();
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    } finally {
      setActionLoading(false);
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
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : data.length === 0 ? (
        <Card className="p-12 text-center">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No OOW approval requests found.</p>
        </Card>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                  <TableHead>Case #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Part</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((a, i) => (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <TableCell className="font-mono text-sm font-medium">{a.case_number}</TableCell>
                    <TableCell>{a.customer_name}</TableCell>
                    <TableCell className="text-sm">{a.part_name || "—"}</TableCell>
                    <TableCell><Badge variant="secondary">{a.region}</Badge></TableCell>
                    <TableCell className="text-sm">{a.requested_by_name}</TableCell>
                    <TableCell>
                      <Badge variant={
                        a.status === "approved" ? "default" :
                        a.status === "rejected" ? "destructive" : "secondary"
                      } className="text-xs">
                        {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {a.approved_by_name ? `${a.approved_by_name} (${a.approver_role})` : "—"}
                    </TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate">{a.reason || "—"}</TableCell>
                    <TableCell>
                      {a.status === "pending" && canApprove && (
                        <div className="flex gap-1">
                          <Button
                            size="sm" variant="default"
                            onClick={() => { setActionDialog({ approval: a, type: "approve" }); setReason(""); }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm" variant="destructive"
                            onClick={() => { setActionDialog({ approval: a, type: "reject" }); setReason(""); }}
                          >
                            Reject
                          </Button>
                        </div>
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

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={(v) => { if (!v) setActionDialog(null); }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionDialog?.type === "approve" ? (
                <><ShieldCheck className="w-5 h-5 text-green-600" /> Approve OOW Case</>
              ) : (
                <><ShieldAlert className="w-5 h-5 text-red-600" /> Reject OOW Case</>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Case: <strong>{actionDialog?.approval.case_number}</strong>
            </p>
            <Textarea
              placeholder="Reason (required for audit)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button
              variant={actionDialog?.type === "approve" ? "default" : "destructive"}
              disabled={actionLoading || !reason.trim()}
              onClick={handleAction}
            >
              {actionLoading ? "Processing..." : actionDialog?.type === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
