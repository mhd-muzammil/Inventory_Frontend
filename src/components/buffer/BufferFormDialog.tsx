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
import { bufferPartSchema, type BufferPartFormData } from "@/lib/validations";
import { createBufferPart, updateBufferPart } from "@/api/bufferParts";
import { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import { REGION_LABELS } from "@/types";
import type { BufferPart, Region } from "@/types";
import { useAuthStore } from "@/store/authStore";

interface BufferFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: BufferPart | null;
  onSuccess: () => void;
}

export function BufferFormDialog({ open, onOpenChange, editing, onSuccess }: BufferFormDialogProps) {
  const [saving, setSaving] = useState(false);
  const user = useAuthStore((s) => s.user);
  const canPickRegion = user?.role === "admin" || user?.role === "super_admin" || user?.role === "manager";
  const lockedRegion: Region | "" = canPickRegion ? "" : (user?.region ?? "");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BufferPartFormData>({
    resolver: zodResolver(bufferPartSchema),
  });

  useEffect(() => {
    if (open && editing) {
      reset({
        part_number: editing.part_number,
        part_name: editing.part_name,
        quantity: editing.quantity,
        general_name: editing.general_name || "",
        region: editing.region || lockedRegion,
      });
    } else if (open) {
      reset({
        part_number: "",
        part_name: "",
        quantity: 1,
        general_name: "",
        region: lockedRegion,
      });
    }
  }, [open, editing, reset, lockedRegion]);

  const onSubmit = async (data: BufferPartFormData) => {
    if (canPickRegion && !data.region) {
      toast({ title: "Region is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = canPickRegion ? data : { ...data, region: lockedRegion };
      if (editing) {
        await updateBufferPart(editing.id, payload);
        toast({ title: "Buffer part updated successfully" });
      } else {
        await createBufferPart({
          part_number: payload.part_number,
          part_name: payload.part_name,
          quantity: payload.quantity,
          general_name: payload.general_name,
          region: payload.region,
        });
        toast({ title: "Buffer part added successfully" });
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
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Buffer Part" : "Add Buffer Part"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input type="number" {...register("quantity")} placeholder="1" min={1} />
              {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>General Name</Label>
              <Input {...register("general_name")} placeholder="e.g. Printer Consumable" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Region *</Label>
            {canPickRegion ? (
              <select
                {...register("region")}
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">Select region...</option>
                {(Object.entries(REGION_LABELS) as [Region, string][]).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            ) : (
              <Input
                value={lockedRegion ? REGION_LABELS[lockedRegion as Region] : "—"}
                disabled
                className="bg-slate-50 dark:bg-slate-800"
              />
            )}
            {errors.region && <p className="text-xs text-red-500">{errors.region.message}</p>}
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
