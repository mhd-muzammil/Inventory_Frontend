import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Edit, Trash2, ArrowRight, ChevronDown, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { transitionHPStockItem } from "@/api/hpStock";
import { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import type { HPStockItem } from "@/api/hpStock";
import type { PaginationMeta, Region } from "@/types";
import { REGION_LABELS } from "@/types";

type WorkflowStatus = HPStockItem["status"];

const AVAILABLE_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["RECEIVED"],
  RECEIVED: ["ISSUED"],
  ISSUED: ["UNUSED_RETURN", "DEFECTIVE_RETURN"],
  UNUSED_RETURN: ["CLOSED"],
  DEFECTIVE_RETURN: ["CLOSED"],
};

const TRANSITION_LABELS: Record<string, string> = {
  PENDING: "Return to Pending",
  RECEIVED: "Mark Received",
  ISSUED: "Issue to Engineer",
  UNUSED_RETURN: "Mark Unused Return",
  DEFECTIVE_RETURN: "Mark Defective Return",
  CLOSED: "Close Case",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Entry Created",
  RECEIVED: "Part Received",
  ISSUED: "Picked Up by Engineer",
  UNUSED_RETURN: "Unused Return",
  DEFECTIVE_RETURN: "Defective Return",
  CLOSED: "Closed",
};

const STATUS_STYLE_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-600" },
  RECEIVED: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  ISSUED: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-400", dot: "bg-purple-600" },
  UNUSED_RETURN: { bg: "bg-teal-50 dark:bg-teal-900/20", text: "text-teal-700 dark:text-teal-400", dot: "bg-teal-600" },
  DEFECTIVE_RETURN: { bg: "bg-rose-50 dark:bg-rose-900/20", text: "text-rose-700 dark:text-rose-400", dot: "bg-rose-600" },
  CLOSED: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", dot: "bg-slate-500" },
};

const TRACK_STEPS = ["PENDING", "RECEIVED", "ISSUED", "UNUSED_RETURN", "DEFECTIVE_RETURN", "CLOSED"];

interface Props {
  data: HPStockItem[];
  loading: boolean;
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onEdit: (item: HPStockItem) => void;
  onDelete: (id: number) => void;
  onRowUpdated: (item: HPStockItem) => void;
}

export function HPStockTable({ data, loading, pagination, onPageChange, onEdit, onDelete, onRowUpdated }: Props) {
  const [transitionOpen, setTransitionOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<HPStockItem | null>(null);
  const [pendingToStatus, setPendingToStatus] = useState<string | null>(null);
  const [engineerName, setEngineerName] = useState("");
  const [remarks, setRemarks] = useState("");
  const [savingTransition, setSavingTransition] = useState(false);

  const isIssuedTransition = pendingToStatus === "ISSUED";
  const canConfirm = useMemo(() => {
    if (!activeRow) return false;
    if (isIssuedTransition) return engineerName.trim().length > 0;
    return true;
  }, [activeRow, engineerName, isIssuedTransition]);

  const openTransition = (row: HPStockItem, target: string) => {
    setActiveRow(row);
    setPendingToStatus(target);
    setEngineerName(row.engineer_name || "");
    setRemarks("");
    setTransitionOpen(true);
  };

  const openTrack = (row: HPStockItem) => {
    setActiveRow(row);
    setTrackOpen(true);
  };

  const handleTransition = async () => {
    if (!activeRow || !canConfirm) return;
    setSavingTransition(true);
    try {
      const updated = await transitionHPStockItem(activeRow.id, {
        engineer_name: engineerName.trim() || undefined,
        remarks: remarks.trim() || undefined,
        to_status: pendingToStatus || undefined,
      });
      onRowUpdated(updated);
      setTransitionOpen(false);
      toast({ title: "HP Stock status updated" });
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    } finally {
      setSavingTransition(false);
    }
  };

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
                <TableHead className="font-semibold">Next Action</TableHead>
                <TableHead className="text-center font-semibold">History</TableHead>
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
                    {(() => {
                      const s = item.status || "PENDING";
                      const st = STATUS_STYLE_MAP[s] || STATUS_STYLE_MAP.PENDING;
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${st.bg} ${st.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
                          {STATUS_LABELS[s] || s}
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {AVAILABLE_TRANSITIONS[item.status || "PENDING"]?.length > 0 ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" className="gap-1 text-xs">
                            <ArrowRight className="w-3.5 h-3.5" />
                            Next Step <ChevronDown className="w-3 h-3 ml-0.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          {AVAILABLE_TRANSITIONS[item.status || "PENDING"].map((targetStatus) => (
                            <DropdownMenuItem
                              key={targetStatus}
                              className="cursor-pointer gap-2 text-sm"
                              onClick={() => openTransition(item, targetStatus)}
                            >
                              <span className={`w-2 h-2 rounded-full ${STATUS_STYLE_MAP[targetStatus]?.dot || "bg-slate-400"}`} />
                              {TRANSITION_LABELS[targetStatus] || targetStatus}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Badge variant="outline" className="text-slate-400 border-slate-200">Completed</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button size="sm" variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium" onClick={() => openTrack(item)}>
                      History
                    </Button>
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

      {/* Transition Ticket Dialog */}
      <Dialog open={transitionOpen} onOpenChange={setTransitionOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Transition HP Stock Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isIssuedTransition && (
              <div className="space-y-2">
                <Label>Engineer Name *</Label>
                <Input value={engineerName} onChange={(e) => setEngineerName(e.target.value)} placeholder="Enter Engineer Name" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Remarks / Comments</Label>
              <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional comments about this transition" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransitionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTransition} disabled={!canConfirm || savingTransition}>
              {savingTransition ? "Processing..." : "Confirm Transition"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Track Dialog */}
      <Dialog open={trackOpen} onOpenChange={setTrackOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>HP Stock Tracking & Account History</DialogTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Full transition records and logistics details</p>
          </DialogHeader>
          {activeRow && (
            <div className="space-y-6">
              {/* Stepper Progress */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {TRACK_STEPS.map((step, idx) => {
                  const currentIndex = TRACK_STEPS.indexOf(activeRow.status || "PENDING");
                  const completed = idx < currentIndex;
                  const current = idx === currentIndex;
                  const formattedStep = STATUS_LABELS[step] || step;
                  return (
                    <div key={step} className={`rounded-xl border p-2.5 text-center transition-colors ${current ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"}`}>
                      <div className={`h-2.5 w-2.5 rounded-full mx-auto mb-1.5 shadow-sm ${completed ? "bg-emerald-500" : current ? "bg-indigo-500 shadow-indigo-500/40" : "bg-slate-300 dark:bg-slate-700"}`} />
                      <p className={`text-[11px] font-medium ${current ? "text-indigo-700 dark:text-indigo-300" : "text-slate-600 dark:text-slate-400"}`}>{formattedStep}</p>
                    </div>
                  );
                })}
              </div>
              
              {/* Logs */}
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2">
                {(activeRow.transition_history || []).map((h, idx) => {
                  const formatStatus = (s: string) => STATUS_LABELS[s] || s;
                  const d = new Date(h.timestamp);
                  const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric", hour12: true });
                  const formattedDate = `${dateStr} • ${timeStr}`;

                  return (
                    <div key={`${h.timestamp}-${idx}`} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 space-y-3 shadow-sm">
                      <p className="font-semibold text-slate-900 dark:text-slate-50 text-sm">
                        {formatStatus(h.from_status)} &rarr; {formatStatus(h.to_status)}
                      </p>
                      <div className="grid gap-2 text-sm">
                        {h.engineer_name && (
                          <div className="flex items-start gap-2">
                            <span className="text-slate-500 dark:text-slate-400 w-24 shrink-0">Engineer</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{h.engineer_name}</span>
                          </div>
                        )}
                        {h.comment && (
                          <div className="flex items-start gap-2">
                            <span className="text-slate-500 dark:text-slate-400 w-24 shrink-0">Remarks</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{h.comment}</span>
                          </div>
                        )}
                        {h.updated_by && (
                          <div className="flex items-start gap-2">
                            <span className="text-slate-500 dark:text-slate-400 w-24 shrink-0">Updated by</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{h.updated_by}</span>
                          </div>
                        )}
                      </div>
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-1">
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          {formattedDate}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {(activeRow.transition_history || []).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No transitions yet.</p>
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
