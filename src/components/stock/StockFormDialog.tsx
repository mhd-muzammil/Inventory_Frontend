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
import { stockItemSchema, type StockItemFormData } from "@/lib/validations";
import { createStockItem, updateStockItem } from "@/api/stock";
import { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import type { StockItem } from "@/types";

interface StockFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: StockItem | null;
  onSuccess: () => void;
}

export function StockFormDialog({ open, onOpenChange, editing, onSuccess }: StockFormDialogProps) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StockItemFormData>({
    resolver: zodResolver(stockItemSchema),
  });

  useEffect(() => {
    if (open && editing) {
      reset({
        part_number: editing.part_number,
        part_name: editing.part_name,
        description: editing.description || "",
        category: editing.category || "",
        brand: editing.brand || "",
        qty_on_hand: editing.qty_on_hand,
        reorder_level: editing.reorder_level,
        reorder_qty: editing.reorder_qty,
        unit_cost: editing.unit_cost ?? undefined,
        storage_location: editing.storage_location || "",
      });
    } else if (open) {
      reset({
        part_number: "", part_name: "", description: "", category: "", brand: "",
        qty_on_hand: 0, reorder_level: 5, reorder_qty: 10, storage_location: "",
      });
    }
  }, [open, editing, reset]);

  const onSubmit = async (data: StockItemFormData) => {
    setSaving(true);
    try {
      if (editing) {
        await updateStockItem(editing.id, data);
        toast({ title: "Stock item updated successfully" });
      } else {
        await createStockItem(data);
        toast({ title: "Stock item created successfully" });
      }
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
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Stock Item" : "Add Stock Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Part Number *</Label>
              <Input {...register("part_number")} placeholder="e.g. HP-1234" />
              {errors.part_number && <p className="text-xs text-red-500">{errors.part_number.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Part Name *</Label>
              <Input {...register("part_name")} placeholder="e.g. Toner Cartridge" />
              {errors.part_name && <p className="text-xs text-red-500">{errors.part_name.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input {...register("description")} placeholder="Brief description" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Input {...register("category")} placeholder="e.g. Printer Parts" />
            </div>
            <div className="space-y-2">
              <Label>Brand</Label>
              <Input {...register("brand")} placeholder="e.g. HP" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Quantity on Hand</Label>
              <Input type="number" {...register("qty_on_hand")} min={0} />
              {errors.qty_on_hand && <p className="text-xs text-red-500">{errors.qty_on_hand.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Reorder Level</Label>
              <Input type="number" {...register("reorder_level")} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Reorder Qty</Label>
              <Input type="number" {...register("reorder_qty")} min={0} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit Cost</Label>
              <Input type="number" step="0.01" {...register("unit_cost")} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Storage Location</Label>
              <Input {...register("storage_location")} placeholder="e.g. Rack A-3" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
