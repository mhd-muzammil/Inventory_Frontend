import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Loader2 } from "lucide-react";
import { stockAdjustSchema, type StockAdjustFormData } from "@/lib/validations";
import { adjustStock } from "@/api/stock";
import { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import type { StockItem } from "@/types";

interface StockAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockItem: StockItem | null;
  onSuccess: () => void;
}

export function StockAdjustDialog({ open, onOpenChange, stockItem, onSuccess }: StockAdjustDialogProps) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StockAdjustFormData>({
    resolver: zodResolver(stockAdjustSchema),
  });

  useEffect(() => {
    if (open) {
      reset({ quantity: 0, reason: "" });
    }
  }, [open, reset]);

  const onSubmit = async (data: StockAdjustFormData) => {
    if (!stockItem) return;
    setSaving(true);
    try {
      await adjustStock({ stock_item_id: stockItem.id, ...data });
      toast({ title: "Stock adjusted successfully" });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
        </DialogHeader>

        {stockItem && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium">{stockItem.part_name}</p>
            <p className="text-xs text-slate-500">{stockItem.part_number} — Current: {stockItem.qty_on_hand}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Quantity Adjustment *</Label>
            <Input type="number" {...register("quantity")} placeholder="e.g. 5 or -3" />
            <p className="text-xs text-slate-500">Use positive to add, negative to remove.</p>
            {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Reason *</Label>
            <Input {...register("reason")} placeholder="e.g. Physical count correction" />
            {errors.reason && <p className="text-xs text-red-500">{errors.reason.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Adjust
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
