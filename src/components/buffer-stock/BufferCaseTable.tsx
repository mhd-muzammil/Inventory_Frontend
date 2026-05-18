import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Eye, Clock, Clock3, FileText, AlertCircle, CheckCircle2, Wrench, Play, Check, Shield, ArrowLeftRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/useDebounce";
import { getBufferCases, getAuditLogs } from "@/api/bufferStock";
import { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import {
  BUFFER_CASE_STATUS_LABELS, BUFFER_CASE_TYPE_LABELS,
  CASE_STATUS_COLORS,
} from "@/types/bufferStock";
import type { BufferCase, BufferCaseFilters, BufferCaseStatus, BufferCaseType, BufferAuditLog } from "@/types/bufferStock";
import type { PaginationMeta } from "@/types";
import { BufferCaseFormDialog } from "./BufferCaseFormDialog";
import { CaseDetailDialog } from "./CaseDetailDialog";

const AUDIT_ACTION_STYLE_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  case_created: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  oow_requested: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  oow_approved: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400", dot: "bg-green-500" },
  oow_rejected: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400", dot: "bg-red-500" },
  part_allocated: { bg: "bg-sky-50 dark:bg-sky-900/20", text: "text-sky-600 dark:text-sky-400", dot: "bg-sky-500" },
  case_status_changed: { bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-600 dark:text-indigo-400", dot: "bg-indigo-500" },
  replenishment_created: { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-600 dark:text-orange-400", dot: "bg-orange-500" },
  replenishment_received: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  case_closed: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400", dot: "bg-green-500" },
  proof_uploaded: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400", dot: "bg-purple-500" },
  default: { bg: "bg-slate-50 dark:bg-slate-900/20", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-500" }
};

const STEP_LABELS: Record<string, string> = {
  created: "Created",
  pending_approval: "Pending Approval",
  approved: "Approved",
  part_allocated: "Part Allocated",
  engineer_assigned: "Engineer Assigned",
  in_progress: "In Progress",
  service_completed: "Service Completed",
  stock_replenished: "Replenished",
  closed: "Closed",
};

function getAuditActionIcon(action: string) {
  switch (action) {
    case "case_created":
      return <FileText className="w-3.5 h-3.5" />;
    case "oow_requested":
      return <AlertCircle className="w-3.5 h-3.5" />;
    case "oow_approved":
    case "replenishment_received":
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    case "oow_rejected":
      return <AlertCircle className="w-3.5 h-3.5" strokeWidth={2.5} />;
    case "part_allocated":
      return <Wrench className="w-3.5 h-3.5" />;
    case "case_status_changed":
      return <Play className="w-3.5 h-3.5" />;
    case "replenishment_created":
      return <ArrowLeftRight className="w-3.5 h-3.5" />;
    case "case_closed":
      return <Check className="w-3.5 h-3.5" strokeWidth={3} />;
    case "proof_uploaded":
      return <Shield className="w-3.5 h-3.5" />;
    default:
      return <Clock className="w-3.5 h-3.5" />;
  }
}

export function BufferCaseTable() {
  const [search, setSearch] = useState("");
  const [caseType, setCaseType] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<BufferCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({ total: 0, page: 1, per_page: 20, pages: 1 });

  const [formOpen, setFormOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<BufferCase | null>(null);

  // History Tracking Dialog States
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyCase, setHistoryCase] = useState<BufferCase | null>(null);
  const [historyLogs, setHistoryLogs] = useState<BufferAuditLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const openHistory = useCallback(async (c: BufferCase) => {
    setHistoryCase(c);
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await getAuditLogs({
        entity_type: "buffer_case",
        entity_id: c.id,
        per_page: 100,
      });
      setHistoryLogs(res.items || []);
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const debouncedSearch = useDebounce(search, 400);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const filters: BufferCaseFilters = {
        search: debouncedSearch || undefined,
        case_type: (caseType || undefined) as BufferCaseType | undefined,
        status: (statusFilter || undefined) as BufferCaseStatus | undefined,
        page,
        per_page: 20,
      };
      const res = await getBufferCases(filters);
      setData(res.items);
      setPagination({ total: res.total, page: res.page, per_page: res.per_page, pages: res.pages });
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, caseType, statusFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const start = (pagination.page - 1) * pagination.per_page + 1;
  const end = Math.min(pagination.page * pagination.per_page, pagination.total);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search cases..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>

        <Select value={caseType} onValueChange={(v) => { setCaseType(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Case Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(BUFFER_CASE_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(BUFFER_CASE_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => setFormOpen(true)} className="gap-2 ml-auto">
          <Plus className="w-4 h-4" /> New Case
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : data.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-slate-500">No buffer cases found.</p>
        </Card>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                  <TableHead>Case #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Part</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Engineer</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <TableCell className="font-mono text-sm font-medium">
                      {c.case_number}
                      {c.case_id && (
                        <span className="block text-xs text-slate-400">HP: {c.case_id}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.case_type === "iw" ? "default" : "destructive"} className="text-xs">
                        {c.case_type_display}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${CASE_STATUS_COLORS[c.status] || ""}`}>
                        {c.status_display}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate">{c.customer_name}</TableCell>
                    <TableCell className="text-sm">
                      {c.part_number && <span className="font-mono">{c.part_number}</span>}
                      {c.part_name && <span className="block text-xs text-slate-400">{c.part_name}</span>}
                    </TableCell>
                    <TableCell><Badge variant="secondary">{c.region_display}</Badge></TableCell>
                    <TableCell className="text-sm">{c.assigned_engineer_name || "—"}</TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {new Date(c.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedCase(c)} className="gap-1 text-slate-700 dark:text-slate-300">
                          <Eye className="w-3.5 h-3.5" /> View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openHistory(c)}
                          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium gap-1"
                        >
                          <Clock className="w-3.5 h-3.5" /> History
                        </Button>
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

      <BufferCaseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={fetchData}
      />

      <CaseDetailDialog
        bufferCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        onRefresh={fetchData}
      />

      {/* History Track Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Buffer Case Tracking & History</DialogTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Full lifecycle tracking, audit trails, and logistics transitions
            </p>
          </DialogHeader>

          {historyCase && (
            <div className="space-y-6 text-slate-900 dark:text-slate-100">
              {/* Stepper Progress */}
              {(() => {
                const isOow = historyCase.case_type === "oow";
                const steps = isOow
                  ? [
                      "created",
                      "pending_approval",
                      "approved",
                      "part_allocated",
                      "engineer_assigned",
                      "in_progress",
                      "service_completed",
                      "stock_replenished",
                      "closed",
                    ]
                  : [
                      "created",
                      "part_allocated",
                      "engineer_assigned",
                      "in_progress",
                      "service_completed",
                      "stock_replenished",
                      "closed",
                    ];

                let displaySteps = [...steps];
                if (historyCase.status === "rejected" && isOow) {
                  displaySteps = [
                    "created",
                    "pending_approval",
                    "rejected",
                  ];
                } else if (historyCase.status === "cancelled") {
                  displaySteps.push("cancelled");
                }

                const currentIndex = displaySteps.indexOf(historyCase.status);
                const colsClass = displaySteps.length <= 6
                  ? "grid grid-cols-2 md:grid-cols-6 gap-3"
                  : displaySteps.length === 7
                  ? "grid grid-cols-2 md:grid-cols-7 gap-3"
                  : displaySteps.length === 8
                  ? "grid grid-cols-2 md:grid-cols-8 gap-3"
                  : "grid grid-cols-2 md:grid-cols-9 gap-3";

                return (
                  <div className={colsClass}>
                    {displaySteps.map((step, idx) => {
                      const completed = idx < currentIndex;
                      const current = idx === currentIndex;
                      const formattedStep = STEP_LABELS[step] || BUFFER_CASE_STATUS_LABELS[step as BufferCaseStatus] || step;

                      let dotBg = "bg-slate-300 dark:bg-slate-700";
                      let borderClass = "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30";
                      let textClass = "text-slate-600 dark:text-slate-400";

                      if (completed) {
                        dotBg = "bg-emerald-500";
                      } else if (current) {
                        if (step === "rejected" || step === "cancelled") {
                          dotBg = "bg-red-500 shadow-red-500/40";
                          borderClass = "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20";
                          textClass = "text-red-700 dark:text-red-300";
                        } else {
                          dotBg = "bg-indigo-500 shadow-indigo-500/40";
                          borderClass = "border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20";
                          textClass = "text-indigo-700 dark:text-indigo-300";
                        }
                      }

                      return (
                        <div key={step} className={`rounded-xl border p-2.5 text-center transition-colors ${borderClass}`}>
                          <div className={`h-2.5 w-2.5 rounded-full mx-auto mb-1.5 shadow-sm ${dotBg}`} />
                          <p className={`text-[10px] font-medium leading-tight ${textClass}`}>{formattedStep}</p>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Case Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block mb-1">Customer</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{historyCase.customer_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block mb-1">Product</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block max-w-full">{historyCase.product_name || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block mb-1">Part Number</span>
                  <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">{historyCase.part_number || "Not allocated"}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block mb-1">Engineer</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{historyCase.assigned_engineer_name || "Not assigned"}</span>
                </div>
              </div>

              {/* Timeline Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" /> Lifecycle Activity Trail
                </h3>

                {historyLoading ? (
                  <div className="space-y-3 pl-10">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                  </div>
                ) : historyLogs.length === 0 ? (
                  <Card className="p-8 text-center text-slate-500 border-dashed">
                    No timeline logs found for this case.
                  </Card>
                ) : (
                  <div className="relative max-h-[340px] overflow-y-auto pr-2 pl-10 py-2 space-y-6">
                    {/* Vertical line inside scroll parent */}
                    <div className="absolute left-[22px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800" />
                    
                    {historyLogs.map((log, idx) => {
                      const st = AUDIT_ACTION_STYLE_MAP[log.action] || AUDIT_ACTION_STYLE_MAP.default;
                      const d = new Date(log.created_at);
                      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                      const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric", hour12: true });
                      const formattedDate = `${dateStr} • ${timeStr}`;

                      let customDetailsText = "";
                      if (log.action === "part_allocated") {
                        customDetailsText = `Allocated part "${historyCase.part_name || log.details.part_number}" (Qty: ${log.details.qty || 1}) from ${log.details.source_region || "Buffer stock"}`;
                      } else if (log.action === "case_status_changed") {
                        const toStatusStr = BUFFER_CASE_STATUS_LABELS[log.details.to_status as BufferCaseStatus] || log.details.to_status;
                        customDetailsText = `Status transitioned to "${toStatusStr}"`;
                        if (log.details.engineer) {
                          customDetailsText += ` (Assigned to: ${log.details.engineer})`;
                        }
                      } else if (log.action === "replenishment_created") {
                        customDetailsText = `HP Replenishment order triggered: ${log.details.order_number || "N/A"}`;
                      } else if (log.action === "proof_uploaded") {
                        customDetailsText = `Proof of service uploaded: ${log.details.proof_type || "image"}`;
                      } else if (log.action === "oow_approved" || log.action === "oow_rejected") {
                        customDetailsText = `Out-of-Warranty request ${log.action === "oow_approved" ? "approved" : "rejected"} by ${log.details.approver || "System"} (${log.details.approver_role || "Admin"})`;
                      } else {
                        customDetailsText = Object.entries(log.details || {})
                          .filter(([k]) => k !== "case_number" && k !== "case_type")
                          .map(([k, v]) => `${k.replace("_", " ")}: ${v}`)
                          .join(", ");
                      }

                      return (
                        <div key={`${log.created_at}-${idx}`} className="relative group">
                          {/* Timeline Dot */}
                          <div className={`absolute -left-[30px] top-1.5 flex items-center justify-center w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 ${st.bg} ${st.text} shadow-sm z-10 transition-transform group-hover:scale-110`}>
                            {getAuditActionIcon(log.action)}
                          </div>

                          {/* Card Content */}
                          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 space-y-2 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <h4 className="font-semibold text-slate-900 dark:text-slate-50 text-sm">
                                {log.action_display}
                              </h4>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                Actioned by: {log.actor_name || "System"}
                              </span>
                            </div>

                            {customDetailsText && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                {customDetailsText}
                              </p>
                            )}

                            {log.details.reason && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 italic pt-1.5 border-t border-slate-100 dark:border-slate-800/40">
                                Reason: "{log.details.reason}"
                              </div>
                            )}

                            {log.details.comment && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 italic pt-1.5 border-t border-slate-100 dark:border-slate-800/40">
                                Remarks: "{log.details.comment}"
                              </div>
                            )}

                            {log.details.resolution && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 italic pt-1.5 border-t border-slate-100 dark:border-slate-800/40">
                                Resolution: "{log.details.resolution}"
                              </div>
                            )}

                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/40 mt-1 flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formattedDate}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
