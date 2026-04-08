import { useEffect, useRef, useState } from "react";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ticketSchema, type TicketFormData } from "@/lib/validations";
import { SERVICE_TYPE_LABELS, REGION_LABELS } from "@/types";
import type { Region } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/components/ui/use-toast";
import {
  Send,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Printer,
  Save,
} from "lucide-react";

type Step = "fill" | "review" | "done";

interface TicketFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  onVerifiedSubmit?: () => void;
}

export function TicketFormDialog({
  open,
  onOpenChange,
  onSubmit,
  onVerifiedSubmit,
}: TicketFormDialogProps) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [step, setStep] = useState<Step>("fill");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState<TicketFormData | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      work_order: "",
      cust_name: "",
      cust_contact: "",
      cust_email: "",
      cust_address: "",
      location: "",
      product_name: "",
      serial_number: "",
      model_number: "",
      brand: "",
      case_id: "",
      condition_received: "",
      service_type: "warranty",
      priority: "medium",
      issue_description: "",
      arrival_date: null,
      target_completion: null,
    },
  });

  const serviceTypeValue = watch("service_type");
  const regionValue = watch("region");

  useEffect(() => {
    if (open) {
      setStep("fill");
      setSubmittedData(null);
      reset();
    }
  }, [open, reset]);

  const handleSendToReview = (data: TicketFormData) => {
    setSubmittedData(data);
    setStep("review");
  };

  const handleConfirmAndSubmit = async () => {
    const data = submittedData || getValues();
    setSubmitLoading(true);
    try {
      await onSubmit(data);
      setStep("done");
      toast({ title: "Ticket created successfully" });
    } catch (err: any) {
      const errData = err.response?.data;
      let description = "Please try again";
      if (errData) {
        if (typeof errData === "string") description = errData;
        else if (errData.detail) description = errData.detail;
        else {
          const msgs = Object.entries(errData)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join("; ");
          if (msgs) description = msgs;
        }
      }
      toast({ title: "Error creating ticket", description, variant: "destructive" });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePrint = () => {
    const data = submittedData || getValues();
    const sType = SERVICE_TYPE_LABELS[data.service_type as keyof typeof SERVICE_TYPE_LABELS] || data.service_type;

    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Service Ticket</title>
      <style>
        body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;color:#1e293b;font-size:13px}
        h1{font-size:18px;margin-bottom:2px}
        .sub{color:#64748b;font-size:12px;margin-bottom:20px}
        .section{margin-bottom:16px}
        .section-title{font-size:13px;font-weight:600;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:8px}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 20px}
        .label{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px}
        .value{font-size:13px;color:#1e293b;margin-bottom:4px}
        .full{grid-column:span 2}
        .complaint{min-height:60px;border:1px solid #e2e8f0;border-radius:6px;padding:8px;white-space:pre-wrap;margin-top:4px}
        .sig-line{margin-top:40px;display:flex;justify-content:space-between}
        .sig-box{text-align:center;width:180px}
        .sig-box .line{border-top:1px solid #94a3b8;margin-top:50px;padding-top:4px;font-size:11px;color:#64748b}
        @media print{body{padding:20px}}
      </style></head><body>
      <h1>Service Ticket - CSO Entry</h1>
      <p class="sub">RenderWays Service Management</p>
      <div class="section">
        <div class="section-title">Ticket Details</div>
        <div class="grid">
          <div><div class="label">Work Order</div><div class="value">${data.work_order || '-'}</div></div>
          <div><div class="label">Case ID</div><div class="value">${data.case_id || 'Auto-generated'}</div></div>
          <div><div class="label">Warranty Status</div><div class="value">${sType}</div></div>
          <div><div class="label">Region</div><div class="value">${data.region ? ({"vellore":"Vellore","salem":"Salem","chennai":"Chennai","kanchipuram":"Kanchipuram","hosur":"Hosur"} as Record<string,string>)[data.region] || data.region : '-'}</div></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Customer Information</div>
        <div class="grid">
          <div><div class="label">Customer Name</div><div class="value">${data.cust_name || '-'}</div></div>
          <div><div class="label">Contact Number</div><div class="value">${data.cust_contact || '-'}</div></div>
          <div><div class="label">Email</div><div class="value">${data.cust_email || '-'}</div></div>
          <div><div class="label">Address</div><div class="value">${data.cust_address || '-'}</div></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Product Details</div>
        <div class="grid">
          <div><div class="label">Product</div><div class="value">${data.product_name || '-'}</div></div>
          <div><div class="label">Serial Number</div><div class="value">${data.serial_number || '-'}</div></div>
          <div><div class="label">Model</div><div class="value">${data.model_number || '-'}</div></div>
          <div><div class="label">Brand</div><div class="value">${data.brand || '-'}</div></div>
          <div><div class="label">Condition</div><div class="value">${data.condition_received || '-'}</div></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Complaint</div>
        <div class="complaint">${data.issue_description || '-'}</div>
      </div>
      <div class="sig-line">
        <div class="sig-box"><div class="line">Customer Signature</div></div>
        <div class="sig-box"><div class="line">Received By</div></div>
      </div>
      <script>window.onload=function(){window.print()}</script>
    </body></html>`);
    printWindow.document.close();
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-4">
      {(["fill", "review", "done"] as Step[]).map((s, i) => {
        const labels = ["Fill Form", "Customer Review", "Done"];
        const isActive = s === step;
        const isPast = (["fill", "review", "done"] as Step[]).indexOf(step) > i;
        return (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className={`h-px w-8 ${isPast ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"}`} />}
            <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
              isActive ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
              : isPast ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
              : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
            }`}>
              {isPast && <CheckCircle2 className="w-3 h-3" />}
              {labels[i]}
            </div>
          </div>
        );
      })}
    </div>
  );

  const FormFields = ({ disabled }: { disabled?: boolean }) => (
    <div className="space-y-5">
      {/* Row 1: Work Order + Case ID + Warranty Status + Region (admin) */}
      <div className={`grid grid-cols-1 gap-4 ${isAdmin ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
        <div className="space-y-2">
          <Label>Work Order</Label>
          <Input {...register("work_order")} placeholder="Work order number" disabled={disabled} />
        </div>
        <div className="space-y-2">
          <Label>Case ID</Label>
          <Input {...register("case_id")} placeholder="Auto-generated if empty" disabled={disabled} />
        </div>
        <div className="space-y-2">
          <Label>Warranty Status *</Label>
          {disabled ? (
            <Input value={SERVICE_TYPE_LABELS[serviceTypeValue as keyof typeof SERVICE_TYPE_LABELS] || serviceTypeValue} disabled />
          ) : (
            <Select value={serviceTypeValue} onValueChange={(val) => setValue("service_type", val as TicketFormData["service_type"])}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {Object.entries(SERVICE_TYPE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {isAdmin && (
          <div className="space-y-2">
            <Label>Region *</Label>
            {disabled ? (
              <Input value={REGION_LABELS[regionValue as Region] || regionValue || "-"} disabled />
            ) : (
              <Select value={regionValue || ""} onValueChange={(val) => setValue("region", val as Region)}>
                <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(REGION_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>

      {/* Row 2: Customer Name + Contact Number */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Customer Name *</Label>
          <Input {...register("cust_name")} placeholder="Full name" disabled={disabled} />
          {errors.cust_name && <p className="text-xs text-red-500">{errors.cust_name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Contact Number</Label>
          <Input {...register("cust_contact")} placeholder="Phone number" disabled={disabled} />
        </div>
      </div>

      {/* Row 3: Location + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Location</Label>
          <Input {...register("location")} placeholder="Customer location / city" disabled={disabled} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input {...register("cust_email")} placeholder="customer@email.com" disabled={disabled} />
        </div>
      </div>

      {/* Row 4: Product + Serial + Brand */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Product Name</Label>
          <Input {...register("product_name")} placeholder="e.g. HP Laptop" disabled={disabled} />
        </div>
        <div className="space-y-2">
          <Label>Serial Number</Label>
          <Input {...register("serial_number")} placeholder="Serial number" disabled={disabled} />
        </div>
        <div className="space-y-2">
          <Label>Brand</Label>
          <Input {...register("brand")} placeholder="Brand name" disabled={disabled} />
        </div>
      </div>

      {/* Complaint - unlimited textarea */}
      <div className="space-y-2">
        <Label>Complaint / Issue Description</Label>
        <textarea
          {...register("issue_description")}
          placeholder="Describe the issue in detail..."
          disabled={disabled}
          rows={5}
          className="flex w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 resize-y min-h-[120px]"
        />
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setStep("fill"); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Service Ticket (CSO Entry)</DialogTitle>
        </DialogHeader>

        <StepIndicator />

        {/* STEP 1: FILL */}
        {step === "fill" && (
          <form onSubmit={handleSubmit(handleSendToReview)} className="space-y-6">
            <FormFields />
            <DialogFooter className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="gap-2">
                <Send className="w-4 h-4" /> Review with Customer
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* STEP 2: REVIEW */}
        {step === "review" && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center">
              <Send className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="font-medium text-blue-800 dark:text-blue-200">Show details to customer for review</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Verify all details are correct. Print a copy or save.</p>
            </div>

            <FormFields disabled />

            <DialogFooter className="border-t border-slate-200 dark:border-slate-700 pt-4 flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setStep("fill")} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Edit
              </Button>
              <Button type="button" variant="outline" onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" /> Print
              </Button>
              <Button type="button" onClick={handleConfirmAndSubmit} disabled={submitLoading} className="gap-2">
                {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {submitLoading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* STEP 3: DONE */}
        {step === "done" && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg font-semibold text-green-700 dark:text-green-300">Ticket Created Successfully</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">The service ticket is now in the workflow.</p>
            <div className="flex gap-3 justify-center mt-6">
              <Button variant="outline" onClick={handlePrint} className="gap-2">
                <Printer className="w-4 h-4" /> Print Copy
              </Button>
              <Button onClick={() => { onOpenChange(false); onVerifiedSubmit?.(); }} className="gap-2">
                <CheckCircle2 className="w-4 h-4" /> Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
