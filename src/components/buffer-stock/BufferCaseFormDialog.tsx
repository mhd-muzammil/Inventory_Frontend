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
import { Loader2, AlertCircle } from "lucide-react";
import { createBufferCase } from "@/api/bufferStock";
import { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import { REGION_LABELS } from "@/types";
import { useAuthStore } from "@/store/authStore";

const schema = z.object({
  case_type: z.enum(["iw", "oow"]),
  case_id: z.string().optional().default(""),
  region: z.string().min(1, "Region is required"),
  customer_name: z.string().min(1, "Customer name is required"),
  customer_contact: z.string().optional().default(""),
  customer_email: z.string().optional().default(""),
  customer_address: z.string().optional().default(""),
  product_name: z.string().optional().default(""),
  serial_number: z.string().optional().default(""),
  model_number: z.string().optional().default(""),
  part_number: z.string().optional().default(""),
  part_name: z.string().optional().default(""),
  qty_used: z.coerce.number().min(1).default(1),
}).refine(
  (data) => data.case_type !== "iw" || (data.case_id && data.case_id.length > 0),
  { message: "Case ID is required for In-Warranty cases", path: ["case_id"] },
);

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BufferCaseFormDialog({ open, onOpenChange, onSuccess }: Props) {
  const user = useAuthStore((s) => s.user);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { case_type: "iw", qty_used: 1 },
  });

  const caseType = watch("case_type");

  useEffect(() => {
    if (open) {
      reset({
        case_type: "iw",
        case_id: "",
        region: user?.region || "",
        customer_name: "",
        customer_contact: "",
        customer_email: "",
        customer_address: "",
        product_name: "",
        serial_number: "",
        model_number: "",
        part_number: "",
        part_name: "",
        qty_used: 1,
      });
    }
  }, [open, user, reset]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      await createBufferCase(data);
      toast({
        title: data.case_type === "oow"
          ? "OOW case created. Pending approval."
          : "IW case created successfully.",
      });
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Buffer Case</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          {/* Case Type & ID */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Case Type *</Label>
              <Select value={caseType} onValueChange={(v) => setValue("case_type", v as "iw" | "oow")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="iw">In-Warranty (IW)</SelectItem>
                  <SelectItem value="oow">Out-of-Warranty (OOW)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>HP Case ID {caseType === "iw" ? "*" : "(Optional)"}</Label>
              <Input {...register("case_id")} placeholder="e.g. HP-2026-12345" />
              {errors.case_id && <p className="text-xs text-red-500">{errors.case_id.message}</p>}
            </div>
          </div>

          {caseType === "oow" && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                OOW cases require approval from a Manager or Super Admin before buffer stock can be used.
              </p>
            </div>
          )}

          {/* Region */}
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

          {/* Customer */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Customer Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input {...register("customer_name")} />
                {errors.customer_name && <p className="text-xs text-red-500">{errors.customer_name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Contact</Label>
                <Input {...register("customer_contact")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input {...register("customer_email")} type="email" />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input {...register("customer_address")} />
              </div>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Product Details</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input {...register("product_name")} />
              </div>
              <div className="space-y-2">
                <Label>Serial Number</Label>
                <Input {...register("serial_number")} />
              </div>
              <div className="space-y-2">
                <Label>Model Number</Label>
                <Input {...register("model_number")} />
              </div>
            </div>
          </div>

          {/* Part Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Part Required</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Part Number</Label>
                <Input {...register("part_number")} />
              </div>
              <div className="space-y-2">
                <Label>Part Name</Label>
                <Input {...register("part_name")} />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" {...register("qty_used")} min={1} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Case
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
