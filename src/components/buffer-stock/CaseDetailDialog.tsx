import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, CheckCircle, ArrowRight } from "lucide-react";
import {
  getBufferCase, allocatePart, assignEngineer,
  transitionCase, completeService, triggerReplenishment, uploadProof,
  getBufferStockItems,
} from "@/api/bufferStock";
import client, { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import { CASE_STATUS_COLORS, BUFFER_CASE_STATUS_LABELS } from "@/types/bufferStock";
import type { BufferCase, BufferStockItem as BSI } from "@/types/bufferStock";

interface Props {
  bufferCase: BufferCase | null;
  onClose: () => void;
  onRefresh: () => void;
}

export function CaseDetailDialog({ bufferCase, onClose, onRefresh }: Props) {
  const [detail, setDetail] = useState<BufferCase | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // For allocate part
  const [stockItems, setStockItems] = useState<BSI[]>([]);
  const [selectedStockItem, setSelectedStockItem] = useState("");
  const [allocateQty, setAllocateQty] = useState(1);

  // For assign engineer
  const [engineers, setEngineers] = useState<{ id: number; name: string; region: string }[]>([]);
  const [selectedEngineer, setSelectedEngineer] = useState("");

  // For complete service
  const [resolution, setResolution] = useState("");
  const [serviceNotes, setServiceNotes] = useState("");

  // For proof upload
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    if (bufferCase) {
      setLoading(true);
      getBufferCase(bufferCase.id)
        .then(setDetail)
        .finally(() => setLoading(false));

      // Load stock items for allocation
      getBufferStockItems({ view: "overall", per_page: 100 })
        .then((res) => setStockItems(res.items));

      // Load engineers
      client.get("/users/engineers/").then((res) => {
        setEngineers(Array.isArray(res.data) ? res.data : res.data.items || []);
      });
    } else {
      setDetail(null);
    }
  }, [bufferCase]);

  if (!bufferCase) return null;

  const c = detail || bufferCase;

  const handleAction = async (fn: () => Promise<unknown>) => {
    setActionLoading(true);
    try {
      await fn();
      toast({ title: "Action completed" });
      // Refresh
      const updated = await getBufferCase(c.id);
      setDetail(updated);
      onRefresh();
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Dialog open={!!bufferCase} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {c.case_number}
            <Badge variant={c.case_type === "iw" ? "default" : "destructive"} className="text-xs">
              {c.case_type === "iw" ? "In-Warranty" : "Out-of-Warranty"}
            </Badge>
            <Badge className={`text-xs ${CASE_STATUS_COLORS[c.status]}`}>
              {BUFFER_CASE_STATUS_LABELS[c.status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {c.case_id && (
                <div><span className="text-slate-500">HP Case ID:</span> <strong>{c.case_id}</strong></div>
              )}
              <div><span className="text-slate-500">Region:</span> <strong>{c.region_display}</strong></div>
              <div><span className="text-slate-500">Customer:</span> <strong>{c.customer_name}</strong></div>
              <div><span className="text-slate-500">Contact:</span> {c.customer_contact || "—"}</div>
              <div><span className="text-slate-500">Product:</span> {c.product_name || "—"}</div>
              <div><span className="text-slate-500">Serial #:</span> {c.serial_number || "—"}</div>
              <div><span className="text-slate-500">Part:</span> {c.part_number ? `${c.part_number} — ${c.part_name}` : "Not allocated"}</div>
              <div><span className="text-slate-500">Qty Used:</span> {c.qty_used}</div>
              <div><span className="text-slate-500">Engineer:</span> {c.assigned_engineer_name || "Not assigned"}</div>
              <div><span className="text-slate-500">Created By:</span> {c.created_by_name}</div>
              {c.approved_by_name && (
                <div><span className="text-slate-500">Approved By:</span> <strong className="text-green-600">{c.approved_by_name}</strong></div>
              )}
              <div><span className="text-slate-500">Created:</span> {new Date(c.created_at).toLocaleString()}</div>
            </div>

            {/* OOW Approval Info */}
            {c.oow_approval && (
              <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                <h4 className="text-sm font-medium mb-2">OOW Approval</h4>
                <div className="text-sm space-y-1">
                  <div>Status: <Badge className="text-xs">{c.oow_approval.status}</Badge></div>
                  <div>Requested By: {c.oow_approval.requested_by_name}</div>
                  {c.oow_approval.approved_by_name && (
                    <div>Actioned By: {c.oow_approval.approved_by_name} ({c.oow_approval.approver_role})</div>
                  )}
                  {c.oow_approval.reason && <div>Reason: {c.oow_approval.reason}</div>}
                </div>
              </div>
            )}

            {/* Proofs */}
            {c.proofs && c.proofs.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Uploaded Proofs</h4>
                <div className="flex flex-wrap gap-2">
                  {c.proofs.map((p) => (
                    <Badge key={p.id} variant="outline" className="gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      {p.proof_type} — {p.description || "Proof"}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Replenishment */}
            {c.replenishment && (
              <div className="p-3 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20">
                <h4 className="text-sm font-medium mb-2">Replenishment Order</h4>
                <div className="text-sm space-y-1">
                  <div>Order #: <strong>{c.replenishment.order_number}</strong></div>
                  <div>Status: <Badge className="text-xs">{c.replenishment.status}</Badge></div>
                  <div>Part: {c.replenishment.part_number} x{c.replenishment.quantity}</div>
                </div>
              </div>
            )}

            {/* Actions based on status */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-semibold">Actions</h4>

              {/* Allocate Part */}
              {(c.status === "created" || c.status === "approved") && (
                <div className="space-y-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <Label className="text-xs font-medium">Allocate Buffer Part</Label>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Select value={selectedStockItem} onValueChange={setSelectedStockItem}>
                        <SelectTrigger><SelectValue placeholder="Select stock item" /></SelectTrigger>
                        <SelectContent>
                          {stockItems.filter(s => s.qty_available > 0).map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              {s.part_number} — {s.part_name} [{s.region_display}] (Avail: {s.qty_available})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      type="number" min={1} value={allocateQty}
                      onChange={(e) => setAllocateQty(Number(e.target.value))}
                      className="w-20"
                    />
                    <Button
                      size="sm" disabled={!selectedStockItem || actionLoading}
                      onClick={() => handleAction(() =>
                        allocatePart(c.id, { buffer_stock_item_id: Number(selectedStockItem), qty_used: allocateQty })
                      )}
                    >
                      Allocate
                    </Button>
                  </div>
                </div>
              )}

              {/* Assign Engineer */}
              {c.status === "part_allocated" && (
                <div className="space-y-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <Label className="text-xs font-medium">Assign Engineer</Label>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Select value={selectedEngineer} onValueChange={setSelectedEngineer}>
                        <SelectTrigger><SelectValue placeholder="Select engineer" /></SelectTrigger>
                        <SelectContent>
                          {engineers.map((e) => (
                            <SelectItem key={e.id} value={String(e.id)}>
                              {e.name} ({e.region})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      size="sm" disabled={!selectedEngineer || actionLoading}
                      onClick={() => handleAction(() => assignEngineer(c.id, Number(selectedEngineer)))}
                    >
                      Assign
                    </Button>
                  </div>
                </div>
              )}

              {/* Start Service */}
              {c.status === "engineer_assigned" && (
                <Button
                  size="sm" disabled={actionLoading}
                  onClick={() => handleAction(() => transitionCase(c.id, "in_progress"))}
                  className="gap-1"
                >
                  <ArrowRight className="w-4 h-4" /> Start Service
                </Button>
              )}

              {/* Complete Service */}
              {c.status === "in_progress" && (
                <div className="space-y-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <Label className="text-xs font-medium">Complete Service</Label>
                  <Textarea
                    placeholder="Resolution summary..."
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows={2}
                  />
                  <Textarea
                    placeholder="Service notes (optional)..."
                    value={serviceNotes}
                    onChange={(e) => setServiceNotes(e.target.value)}
                    rows={2}
                  />
                  <Button
                    size="sm" disabled={actionLoading}
                    onClick={() => handleAction(() => completeService(c.id, { resolution_summary: resolution, service_notes: serviceNotes }))}
                  >
                    Mark Service Complete
                  </Button>
                </div>
              )}

              {/* Upload Proof */}
              {(c.status === "in_progress" || c.status === "service_completed") && (
                <div className="space-y-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <Label className="text-xs font-medium">Upload Proof</Label>
                  <div className="flex items-end gap-2">
                    <Input
                      type="file"
                      accept="image/*,video/*,.pdf"
                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      className="flex-1"
                    />
                    <Button
                      size="sm" disabled={!proofFile || actionLoading}
                      onClick={() => {
                        if (!proofFile) return;
                        const fd = new FormData();
                        fd.append("file", proofFile);
                        fd.append("proof_type", proofFile.type.startsWith("video") ? "video" : "image");
                        fd.append("description", "Service proof");
                        handleAction(() => uploadProof(c.id, fd));
                      }}
                      className="gap-1"
                    >
                      <Upload className="w-4 h-4" /> Upload
                    </Button>
                  </div>
                </div>
              )}

              {/* Trigger Replenishment */}
              {c.status === "service_completed" && (
                <Button
                  size="sm" disabled={actionLoading}
                  onClick={() => handleAction(() => triggerReplenishment(c.id))}
                  variant="default"
                  className="gap-1"
                >
                  Trigger HP Replenishment Order
                </Button>
              )}

              {/* Close Case */}
              {c.status === "stock_replenished" && (
                <Button
                  size="sm" disabled={actionLoading}
                  onClick={() => handleAction(() => transitionCase(c.id, "closed"))}
                  variant="default"
                  className="gap-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" /> Close Case
                </Button>
              )}

              {/* Cannot close warning */}
              {["pending_replenishment", "replenishment_ordered"].includes(c.status) && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-sm text-amber-700 dark:text-amber-300">
                  Case cannot be closed until replacement stock is received from HP.
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
