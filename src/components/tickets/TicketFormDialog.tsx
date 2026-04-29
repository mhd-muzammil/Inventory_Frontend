import { useEffect, useState } from "react";
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
  ArrowRight,
  Loader2,
  Printer,
  Save,
  User,
  Package,
  Wrench,
} from "lucide-react";

type Step = "customer" | "parts" | "engineer" | "review" | "done";
const STEPS: Step[] = ["customer", "parts", "engineer", "review", "done"];
const STEP_LABELS: Record<Step, string> = {
  customer: "Customer & Product",
  parts: "Part Details",
  engineer: "Engineer & Resolution",
  review: "Review",
  done: "Done",
};
const STEP_ICONS: Record<Step, React.ElementType> = {
  customer: User,
  parts: Package,
  engineer: Wrench,
  review: Send,
  done: CheckCircle2,
};

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

  const [step, setStep] = useState<Step>("customer");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState<TicketFormData | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    trigger,
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
      part_number: "",
      part_usage: "",
      failure_code: "",
      part_description: "",
      qty: 0,
      ct_code: "",
      so_req_id: "",
      removed_part_sno: "",
      installed_part_sno: "",
      engineer_name: "",
      hp_id: "",
      resolution_summary: "",
      explanation: "",
      customer_comments: "",
    },
  });

  const serviceTypeValue = watch("service_type");
  const regionValue = watch("region");

  useEffect(() => {
    if (open) {
      setStep("customer");
      setSubmittedData(null);
      reset();
    }
  }, [open, reset]);

  const handleNext = async () => {
    if (step === "customer") {
      const valid = await trigger(["cust_name", "cust_email"]);
      if (!valid) return;
      setStep("parts");
    } else if (step === "parts") {
      setStep("engineer");
    } else if (step === "engineer") {
      setSubmittedData(getValues());
      setStep("review");
    }
  };

  const handleBack = () => {
    if (step === "parts") setStep("customer");
    else if (step === "engineer") setStep("parts");
    else if (step === "review") setStep("engineer");
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
    const region = (data.region || user?.region || "salem") as string;

    const regionPrefixes: Record<string, string> = { vellore: "RT-VLR", salem: "RT-SAL", chennai: "RT-CHN", kanchipuram: "RT-KPM", hosur: "RT-HSR" };
    const regionAddresses: Record<string, { lines: string; phone: string; cell: string; gst: string }> = {
      salem: { lines: "22/26, LIC Colony, Hotel Vasantham Road, OPP. New Bus Stand, SALEM - 636004", phone: "+91 427-4057671", cell: "+91 8122633004", gst: "33AALCR1788A1ZG" },
      vellore: { lines: "No.1, Gandhi Nagar, 2nd Street, Vellore - 632001", phone: "+91 416-2243456", cell: "+91 8122633004", gst: "33AALCR1788A1ZG" },
      chennai: { lines: "No.5, Anna Salai, Chennai - 600002", phone: "+91 44-28523456", cell: "+91 8122633004", gst: "33AALCR1788A1ZG" },
      kanchipuram: { lines: "No.10, Gandhi Road, Kanchipuram - 631501", phone: "+91 44-27223456", cell: "+91 8122633004", gst: "33AALCR1788A1ZG" },
      hosur: { lines: "No.3, Industrial Area, Hosur - 635109", phone: "+91 4344-223456", cell: "+91 8122633004", gst: "33AALCR1788A1ZG" },
    };
    const addr = regionAddresses[region] || regionAddresses.salem;
    const prefix = regionPrefixes[region] || "RT";
    const serviceTypes = ["warranty", "non_warranty", "doa", "amc", "rental", "trade"];
    const serviceLabels = ["Warranty", "Non Warranty", "DOA", "AMC", "Rental", "Trade"];
    const checkboxes = serviceTypes.map((k, i) => `<label><span class="checkbox ${data.service_type === k ? 'checked' : ''}"></span>${serviceLabels[i]}&nbsp;&nbsp;</label>`).join("");

    const printWindow = window.open("", "_blank", "width=800,height=1100");
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html><html><head><title>CSO - ${data.work_order || "New"}</title>
      <style>
        @page{size:A4;margin:10mm}
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#000;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
        table{border-collapse:collapse;width:100%}
        td,th{border:1px solid #000;padding:4px 6px;font-size:11px;vertical-align:top}
        th{font-weight:bold;background-color:#f3f4f6!important}
        .container{width:100%;max-width:190mm;margin:0 auto;border:2px solid #000}
        .header{text-align:center;padding:8px 12px;border-bottom:2px solid #000;position:relative}
        .header-gst{position:absolute;left:12px;top:8px;font-size:10px;font-weight:bold}
        .header-cso{position:absolute;right:12px;top:8px;font-size:10px;font-weight:bold}
        .header-badge{display:inline-block;background:#1e40af;color:white;padding:2px 12px;font-size:11px;font-weight:bold;border-radius:2px;margin-bottom:4px}
        .company-name{font-size:16px;font-weight:900;color:#dc2626;letter-spacing:1px;margin:2px 0}
        .company-address{font-size:9px;font-weight:bold;color:#1e3a5f}
        .section-label{font-weight:bold;font-size:11px;background-color:#f3f4f6!important;padding:4px 6px;border:1px solid #000}
        .checkbox{display:inline-block;width:12px;height:12px;border:1.5px solid #000;margin-right:3px;vertical-align:middle;position:relative}
        .checkbox.checked::after{content:"\\2713";position:absolute;top:-3px;left:1px;font-size:12px;font-weight:bold;color:#1e40af}
        .service-type-row{padding:6px 12px;border-bottom:1px solid #000;font-size:11px}
        .description-box{min-height:50px;padding:6px;border:1px solid #000;font-size:11px;white-space:pre-wrap}
        .sig-section{display:flex;justify-content:space-between;padding:8px 12px;min-height:60px;border-top:1px solid #000}
        .sig-box{width:45%}
        .sig-label{font-size:10px;font-weight:bold;border-top:1px solid #000;padding-top:4px;margin-top:30px}
        .footer-stripe{height:14px;background:repeating-linear-gradient(-45deg,#dc2626,#dc2626 8px,#fff 8px,#fff 16px)!important;border-top:1px solid #000}
        .footer-note{font-size:8px;padding:4px 8px;border-top:1px solid #000;color:#333}
        .footer-web{font-size:9px;padding:3px 8px;font-weight:bold;border-top:1px solid #000}
      </style></head><body>
      <div class="container">
        <div class="header">
          <div class="header-gst">GST # ${addr.gst}</div>
          <div class="header-cso">CSO No. : ${prefix}</div>
          <span class="header-badge">HP Care</span>
          <div class="company-name">RENDERWAYS TECHNOLOGY PVT LTD</div>
          <div class="company-address">${addr.lines}<br>Ph: ${addr.phone}, Cell: ${addr.cell}</div>
        </div>
        <table>
          <tr><th>Customer Name</th><td>${data.cust_name || ''}</td><th>Service Type</th><td>${sType}</td></tr>
          <tr><th>Contact Number</th><td>${data.cust_contact || ''}</td><th>Product Name</th><td>${data.product_name || ''}</td></tr>
          <tr><th rowspan="6">Customer Address</th><td rowspan="6">${data.cust_address || ''}</td><th>Serial Number</th><td>${data.serial_number || ''}</td></tr>
          <tr><th>Case ID</th><td>${data.case_id || ''}</td></tr>
          <tr><th>CSO Date</th><td>${data.cso_date || new Date().toLocaleDateString("en-IN")}</td></tr>
          <tr><th>Condition Received</th><td>${data.condition_received || ''}</td></tr>
          <tr><th>Arrival Date</th><td>${data.arrival_date || new Date().toLocaleDateString("en-IN")}</td></tr>
          <tr><th>Delivery Date</th><td>${data.target_completion || ''}</td></tr>
        </table>
        <div class="service-type-row"><strong>Service Type : </strong>${checkboxes}</div>
        <div class="section-label">Issue Description:</div>
        <div class="description-box">${data.issue_description || ''}</div>
        <table>
          <tr><th>Part Details<br><span style="font-weight:normal;font-size:9px">Product/Part No.</span></th><th>Part Usage</th><th>Failure Code</th><th>Part Description</th><th>Qty</th><th>CT Code</th><th>So. No./<br>Req ID</th><th>Removed Part S.No.</th><th>Installed Part S.No.</th></tr>
          <tr><td>${data.part_number || '&nbsp;'}</td><td>${data.part_usage || '&nbsp;'}</td><td>${data.failure_code || '&nbsp;'}</td><td>${data.part_description || '&nbsp;'}</td><td>${data.qty || '&nbsp;'}</td><td>${data.ct_code || '&nbsp;'}</td><td>${data.so_req_id || '&nbsp;'}</td><td>${data.removed_part_sno || '&nbsp;'}</td><td>${data.installed_part_sno || '&nbsp;'}</td></tr>
        </table>
        <div class="section-label">Resolution Summary :</div>
        <div class="description-box" style="min-height:35px">${data.resolution_summary || ''}</div>
        <table>
          <tr><th style="text-align:center">Engineer Details</th><th style="text-align:center">Call Status</th><th style="text-align:center">Explanation</th></tr>
          <tr><td><div><strong>Engineer</strong></div><div>Name : ${data.engineer_name || ''}</div><div>HP ID : ${data.hp_id || ''}</div></td><td><div><span class="checkbox checked"></span> Pending</div><div><span class="checkbox"></span> Closed</div><div><span class="checkbox"></span> Taken for Service</div></td><td>${data.explanation || '&nbsp;'}</td></tr>
        </table>
        <div class="section-label">Customer Comments :</div>
        <div class="description-box" style="min-height:35px">${data.customer_comments || ''}</div>
        <div class="sig-section">
          <div class="sig-box"><div class="sig-label">Customer Signature<br><span style="font-weight:normal;font-size:9px">Received in Good Condition</span></div></div>
          <div class="sig-box" style="text-align:right"><div class="sig-label">Engineer Signature</div></div>
        </div>
        <div class="footer-note">Note : Hard Disk related issue and replacement may lead to loss of data. It is advisable for the customer to Backup the files &amp; Applications prior to repair Activity. Physical Damage not &amp; under Cover Warranty.</div>
        <div class="footer-stripe"></div>
        <div class="footer-web">Web Support : https://support.hp.com/in-en/</div>
      </div>
      <script>window.onload=function(){window.print();window.onafterprint=function(){window.close()}}</script>
    </body></html>`);
    printWindow.document.close();
  };

  /* ── Step indicator ─────────────────────────────────── */
  const StepIndicator = () => {
    const fillSteps: Step[] = ["customer", "parts", "engineer", "review", "done"];
    const currentIdx = fillSteps.indexOf(step);
    return (
      <div className="flex items-center justify-center gap-1 mb-4 flex-wrap">
        {fillSteps.map((s, i) => {
          const isActive = s === step;
          const isPast = currentIdx > i;
          const Icon = STEP_ICONS[s];
          return (
            <div key={s} className="flex items-center gap-1">
              {i > 0 && <div className={`h-px w-5 sm:w-8 ${isPast ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600"}`} />}
              <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2 py-1 rounded-full ${
                isActive ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                : isPast ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
              }`}>
                {isPast ? <CheckCircle2 className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ── Shared textarea style ──────────────────────────── */
  const textareaClass = "flex w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 resize-y min-h-[80px]";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setStep("customer"); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Service Ticket (CSO Entry)</DialogTitle>
        </DialogHeader>

        <StepIndicator />

        {/* ══════════ STEP 1: CUSTOMER & PRODUCT ══════════ */}
        {step === "customer" && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <User className="w-4 h-4 text-indigo-500" /> Customer & Product Details
            </div>

            <div className={`grid grid-cols-1 gap-4 ${isAdmin ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}>
              <div className="space-y-2">
                <Label>Work Order</Label>
                <Input {...register("work_order")} placeholder="WO number" />
              </div>
              <div className="space-y-2">
                <Label>Case ID</Label>
                <Input {...register("case_id")} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label>CSO Date</Label>
                <Input type="date" {...register("cso_date")} />
              </div>
              <div className="space-y-2">
                <Label>Warranty Status *</Label>
                <Select value={serviceTypeValue} onValueChange={(val) => setValue("service_type", val as TicketFormData["service_type"])}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SERVICE_TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isAdmin && (
                <div className="space-y-2">
                  <Label>Region *</Label>
                  <Select value={regionValue || ""} onValueChange={(val) => setValue("region", val as Region)}>
                    <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(REGION_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input {...register("cust_name")} placeholder="Full name" />
                {errors.cust_name && <p className="text-xs text-red-500">{errors.cust_name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Contact Number</Label>
                <Input {...register("cust_contact")} placeholder="Phone number" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input {...register("cust_email")} placeholder="customer@email.com" />
                {errors.cust_email && <p className="text-xs text-red-500">{errors.cust_email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input {...register("location")} placeholder="City / area" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Customer Address</Label>
              <textarea {...register("cust_address")} placeholder="Full address" rows={2} className={textareaClass} style={{ minHeight: "60px" }} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input {...register("product_name")} placeholder="e.g. HP Laptop" />
              </div>
              <div className="space-y-2">
                <Label>Serial Number</Label>
                <Input {...register("serial_number")} placeholder="Serial number" />
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input {...register("brand")} placeholder="Brand" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Model Number</Label>
                <Input {...register("model_number")} placeholder="Model" />
              </div>
              <div className="space-y-2">
                <Label>Condition Received</Label>
                <Input {...register("condition_received")} placeholder="e.g. Good, Damaged" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Complaint / Issue Description</Label>
              <textarea {...register("issue_description")} placeholder="Describe the issue..." rows={4} className={textareaClass} />
            </div>

            <DialogFooter className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="button" onClick={handleNext} className="gap-2">
                Next: Part Details <ArrowRight className="w-4 h-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ══════════ STEP 2: PART DETAILS ══════════ */}
        {step === "parts" && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Package className="w-4 h-4 text-indigo-500" /> Part Details
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">Fill in if parts are involved. Skip if not applicable.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Part Number / Product Part No.</Label>
                <Input {...register("part_number")} placeholder="Part number" />
              </div>
              <div className="space-y-2">
                <Label>Part Usage</Label>
                <Input {...register("part_usage")} placeholder="Part usage" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Failure Code</Label>
                <Input {...register("failure_code")} placeholder="Failure code" />
              </div>
              <div className="space-y-2">
                <Label>Part Description</Label>
                <Input {...register("part_description")} placeholder="Description" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" {...register("qty")} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>CT Code</Label>
                <Input {...register("ct_code")} placeholder="CT code" />
              </div>
              <div className="space-y-2">
                <Label>SO No. / Req ID</Label>
                <Input {...register("so_req_id")} placeholder="SO / Req ID" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Removed Part S.No.</Label>
                <Input {...register("removed_part_sno")} placeholder="Removed serial" />
              </div>
              <div className="space-y-2">
                <Label>Installed Part S.No.</Label>
                <Input {...register("installed_part_sno")} placeholder="Installed serial" />
              </div>
            </div>

            <DialogFooter className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <Button type="button" variant="outline" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button type="button" onClick={handleNext} className="gap-2">
                Next: Engineer <ArrowRight className="w-4 h-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ══════════ STEP 3: ENGINEER & RESOLUTION ══════════ */}
        {step === "engineer" && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Wrench className="w-4 h-4 text-indigo-500" /> Engineer & Resolution
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">Fill in engineer details and resolution. Skip if not applicable.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Engineer Name</Label>
                <Input {...register("engineer_name")} placeholder="Engineer name" />
              </div>
              <div className="space-y-2">
                <Label>HP ID</Label>
                <Input {...register("hp_id")} placeholder="HP ID" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Resolution Summary</Label>
              <textarea {...register("resolution_summary")} placeholder="Summary of the resolution..." rows={3} className={textareaClass} />
            </div>

            <div className="space-y-2">
              <Label>Explanation</Label>
              <textarea {...register("explanation")} placeholder="Detailed explanation..." rows={3} className={textareaClass} />
            </div>

            <div className="space-y-2">
              <Label>Customer Comments</Label>
              <textarea {...register("customer_comments")} placeholder="Customer feedback..." rows={3} className={textareaClass} />
            </div>

            <DialogFooter className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <Button type="button" variant="outline" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button type="button" onClick={handleNext} className="gap-2">
                <Send className="w-4 h-4" /> Review with Customer
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ══════════ STEP 4: REVIEW ══════════ */}
        {step === "review" && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-center">
              <Send className="w-6 h-6 text-blue-500 mx-auto mb-1" />
              <p className="font-medium text-blue-800 dark:text-blue-200 text-sm">Show details to customer for review</p>
            </div>

            {/* Review summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <p className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2"><User className="w-4 h-4 text-indigo-500" /> Customer</p>
                <ReviewField label="Name" value={getValues("cust_name")} />
                <ReviewField label="Contact" value={getValues("cust_contact")} />
                <ReviewField label="Email" value={getValues("cust_email")} />
                <ReviewField label="Address" value={getValues("cust_address")} />
                <ReviewField label="Location" value={getValues("location")} />
              </div>
              <div className="space-y-3 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <p className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2"><Package className="w-4 h-4 text-indigo-500" /> Product</p>
                <ReviewField label="Product" value={getValues("product_name")} />
                <ReviewField label="Serial No." value={getValues("serial_number")} />
                <ReviewField label="Brand" value={getValues("brand")} />
                <ReviewField label="Model" value={getValues("model_number")} />
                <ReviewField label="Service" value={SERVICE_TYPE_LABELS[serviceTypeValue as keyof typeof SERVICE_TYPE_LABELS] || serviceTypeValue} />
                <ReviewField label="Condition" value={getValues("condition_received")} />
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm space-y-2">
              <p className="font-semibold text-slate-700 dark:text-slate-200">Issue Description</p>
              <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{getValues("issue_description") || "-"}</p>
            </div>

            {(getValues("part_number") || getValues("engineer_name") || getValues("resolution_summary")) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {getValues("part_number") && (
                  <div className="space-y-3 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    <p className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2"><Package className="w-4 h-4 text-indigo-500" /> Part Details</p>
                    <ReviewField label="Part No." value={getValues("part_number")} />
                    <ReviewField label="Description" value={getValues("part_description")} />
                    <ReviewField label="Qty" value={String(getValues("qty") || "")} />
                    <ReviewField label="Failure Code" value={getValues("failure_code")} />
                  </div>
                )}
                {(getValues("engineer_name") || getValues("resolution_summary")) && (
                  <div className="space-y-3 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    <p className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2"><Wrench className="w-4 h-4 text-indigo-500" /> Engineer</p>
                    <ReviewField label="Name" value={getValues("engineer_name")} />
                    <ReviewField label="HP ID" value={getValues("hp_id")} />
                    <ReviewField label="Resolution" value={getValues("resolution_summary")} />
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="border-t border-slate-200 dark:border-slate-700 pt-4 flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={handleBack} className="gap-2">
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

        {/* ══════════ STEP 5: DONE ══════════ */}
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

/* ── Review helper ────────────────────────────────────── */
function ReviewField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <p className="text-slate-800 dark:text-slate-100 text-sm">{value || <span className="text-slate-400 italic">-</span>}</p>
    </div>
  );
}
