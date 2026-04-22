import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { SERVICE_TYPE_LABELS } from "@/types";
import { updateTicket } from "@/api/tickets";
import { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import {
  Loader2,
  Save,
  User,
  Package,
  Wrench,
} from "lucide-react";
import type { Ticket } from "@/types";

type Tab = "customer" | "parts" | "engineer";

interface TicketEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket;
  onSaved: () => void;
}

export function TicketEditDialog({ open, onOpenChange, ticket, onSaved }: TicketEditDialogProps) {
  const [tab, setTab] = useState<Tab>("customer");
  const [saving, setSaving] = useState(false);

  const { register, getValues, setValue, watch } = useForm({
    defaultValues: {
      // Customer
      cust_name: ticket.cust_name || "",
      cust_contact: ticket.cust_contact || "",
      cust_email: ticket.cust_email || "",
      cust_address: ticket.cust_address || "",
      location: ticket.location || "",
      // Product
      product_name: ticket.product_name || "",
      serial_number: ticket.serial_number || "",
      model_number: ticket.model_number || "",
      brand: ticket.brand || "",
      work_order: ticket.work_order || "",
      case_id: ticket.case_id || "",
      condition_received: ticket.condition_received || "",
      service_type: ticket.service_type || "warranty",
      issue_description: ticket.issue_description || "",
      cso_date: ticket.cso_date || "",
      // Parts
      part_number: ticket.part_number || "",
      part_usage: ticket.part_usage || "",
      failure_code: ticket.failure_code || "",
      part_description: ticket.part_description || "",
      qty: ticket.qty || 0,
      ct_code: ticket.ct_code || "",
      so_req_id: ticket.so_req_id || "",
      removed_part_sno: ticket.removed_part_sno || "",
      installed_part_sno: ticket.installed_part_sno || "",
      // Engineer
      engineer_name: ticket.engineer_name || "",
      hp_id: ticket.hp_id || "",
      resolution_summary: ticket.resolution_summary || "",
      explanation: ticket.explanation || "",
      customer_comments: ticket.customer_comments || "",
    },
  });

  const serviceTypeValue = watch("service_type");

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTicket(ticket.id, getValues());
      toast({ title: "Ticket updated successfully" });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const textareaClass = "flex w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-[80px]";

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "customer", label: "Customer & Product", icon: User },
    { key: "parts", label: "Part Details", icon: Package },
    { key: "engineer", label: "Engineer & Resolution", icon: Wrench },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Ticket - {ticket.ticket_number}</DialogTitle>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 mb-4">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Customer & Product */}
        {tab === "customer" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input {...register("cust_name")} />
              </div>
              <div className="space-y-2">
                <Label>Contact Number</Label>
                <Input {...register("cust_contact")} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input {...register("cust_email")} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input {...register("location")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <textarea {...register("cust_address")} rows={2} className={textareaClass} style={{ minHeight: "60px" }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input {...register("product_name")} />
              </div>
              <div className="space-y-2">
                <Label>Serial Number</Label>
                <Input {...register("serial_number")} />
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input {...register("brand")} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Model Number</Label>
                <Input {...register("model_number")} />
              </div>
              <div className="space-y-2">
                <Label>Work Order</Label>
                <Input {...register("work_order")} />
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
                <Label>Condition Received</Label>
                <Input {...register("condition_received")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select value={serviceTypeValue} onValueChange={(val) => setValue("service_type", val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SERVICE_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Issue Description</Label>
              <textarea {...register("issue_description")} rows={3} className={textareaClass} />
            </div>
          </div>
        )}

        {/* Part Details */}
        {tab === "parts" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Part Number</Label>
                <Input {...register("part_number")} />
              </div>
              <div className="space-y-2">
                <Label>Part Usage</Label>
                <Input {...register("part_usage")} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Failure Code</Label>
                <Input {...register("failure_code")} />
              </div>
              <div className="space-y-2">
                <Label>Part Description</Label>
                <Input {...register("part_description")} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" {...register("qty")} />
              </div>
              <div className="space-y-2">
                <Label>CT Code</Label>
                <Input {...register("ct_code")} />
              </div>
              <div className="space-y-2">
                <Label>SO No. / Req ID</Label>
                <Input {...register("so_req_id")} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Removed Part S.No.</Label>
                <Input {...register("removed_part_sno")} />
              </div>
              <div className="space-y-2">
                <Label>Installed Part S.No.</Label>
                <Input {...register("installed_part_sno")} />
              </div>
            </div>
          </div>
        )}

        {/* Engineer & Resolution */}
        {tab === "engineer" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Engineer Name</Label>
                <Input {...register("engineer_name")} />
              </div>
              <div className="space-y-2">
                <Label>HP ID</Label>
                <Input {...register("hp_id")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Resolution Summary</Label>
              <textarea {...register("resolution_summary")} rows={3} className={textareaClass} />
            </div>
            <div className="space-y-2">
              <Label>Explanation</Label>
              <textarea {...register("explanation")} rows={3} className={textareaClass} />
            </div>
            <div className="space-y-2">
              <Label>Customer Comments</Label>
              <textarea {...register("customer_comments")} rows={3} className={textareaClass} />
            </div>
          </div>
        )}

        <DialogFooter className="border-t border-slate-200 dark:border-slate-700 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
