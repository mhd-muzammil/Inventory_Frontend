import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { createBufferStockItem, updateBufferStockItem } from "@/api/bufferStock";
import { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import { REGION_LABELS } from "@/types";
import { BUFFER_CATEGORY_LABELS } from "@/types/bufferStock";
import type { BufferStockItem } from "@/types/bufferStock";

const schema = z.object({
  part_number: z.string().min(1, "Required"),
  part_name: z.string().min(1, "Required"),
  description: z.string().optional().default(""),
  category: z.string().default("other"),
  brand: z.string().default("HP"),
  region: z.string().min(1, "Region is required"),
  qty_on_hand: z.coerce.number().min(0).default(0),
  reorder_level: z.coerce.number().min(0).default(2),
  unit_cost: z.coerce.number().min(0).optional(),
  storage_location: z.string().optional().default(""),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: BufferStockItem | null;
  onSuccess: () => void;
}

export function StockItemFormDialog({ open, onOpenChange, editing, onSuccess }: Props) {
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open && editing) {
      reset({
        part_number: editing.part_number,
        part_name: editing.part_name,
        description: editing.description,
        category: editing.category,
        brand: editing.brand,
        region: editing.region,
        qty_on_hand: editing.qty_on_hand,
        reorder_level: editing.reorder_level,
        unit_cost: editing.unit_cost ?? undefined,
        storage_location: editing.storage_location,
      });
    } else if (open) {
      reset({
        part_number: "", part_name: "", description: "", category: "other",
        brand: "HP", region: "", qty_on_hand: 0, reorder_level: 2, storage_location: "",
      });
    }
  }, [open, editing, reset]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      if (editing) {
        await updateBufferStockItem(editing.id, data);
        toast({ title: "Stock item updated" });
      } else {
        await createBufferStockItem(data);
        toast({ title: "Stock item added" });
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
          <DialogTitle>{editing ? "Edit Buffer Stock Item" : "Add Buffer Stock Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Part Number *</Label>
              <Input {...register("part_number")} placeholder="e.g. HP-CH561" />
              {errors.part_number && <p className="text-xs text-red-500">{errors.part_number.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Part Name *</Label>
              <Input {...register("part_name")} placeholder="e.g. Print Head Assembly" />
              {errors.part_name && <p className="text-xs text-red-500">{errors.part_name.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={watch("category")} onValueChange={(v) => setValue("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(BUFFER_CATEGORY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Region *</Label>
              <Select value={watch("region")} onValueChange={(v) => setValue("region", v)}>
                <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(REGION_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.region && <p className="text-xs text-red-500">{errors.region.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Qty On Hand</Label>
              <Input type="number" {...register("qty_on_hand")} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Reorder Level</Label>
              <Input type="number" {...register("reorder_level")} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Unit Cost</Label>
              <Input type="number" step="0.01" {...register("unit_cost")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Brand</Label>
              <Input {...register("brand")} />
            </div>
            <div className="space-y-2">
              <Label>Storage Location</Label>
              <Input {...register("storage_location")} placeholder="e.g. Shelf A3" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...register("description")} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
