import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createHPStockItem, updateHPStockItem } from "@/api/hpStock";
import type { HPStockItem } from "@/api/hpStock";
import { toast } from "@/components/ui/use-toast";
import { extractApiError } from "@/api/client";
import { REGION_LABELS } from "@/types";
import type { Region } from "@/types";
import { useAuthStore } from "@/store/authStore";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: HPStockItem | null;
  onSuccess: () => void;
}

const DEFAULT_FORM = {
  case_id: "",
  work_order_id: "",
  delivery_no: "",
  service_event_no: "",
  material_order_no: "",
  hp_sales_order_no: "",
  gvrma_no: "",
  region: "",
  status: "PENDING",
  engineer_name: "",
  engineer_phone: "",
  part_description: "",
  customer_name: "",
  dc_cut_request_message: "",
};

export function HPStockFormDialog({ open, onOpenChange, editing, onSuccess }: Props) {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [goodPartFile, setGoodPartFile] = useState<File | null>(null);
  const [returnPartFile, setReturnPartFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin" || user?.role === "super_admin" || user?.role === "manager";

  useEffect(() => {
    if (open) {
      setGoodPartFile(null);
      setReturnPartFile(null);
      if (editing) {
        setFormData({
          case_id: editing.case_id || "",
          work_order_id: editing.work_order_id || "",
          delivery_no: editing.delivery_no || "",
          service_event_no: editing.service_event_no || "",
          material_order_no: editing.material_order_no || "",
          hp_sales_order_no: editing.hp_sales_order_no || "",
          gvrma_no: editing.gvrma_no || "",
          region: editing.region || "",
          status: editing.status || "PENDING",
          engineer_name: editing.engineer_name || "",
          engineer_phone: editing.engineer_phone || "",
          part_description: editing.part_description || "",
          customer_name: editing.customer_name || "",
          dc_cut_request_message: editing.dc_cut_request_message || "",
        });
      } else {
        setFormData({
          ...DEFAULT_FORM,
          region: !isAdmin && user?.region ? user.region : "",
        });
      }
    }
  }, [open, editing, isAdmin, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let payload: any;
      if (goodPartFile || returnPartFile) {
        const formDataPayload = new FormData();
        Object.entries(formData).forEach(([key, val]) => {
          formDataPayload.append(key, val);
        });
        if (goodPartFile) {
          formDataPayload.append("good_part_image", goodPartFile);
        }
        if (returnPartFile) {
          formDataPayload.append("return_part_image", returnPartFile);
        }
        payload = formDataPayload;
      } else {
        payload = formData;
      }

      if (editing) {
        await updateHPStockItem(editing.id, payload);
        toast({ title: "HP stock updated successfully" });
      } else {
        await createHPStockItem(payload);
        toast({ title: "HP stock created successfully" });
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit HP Stock" : "Add HP Stock"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Case ID</Label>
              <Input
                value={formData.case_id}
                onChange={(e) => setFormData({ ...formData, case_id: e.target.value })}
                placeholder="Enter Case ID"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Work Order ID</Label>
              <Input
                value={formData.work_order_id}
                onChange={(e) => setFormData({ ...formData, work_order_id: e.target.value })}
                placeholder="Enter Work Order ID"
              />
            </div>

            <div className="space-y-2">
              <Label>Customer Name</Label>
              <Input
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="Enter Customer Name"
              />
            </div>

            <div className="space-y-2">
              <Label>Part Description</Label>
              <Input
                value={formData.part_description}
                onChange={(e) => setFormData({ ...formData, part_description: e.target.value })}
                placeholder="Enter Part Description"
              />
            </div>

            <div className="space-y-2">
              <Label>Delivery No</Label>
              <Input
                value={formData.delivery_no}
                onChange={(e) => setFormData({ ...formData, delivery_no: e.target.value })}
                placeholder="Enter Delivery No"
              />
            </div>
            <div className="space-y-2">
              <Label>Service Event No</Label>
              <Input
                value={formData.service_event_no}
                onChange={(e) => setFormData({ ...formData, service_event_no: e.target.value })}
                placeholder="Enter Service Event No"
              />
            </div>

            <div className="space-y-2">
              <Label>Material Order No</Label>
              <Input
                value={formData.material_order_no}
                onChange={(e) => setFormData({ ...formData, material_order_no: e.target.value })}
                placeholder="Enter Material Order No"
              />
            </div>
            <div className="space-y-2">
              <Label>HP Sales Order No</Label>
              <Input
                value={formData.hp_sales_order_no}
                onChange={(e) => setFormData({ ...formData, hp_sales_order_no: e.target.value })}
                placeholder="Enter HP Sales Order No"
              />
            </div>

            <div className="space-y-2">
              <Label>GVRMA No</Label>
              <Input
                value={formData.gvrma_no}
                onChange={(e) => setFormData({ ...formData, gvrma_no: e.target.value })}
                placeholder="Enter GVRMA No"
              />
            </div>

            <div className="space-y-2">
              <Label>Good Part Photo</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setGoodPartFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {editing?.good_part_image && (
                <p className="text-xs text-slate-500 mt-1">
                  Current: <a href={editing.good_part_image} target="_blank" rel="noreferrer" className="text-indigo-600 underline hover:text-indigo-800">View current photo</a>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Return Part Photo</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setReturnPartFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {editing?.return_part_image && (
                <p className="text-xs text-slate-500 mt-1">
                  Current: <a href={editing.return_part_image} target="_blank" rel="noreferrer" className="text-indigo-600 underline hover:text-indigo-800">View current photo</a>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Region</Label>
              <Select
                value={formData.region}
                onValueChange={(val) => setFormData({ ...formData, region: val })}
                disabled={!isAdmin}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Region" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(REGION_LABELS) as [Region, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Stock Entry</SelectItem>
                  <SelectItem value="STOCK_CHECK">Stock Check</SelectItem>
                  <SelectItem value="GOOD_PART_PHOTO">Good Part Photo</SelectItem>
                  <SelectItem value="ISSUED">Part Taken by Engineer</SelectItem>
                  <SelectItem value="WORK_STATUS">Work Status</SelectItem>
                  <SelectItem value="UNUSED_RETURN">Unused Part</SelectItem>
                  <SelectItem value="DEFECTIVE_RETURN">Old/Defective Part</SelectItem>
                  <SelectItem value="HANDOVER">Part Handover by Engineer</SelectItem>
                  <SelectItem value="RETURN_PART_PHOTO">Return Part Photo</SelectItem>
                  <SelectItem value="DC_CUT_REQUEST">DC Cut Request</SelectItem>
                  <SelectItem value="CLOSED">Close the Case</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(formData.status === "DC_CUT_REQUEST" || formData.dc_cut_request_message) && (
            <div className="space-y-2 mt-4">
              <Label>DC Cut Request Message</Label>
              <Textarea
                value={formData.dc_cut_request_message}
                onChange={(e) => setFormData({ ...formData, dc_cut_request_message: e.target.value })}
                placeholder="Enter DC Cut Request Message"
                className="min-h-[80px]"
              />
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save HP Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
