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
import { createTransfer, getBufferStockItems } from "@/api/bufferStock";
import { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import { REGION_LABELS } from "@/types";
import type { BufferStockItem } from "@/types/bufferStock";

const schema = z.object({
  buffer_stock_item: z.coerce.number().min(1, "Select a stock item"),
  part_number: z.string().min(1, "Required"),
  part_name: z.string().min(1, "Required"),
  quantity: z.coerce.number().min(1, "Min 1"),
  source_region: z.string().min(1, "Required"),
  destination_region: z.string().min(1, "Required"),
  notes: z.string().optional().default(""),
}).refine((d) => d.source_region !== d.destination_region, {
  message: "Destination must differ from source",
  path: ["destination_region"],
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TransferFormDialog({ open, onOpenChange, onSuccess }: Props) {
  const [saving, setSaving] = useState(false);
  const [stockItems, setStockItems] = useState<BufferStockItem[]>([]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) {
      reset({ buffer_stock_item: 0, part_number: "", part_name: "", quantity: 1, source_region: "", destination_region: "", notes: "" });
      getBufferStockItems({ view: "overall", per_page: 100 }).then((res) => setStockItems(res.items));
    }
  }, [open, reset]);

  const selectedItemId = watch("buffer_stock_item");

  useEffect(() => {
    if (selectedItemId) {
      const item = stockItems.find((s) => s.id === Number(selectedItemId));
      if (item) {
        setValue("part_number", item.part_number);
        setValue("part_name", item.part_name);
        setValue("source_region", item.region);
      }
    }
  }, [selectedItemId, stockItems, setValue]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      await createTransfer(data);
      toast({ title: "Transfer request created" });
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
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Request Inter-Region Transfer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Source Stock Item *</Label>
            <Select
              value={selectedItemId ? String(selectedItemId) : ""}
              onValueChange={(v) => setValue("buffer_stock_item", Number(v))}
            >
              <SelectTrigger><SelectValue placeholder="Select stock item" /></SelectTrigger>
              <SelectContent>
                {stockItems.filter(s => s.qty_available > 0).map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.part_number} — {s.part_name} [{s.region_display}] (Avail: {s.qty_available})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.buffer_stock_item && <p className="text-xs text-red-500">{errors.buffer_stock_item.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Part Number</Label>
              <Input {...register("part_number")} readOnly className="bg-slate-50" />
            </div>
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input type="number" {...register("quantity")} min={1} />
              {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source Region</Label>
              <Input {...register("source_region")} readOnly className="bg-slate-50" />
            </div>
            <div className="space-y-2">
              <Label>Destination Region *</Label>
              <Select value={watch("destination_region")} onValueChange={(v) => setValue("destination_region", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(REGION_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.destination_region && <p className="text-xs text-red-500">{errors.destination_region.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...register("notes")} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
