import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BoxesIcon, Pencil, Trash2 } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { transitionBufferPart } from "@/api/bufferParts";
import { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import type { BufferPart, PaginationMeta } from "@/types";

type WorkflowStatus = BufferPart["status"];

const NEXT_STATUS_MAP: Record<WorkflowStatus, WorkflowStatus | null> = {
  BUFFER_IN: "OUT",
  OUT: "DEFECTIVE_RETURN",
  DEFECTIVE_RETURN: "REORDER",
  REORDER: "PART_RECEIVED",
  PART_RECEIVED: "CLOSED",
  CLOSED: null,
};

const NEXT_ACTION_MAP: Record<WorkflowStatus, string> = {
  BUFFER_IN: "Mark Out",
  OUT: "Defective Return",
  DEFECTIVE_RETURN: "Reorder",
  REORDER: "Part Received",
  PART_RECEIVED: "Close Case",
  CLOSED: "Completed",
};

const NEXT_ACTION_COLOR_MAP: Record<WorkflowStatus, string> = {
  BUFFER_IN: "bg-blue-600 hover:bg-blue-700 text-white border-transparent dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white",
  OUT: "bg-amber-500 hover:bg-amber-600 text-white border-transparent dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-white",
  DEFECTIVE_RETURN: "bg-purple-600 hover:bg-purple-700 text-white border-transparent dark:bg-purple-600 dark:hover:bg-purple-700 dark:text-white",
  REORDER: "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent dark:bg-emerald-600 dark:hover:bg-emerald-700 dark:text-white",
  PART_RECEIVED: "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:text-white",
  CLOSED: "border-slate-200 text-slate-400 bg-transparent hover:bg-transparent",
};

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  BUFFER_IN: "BUFFER_IN",
  OUT: "OUT",
  DEFECTIVE_RETURN: "DEFECTIVE_RETURN",
  REORDER: "REORDER",
  PART_RECEIVED: "PART_RECEIVED",
  CLOSED: "CLOSED",
};

const TRACK_STEPS: WorkflowStatus[] = ["BUFFER_IN", "OUT", "DEFECTIVE_RETURN", "REORDER", "PART_RECEIVED", "CLOSED"];

interface BufferTableProps {
  data: BufferPart[];
  loading: boolean;
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onEdit: (item: BufferPart) => void;
  onDelete: (id: number) => void;
  onRowUpdated: (item: BufferPart) => void;
}

export function BufferTable({ data, loading, pagination, onPageChange, onEdit, onDelete, onRowUpdated }: BufferTableProps) {
  const [transitionOpen, setTransitionOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<BufferPart | null>(null);
  const [engineerName, setEngineerName] = useState("");
  const [caseId, setCaseId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [savingTransition, setSavingTransition] = useState(false);

  const isOutTransition = activeRow?.status === "BUFFER_IN";
  const canConfirm = useMemo(() => {
    if (!activeRow) return false;
    if (activeRow.status === "CLOSED") return false;
    if (isOutTransition) return engineerName.trim().length > 0 && caseId.trim().length > 0;
    return true;
  }, [activeRow, caseId, engineerName, isOutTransition]);

  const openTransition = (row: BufferPart) => {
    setActiveRow(row);
    setEngineerName(row.engineer_name || "");
    setCaseId(row.case_id || "");
    setRemarks("");
    setTransitionOpen(true);
  };

  const openTrack = (row: BufferPart) => {
    setActiveRow(row);
    setTrackOpen(true);
  };

  const handleTransition = async () => {
    if (!activeRow || !canConfirm) return;
    setSavingTransition(true);
    try {
      const updated = await transitionBufferPart(activeRow.id, {
        engineer_name: engineerName.trim() || undefined,
        case_id: caseId.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });
      onRowUpdated(updated);
      setTransitionOpen(false);
      toast({ title: "Status updated" });
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    } finally {
      setSavingTransition(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <BoxesIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">No buffer parts found</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Add parts to the buffer to get started.</p>
      </Card>
    );
  }

  const start = (pagination.page - 1) * pagination.per_page + 1;
  const end = Math.min(pagination.page * pagination.per_page, pagination.total);

  return (
    <div>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
              <TableHead className="w-12">S.No</TableHead>
              <TableHead>Part Number</TableHead>
              <TableHead>Part Name</TableHead>
              <TableHead>General Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Next Action</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((entry, i) => (
              <motion.tr
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                  {(pagination.page - 1) * pagination.per_page + i + 1}
                </TableCell>
                <TableCell className="font-mono text-sm font-medium">{entry.part_number}</TableCell>
                <TableCell>{entry.part_name}</TableCell>
                <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                  {entry.general_name || <span className="text-slate-400 italic">-</span>}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{entry.quantity}</Badge>
                </TableCell>
                <TableCell>
                  {entry.region_display ? <Badge variant="outline">{entry.region_display}</Badge> : <span className="text-slate-400 italic">-</span>}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[11px]">
                    {STATUS_LABELS[entry.status || "BUFFER_IN"]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    className={NEXT_ACTION_COLOR_MAP[entry.status || "BUFFER_IN"]}
                    disabled={(entry.status || "BUFFER_IN") === "CLOSED"}
                    onClick={() => openTransition(entry)}
                  >
                    {NEXT_ACTION_MAP[entry.status || "BUFFER_IN"]}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => openTrack(entry)}>
                    View Track
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(entry)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => onDelete(entry.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      {pagination.total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-500 dark:text-slate-400">
          <span>Showing {start}-{end} of {pagination.total}</span>
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

      <Dialog open={transitionOpen} onOpenChange={setTransitionOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Transition Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isOutTransition && (
              <>
                <div className="space-y-2">
                  <Label>Engineer Name *</Label>
                  <Input value={engineerName} onChange={(e) => setEngineerName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Case ID *</Label>
                  <Input value={caseId} onChange={(e) => setCaseId(e.target.value)} />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransitionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTransition} disabled={!canConfirm || savingTransition}>
              Confirm Transition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={trackOpen} onOpenChange={setTrackOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Track</DialogTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Workflow transition history</p>
          </DialogHeader>
          {activeRow && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {TRACK_STEPS.map((step, idx) => {
                  const currentIndex = TRACK_STEPS.indexOf(activeRow.status || "BUFFER_IN");
                  const completed = idx < currentIndex;
                  const current = idx === currentIndex;
                  const formattedStep = step.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
                  return (
                    <div key={step} className={`rounded-xl border p-2.5 text-center transition-colors ${current ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"}`}>
                      <div className={`h-2.5 w-2.5 rounded-full mx-auto mb-1.5 shadow-sm ${completed ? "bg-emerald-500" : current ? "bg-indigo-500 shadow-indigo-500/40" : "bg-slate-300 dark:bg-slate-700"}`} />
                      <p className={`text-[11px] font-medium ${current ? "text-indigo-700 dark:text-indigo-300" : "text-slate-600 dark:text-slate-400"}`}>{formattedStep}</p>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2">
                {(activeRow.transition_history || []).map((h, idx) => {
                  const formatStatus = (s: string) => s.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
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
                        {h.case_id && (
                          <div className="flex items-start gap-2">
                            <span className="text-slate-500 dark:text-slate-400 w-24 shrink-0">Case ID</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{h.case_id}</span>
                          </div>
                        )}
                        {h.comment && (
                          <div className="flex items-start gap-2">
                            <span className="text-slate-500 dark:text-slate-400 w-24 shrink-0">Comment</span>
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
