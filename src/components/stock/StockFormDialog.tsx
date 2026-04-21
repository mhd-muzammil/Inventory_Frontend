import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { stockItemSchema, type StockItemFormData } from "@/lib/validations";
import { createStockItem, updateStockItem } from "@/api/stock";
import { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/authStore";
import type { StockItem } from "@/types";

interface StockFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: StockItem | null;
  onSuccess: () => void;
}

export function StockFormDialog({ open, onOpenChange, editing, onSuccess }: StockFormDialogProps) {
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const userRegion = user?.region || "";

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<StockItemFormData>({
    resolver: zodResolver(stockItemSchema),
  });

  const watchQty = watch("qty_on_hand");
  const watchCost = watch("unit_cost");
  const inventoryValue = ((Number(watchQty) || 0) * (Number(watchCost) || 0)).toFixed(2);

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
        storage_location: editing.storage_location || userRegion,
      });
    } else if (open) {
      reset({
        part_number: "", part_name: "", description: "", category: "", brand: "",
        qty_on_hand: 0, reorder_level: 5, reorder_qty: 10, storage_location: isAdmin ? "" : userRegion,
      });
    }
  }, [open, editing, reset, isAdmin, userRegion]);

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
              <Label>Part Name *</Label>
              <Input {...register("part_name")} placeholder="e.g. Toner Cartridge" />
              {errors.part_name && <p className="text-xs text-red-500">{errors.part_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Part Number *</Label>
              <Input {...register("part_number")} placeholder="e.g. HP-1234" />
              {errors.part_number && <p className="text-xs text-red-500">{errors.part_number.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input {...register("description")} placeholder="Brief description" />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Controller
                control={control}
                name="storage_location"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={!isAdmin && !!userRegion}>
                    <SelectTrigger className={!isAdmin && !!userRegion ? "bg-slate-50 dark:bg-slate-900" : ""}>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chennai">Chennai</SelectItem>
                      <SelectItem value="vellore">Vellore</SelectItem>
                      <SelectItem value="salem">Salem</SelectItem>
                      <SelectItem value="hosur">Hosur</SelectItem>
                      <SelectItem value="kanchipuram">Kanchipuram</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Input {...register("brand")} placeholder="e.g. HP" />
            </div>
            <div className="space-y-2">
              <Label>Unit (Nos, Box)</Label>
              <Input {...register("category")} placeholder="e.g. Printer Parts" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Qty in One Unit</Label>
              <Input type="number" {...register("reorder_qty")} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Total Stock</Label>
              <Input type="number" {...register("qty_on_hand")} min={0} />
              {errors.qty_on_hand && <p className="text-xs text-red-500">{errors.qty_on_hand.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Low Stock Alert</Label>
              <Input type="number" {...register("reorder_level")} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Unit Price ($)</Label>
              <Input type="number" step="0.01" {...register("unit_cost")} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Total Value ($)</Label>
              <Input
                disabled
                value={inventoryValue}
                className="bg-slate-100 dark:bg-slate-800"
              />
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
