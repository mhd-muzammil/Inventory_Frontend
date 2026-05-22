import { useEffect, useState } from "react";
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
  UploadCloud,
  FileText,
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
  const [partRequestFiles, setPartRequestFiles] = useState<File[]>([]);
  const [deletedPartRequestImageIds, setDeletedPartRequestImageIds] = useState<number[]>([]);

  useEffect(() => {
    if (open) {
      setPartRequestFiles([]);
      setDeletedPartRequestImageIds([]);
    }
  }, [open]);

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
      cso_image: undefined as File | string | null | undefined,
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
      part_request_image: undefined as File | string | null | undefined,
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
      const formValues = getValues();
      const payload = {
        ...formValues,
        part_request_images: partRequestFiles,
        delete_part_request_images: deletedPartRequestImageIds,
      };
      await updateTicket(ticket.id, payload);
      toast({ title: "Ticket updated successfully" });
      setPartRequestFiles([]);
      setDeletedPartRequestImageIds([]);
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
            
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">CSO Entry Image / Scan (Optional)</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setValue("cso_image", file);
                    }
                  }}
                  className="cursor-pointer bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 file:hover:bg-indigo-100 dark:file:bg-indigo-950/40 dark:file:text-indigo-300"
                />
                {(watch("cso_image") || ticket.cso_image) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setValue("cso_image", null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Clear
                  </Button>
                )}
              </div>
              {watch("cso_image") && watch("cso_image") instanceof File && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  New file selected: {(watch("cso_image") as File).name}
                </p>
              )}
              {ticket.cso_image && !watch("cso_image") && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  Current file: <a href={ticket.cso_image} target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-800">View current scan</a>
                </p>
              )}
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
            
            <div className="space-y-4 mt-4">
              <Label className="text-slate-700 dark:text-slate-300 font-semibold">
                Part Request Images / Scans
              </Label>
              
              {/* Existing Uploaded Scans */}
              {((ticket.part_request_images && ticket.part_request_images.length > 0) || ticket.part_request_image) && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Existing Scans:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Legacy Single Scan */}
                    {ticket.part_request_image && watch("part_request_image") !== null && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                          <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                          <a
                            href={ticket.part_request_image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate hover:underline"
                          >
                            Legacy Scan
                          </a>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setValue("part_request_image", null);
                            toast({ title: "Legacy scan marked for removal" });
                          }}
                          className="h-7 w-7 p-0 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-500 text-slate-400"
                        >
                          ✕
                        </Button>
                      </div>
                    )}

                    {/* Multiple DB Scans */}
                    {(ticket.part_request_images || [])
                      .filter((img) => !deletedPartRequestImageIds.includes(img.id))
                      .map((img) => {
                        const filename = img.image.split("/").pop() || `Scan #${img.id}`;
                        return (
                          <div
                            key={img.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex items-center gap-2 overflow-hidden mr-2">
                              <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                              <a
                                href={img.image}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate hover:underline"
                              >
                                {filename}
                              </a>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeletedPartRequestImageIds((prev) => [...prev, img.id]);
                                toast({ title: "Scan marked for deletion" });
                              }}
                              className="h-7 w-7 p-0 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-500 text-slate-400"
                            >
                              ✕
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                  
                  {(watch("part_request_image") === null || deletedPartRequestImageIds.length > 0) && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                      Note: Changes to existing scans will be applied upon saving.
                    </p>
                  )}
                </div>
              )}

              {/* Multiple Upload Drag & Drop Picker */}
              <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-colors group cursor-pointer">
                <input
                  id="part_request_images_edit"
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      setPartRequestFiles((prev) => [...prev, ...files]);
                    }
                    e.target.value = "";
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors mb-2" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Click or drag to add new part scans
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Supports Images & PDFs (Upload as many as needed)
                </span>
              </div>

              {/* Newly Selected Files */}
              {partRequestFiles.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    New Scans to Upload:
                  </span>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {partRequestFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30"
                      >
                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                          <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span className="text-xs text-indigo-900 dark:text-indigo-300 font-medium truncate">
                            {file.name}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPartRequestFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="h-7 w-7 p-0 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-500 text-slate-400"
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
