import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Loader2, Plus, Trash2 } from "lucide-react";
import { purchaseOrderSchema, type PurchaseOrderFormData } from "@/lib/validations";
import { createPurchaseOrder } from "@/api/purchaseOrders";
import { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";

interface POFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function POFormDialog({ open, onOpenChange, onSuccess }: POFormDialogProps) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      items: [{ part_number: "", part_name: "", quantity: 1, unit_price: 0 }],
      supplier_name: "",
      supplier_contact: "",
      supplier_email: "",
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    if (open) {
      reset({
        supplier_name: "",
        supplier_contact: "",
        supplier_email: "",
        items: [{ part_number: "", part_name: "", quantity: 1, unit_price: 0 }],
        notes: "",
      });
    }
  }, [open, reset]);

  // Watch all items to calculate totals
  const watchedItems = watch("items");

  const itemTotals = watchedItems?.map((item) => {
    const qty = Number(item?.quantity) || 0;
    const price = Number(item?.unit_price) || 0;
    return qty * price;
  }) ?? [];

  const grandTotal = itemTotals.reduce((sum, t) => sum + t, 0);

  const onSubmit = async (data: PurchaseOrderFormData) => {
    setSaving(true);
    try {
      // Add computed totals to each item
      const payload = {
        ...data,
        items: data.items.map((item, i) => ({
          ...item,
          total: itemTotals[i] || 0,
        })),
      };
      await createPurchaseOrder(payload);
      toast({ title: "Purchase order created successfully" });
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
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-1">
          {/* Supplier Info */}
          <div className="space-y-2">
            <Label>Supplier Name *</Label>
            <Input {...register("supplier_name")} placeholder="e.g. ABC Electronics" />
            {errors.supplier_name && <p className="text-xs text-red-500">{errors.supplier_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Supplier Contact</Label>
              <Input {...register("supplier_contact")} placeholder="Phone number" />
            </div>
            <div className="space-y-2">
              <Label>Supplier Email</Label>
              <Input type="email" {...register("supplier_email")} placeholder="supplier@example.com" />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => append({ part_number: "", part_name: "", quantity: 1, unit_price: 0 })}
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Item {index + 1}</span>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => remove(index)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Part Number *</Label>
                    <Input {...register(`items.${index}.part_number`)} placeholder="HP-1234" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Part Name *</Label>
                    <Input {...register(`items.${index}.part_name`)} placeholder="Toner Cartridge" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Qty *</Label>
                    <Input type="number" {...register(`items.${index}.quantity`)} min={1} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Unit Price</Label>
                    <Input type="number" step="0.01" {...register(`items.${index}.unit_price`)} min={0} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Total</Label>
                    <div className="flex items-center h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm font-medium">
                      {(itemTotals[index] || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {errors.items && typeof errors.items.message === "string" && (
              <p className="text-xs text-red-500">{errors.items.message}</p>
            )}

            {/* Grand Total */}
            <div className="flex justify-end p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300 mr-4">Grand Total:</span>
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Expected Delivery</Label>
              <Input type="date" {...register("expected_delivery")} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input {...register("notes")} placeholder="Any additional notes" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
