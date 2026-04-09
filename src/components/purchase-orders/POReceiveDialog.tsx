import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Package } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import type { PurchaseOrder } from "@/types";

interface POReceiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: PurchaseOrder | null;
  onReceive: (id: number | string, items: { po_item_id: number; received_qty: number }[]) => Promise<void>;
}

export function POReceiveDialog({ open, onOpenChange, purchaseOrder, onReceive }: POReceiveDialogProps) {
  const [saving, setSaving] = useState(false);
  const [receivedQtys, setReceivedQtys] = useState<Record<number, number>>({});

  useEffect(() => {
    if (open && purchaseOrder) {
      const defaults: Record<number, number> = {};
      purchaseOrder.items.forEach((item) => {
        if (item.id) {
          const remaining = item.quantity - item.received_qty;
          defaults[item.id] = remaining > 0 ? remaining : 0;
        }
      });
      setReceivedQtys(defaults);
    }
  }, [open, purchaseOrder]);

  const handleSubmit = async () => {
    if (!purchaseOrder) return;

    const items = Object.entries(receivedQtys)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ po_item_id: Number(id), received_qty: qty }));

    if (items.length === 0) {
      toast({ title: "Enter at least one received quantity", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await onReceive(purchaseOrder.id, items);
      onOpenChange(false);
    } catch {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  };

  if (!purchaseOrder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Receive Items — {purchaseOrder.po_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-slate-500">
            Enter the quantity received for each item. Stock will be updated automatically.
          </p>

          {purchaseOrder.items.map((item) => {
            if (!item.id) return null;
            const remaining = item.quantity - item.received_qty;
            const isFullyReceived = remaining <= 0;

            return (
              <div
                key={item.id}
                className={`p-3 rounded-xl border ${
                  isFullyReceived
                    ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{item.part_name}</p>
                    <p className="text-xs text-slate-500">{item.part_number}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>Ordered: {item.quantity}</p>
                    <p>Received: {item.received_qty}</p>
                    <p className="font-medium">Remaining: {remaining}</p>
                  </div>
                </div>

                {!isFullyReceived && (
                  <div className="flex items-center gap-3">
                    <Label className="text-xs whitespace-nowrap">Receive Now:</Label>
                    <Input
                      type="number"
                      min={0}
                      max={remaining}
                      value={receivedQtys[item.id] ?? 0}
                      onChange={(e) => setReceivedQtys((prev) => ({
                        ...prev,
                        [item.id!]: Math.min(Number(e.target.value) || 0, remaining),
                      }))}
                      className="w-24"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => setReceivedQtys((prev) => ({ ...prev, [item.id!]: remaining }))}
                    >
                      All
                    </Button>
                  </div>
                )}

                {isFullyReceived && (
                  <p className="text-xs font-medium text-green-600 dark:text-green-400">Fully received</p>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
