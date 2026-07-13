import { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Edit, Trash2, ArrowRight, ChevronDown, CheckCircle, Clock, Package, ClipboardCheck, User, ShieldCheck, Activity, RotateCcw, Eye, Camera, FileText, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DCCutChatDialog } from "./DCCutChatDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { transitionHPStockItem, sendHPStockOTP } from "@/api/hpStock";
import { getEngineersForAssignment } from "@/api/engineers";
import type { Engineer } from "@/types";
import { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/authStore";
import type { HPStockItem } from "@/api/hpStock";
import type { PaginationMeta, Region } from "@/types";
import { REGION_LABELS } from "@/types";
import { getPartValueBand } from "@/lib/partValue";

type WorkflowStatus = HPStockItem["status"];

const AVAILABLE_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["STOCK_CHECK"],
  STOCK_CHECK: ["GOOD_PART_PHOTO"],
  GOOD_PART_PHOTO: ["ISSUED"],
  ISSUED: ["WORK_STATUS"],
  WORK_STATUS: ["UNUSED_RETURN", "DEFECTIVE_RETURN", "DOA"],
  UNUSED_RETURN: ["HANDOVER"],
  DEFECTIVE_RETURN: ["HANDOVER"],
  DOA: ["HANDOVER"],
  HANDOVER: ["RETURN_PART_PHOTO"],
  RETURN_PART_PHOTO: ["DC_CUT_REQUEST"],
  DC_CUT_REQUEST: ["CLOSED"],
};

const TRANSITION_LABELS: Record<string, string> = {
  STOCK_CHECK: "Perform Stock Check",
  GOOD_PART_PHOTO: "Good Part Photo",
  ISSUED: "Part Taken by Engineer",
  WORK_STATUS: "Verify Work Status",
  UNUSED_RETURN: "Mark as Unused Part",
  DEFECTIVE_RETURN: "Mark as Old/Defective Part",
  DOA: "Death on Arrival",
  HANDOVER: "Record Engineer Handover",
  RETURN_PART_PHOTO: "Return Part Photo",
  DC_CUT_REQUEST: "DC Cut Request",
  CLOSED: "Close the Case",
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Stock Entry",
  STOCK_CHECK: "Stock Check",
  RECEIVED: "Stock Check",
  GOOD_PART_PHOTO: "Good Part Photo",
  ISSUED: "Part Taken by Engineer",
  WORK_STATUS: "Work Status",
  UNUSED_RETURN: "Unused Part",
  DEFECTIVE_RETURN: "Old/Defective Part",
  DOA: "Death on Arrival",
  HANDOVER: "Part Handover by Engineer",
  RETURN_PART_PHOTO: "Return Part Photo",
  DC_CUT_REQUEST: "DC Cut Request",
  CLOSED: "Close the Case",
};

export const STATUS_STYLE_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-600" },
  STOCK_CHECK: { bg: "bg-yellow-50 dark:bg-yellow-900/20", text: "text-yellow-700 dark:text-yellow-400", dot: "bg-yellow-500" },
  RECEIVED: { bg: "bg-yellow-50 dark:bg-yellow-900/20", text: "text-yellow-700 dark:text-yellow-400", dot: "bg-yellow-500" },
  GOOD_PART_PHOTO: { bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-700 dark:text-indigo-400", dot: "bg-indigo-600" },
  ISSUED: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-400", dot: "bg-purple-600" },
  WORK_STATUS: { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-orange-700 dark:text-orange-400", dot: "bg-orange-600" },
  UNUSED_RETURN: { bg: "bg-teal-50 dark:bg-teal-900/20", text: "text-teal-700 dark:text-teal-400", dot: "bg-teal-600" },
  DEFECTIVE_RETURN: { bg: "bg-rose-50 dark:bg-rose-900/20", text: "text-rose-700 dark:text-rose-400", dot: "bg-rose-600" },
  DOA: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-400", dot: "bg-red-600" },
  HANDOVER: { bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-700 dark:text-indigo-400", dot: "bg-indigo-600" },
  RETURN_PART_PHOTO: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-600" },
  DC_CUT_REQUEST: { bg: "bg-cyan-50 dark:bg-cyan-900/20", text: "text-cyan-700 dark:text-cyan-400", dot: "bg-cyan-600" },
  CLOSED: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-600" },
};

const TRACK_STEPS = ["PENDING", "STOCK_CHECK", "GOOD_PART_PHOTO", "ISSUED", "WORK_STATUS", "UNUSED_RETURN", "DEFECTIVE_RETURN", "DOA", "HANDOVER", "RETURN_PART_PHOTO", "DC_CUT_REQUEST", "CLOSED"];

export const getStatusIcon = (status: string) => {
  switch (status) {
    case "PENDING":
      return <Package className="w-3.5 h-3.5" />;
    case "STOCK_CHECK":
    case "RECEIVED":
      return <ClipboardCheck className="w-3.5 h-3.5" />;
    case "GOOD_PART_PHOTO":
      return <Camera className="w-3.5 h-3.5" />;
    case "ISSUED":
      return <User className="w-3.5 h-3.5" />;
    case "WORK_STATUS":
      return <Activity className="w-3.5 h-3.5" />;
    case "UNUSED_RETURN":
    case "DEFECTIVE_RETURN":
      return <RotateCcw className="w-3.5 h-3.5" />;
    case "DOA":
      return <Activity className="w-3.5 h-3.5" />;
    case "HANDOVER":
      return <User className="w-3.5 h-3.5" />;
    case "RETURN_PART_PHOTO":
      return <Camera className="w-3.5 h-3.5" />;
    case "DC_CUT_REQUEST":
      return <FileText className="w-3.5 h-3.5" />;
    case "CLOSED":
      return <ShieldCheck className="w-3.5 h-3.5" />;
    default:
      return <Clock className="w-3.5 h-3.5" />;
  }
};

const getTransitionNote = (status: string) => {
  switch (status) {
    case "STOCK_CHECK":
      return {
        title: "Verify Stock Availability",
        message: "Check the stock room to ensure the physical part matches the case specifications before updating the status.",
        icon: <ClipboardCheck className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
        bg: "bg-yellow-50/80 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/60",
        text: "text-yellow-800 dark:text-yellow-300",
      };
    case "GOOD_PART_PHOTO":
      return {
        title: "Good Part Photo Verification",
        message: "Confirm that a clear photo of the good part is taken and stored/verified properly.",
        icon: <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
        bg: "bg-indigo-50/80 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/60",
        text: "text-indigo-800 dark:text-indigo-300",
      };
    case "ISSUED":
      return {
        title: "Engineer Part Issue Verification",
        message: "Verify the engineer's identity. A 6-digit WhatsApp OTP is required to officially assign this part to the engineer.",
        icon: <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
        bg: "bg-purple-50/80 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/60",
        text: "text-purple-800 dark:text-purple-300",
      };
    case "WORK_STATUS":
      return {
        title: "Verify Work Execution",
        message: "Confirm the current field progress with the engineer. Ensure the physical installation or service has commenced.",
        icon: <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
        bg: "bg-orange-50/80 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/60",
        text: "text-orange-800 dark:text-orange-300",
      };
    case "UNUSED_RETURN":
      return {
        title: "Reconcile Unused Part",
        message: "Confirm the unused part has been returned in original, salable packaging and successfully added back to inventory.",
        icon: <RotateCcw className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
        bg: "bg-teal-50/80 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800/60",
        text: "text-teal-800 dark:text-teal-300",
      };
    case "DEFECTIVE_RETURN":
      return {
        title: "Reconcile Defective Part",
        message: "Confirm receipt of the customer's defective/old part. Match the serial numbers to prepare for HP RMA dispatch.",
        icon: <RotateCcw className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
        bg: "bg-rose-50/80 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60",
        text: "text-rose-800 dark:text-rose-300",
      };
    case "DOA":
      return {
        title: "Death on Arrival",
        message: "The part was found dead/non-functional on arrival. Document the issue and prepare for RMA or replacement processing.",
        icon: <Activity className="w-5 h-5 text-red-600 dark:text-red-400" />,
        bg: "bg-red-50/80 dark:bg-red-950/20 border-red-200 dark:border-red-800/60",
        text: "text-red-800 dark:text-red-300",
      };
    case "HANDOVER":
      return {
        title: "Engineer Handover Verification",
        message: "Record the formal return handover from the engineer. WhatsApp OTP verification is mandatory for security tracking.",
        icon: <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
        bg: "bg-indigo-50/80 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/60",
        text: "text-indigo-800 dark:text-indigo-300",
      };
    case "RETURN_PART_PHOTO":
      return {
        title: "Return Part Photo Verification",
        message: "Please upload a clear photo of the returned (defective/old or unused) part to continue.",
        icon: <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
        bg: "bg-indigo-50/80 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/60",
        text: "text-indigo-800 dark:text-indigo-300",
      };
    case "DC_CUT_REQUEST":
      return {
        title: "DC Cut Request",
        message: "Request a DC cut for this HP stock item. Ensure all logs and details are completed before raising the request.",
        icon: <FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
        bg: "bg-cyan-50/80 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800/60",
        text: "text-cyan-800 dark:text-cyan-300",
      };
    case "CLOSED":
      return {
        title: "Final Case Closure",
        message: "Make sure all paperwork, OTP validations, and part logistics are 100% reconciled before closing the case forever.",
        icon: <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        bg: "bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60",
        text: "text-emerald-800 dark:text-emerald-300",
      };
    default:
      return null;
  }
};

// Return part photo categories (all optional). Keys must match backend model fields.
const RETURN_PHOTO_FIELDS: { key: keyof HPStockItem; label: string }[] = [
  { key: "return_part_ct_image", label: "Part CT Image" },
  { key: "return_box_front_image", label: "Box with Part Front Image" },
  { key: "return_box_back_image", label: "Box with Part Back Image" },
  { key: "return_box_corner_right_image", label: "Box with Part Corner Right Side Image" },
  { key: "return_box_corner_left_image", label: "Box with Part Corner Left Side Image" },
  { key: "return_box_corner_top_image", label: "Box with Part Corner Top Side Image" },
  { key: "return_box_corner_bottom_image", label: "Box with Part Corner Bottom Side Image" },
  { key: "return_option_image_1", label: "Option Image 1" },
  { key: "return_option_image_2", label: "Option Image 2" },
  { key: "return_option_image_3", label: "Option Image 3" },
];

// Self-contained camera/upload picker for a single return-part photo category.
function ReturnPhotoPicker({
  label,
  file,
  onChange,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="space-y-2">
      <Label className="text-indigo-600 dark:text-indigo-400 font-medium text-xs uppercase tracking-wider">
        {label}
      </Label>
      <input
        type="file"
        accept="image/*"
        ref={fileRef}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraRef}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
      {preview ? (
        <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center gap-2">
          <img src={preview} alt={`${label} Preview`} className="max-h-[140px] rounded-lg shadow-sm object-contain" />
          <div className="flex items-center justify-between w-full text-xs text-slate-500">
            <span className="truncate max-w-[200px]">{file?.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
              className="text-red-500 hover:text-red-650 font-medium h-7 px-2"
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => cameraRef.current?.click()}
            className="h-16 flex flex-col items-center justify-center gap-1.5 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:border-indigo-400"
          >
            <Camera className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <span className="text-[11px] font-semibold">Take Live Photo</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            className="h-16 flex flex-col items-center justify-center gap-1.5 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:border-indigo-400"
          >
            <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <span className="text-[11px] font-semibold">Upload File</span>
          </Button>
        </div>
      )}
    </div>
  );
}

interface Props {
  data: HPStockItem[];
  loading: boolean;
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onEdit: (item: HPStockItem) => void;
  onDelete: (id: number) => void;
  onRowUpdated: (item: HPStockItem) => void;
  onViewHistory?: (item: HPStockItem) => void;
}

export function HPStockTable({ data, loading, pagination, onPageChange, onEdit, onDelete, onRowUpdated, onViewHistory }: Props) {
  const user = useAuthStore((s) => s.user);
  const isSubAdmin = user?.role === "sub_admin";
  // Price is super-admin-only (the API omits it for everyone else).
  const isSuperAdmin = user?.role === "super_admin";
  const [transitionOpen, setTransitionOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<HPStockItem | null>(null);
  const [pendingToStatus, setPendingToStatus] = useState<string | null>(null);
  const [engineerName, setEngineerName] = useState("");
  const [engineerPhone, setEngineerPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [remarks, setRemarks] = useState("");
  const [goodPartFile, setGoodPartFile] = useState<File | null>(null);
  const [returnFiles, setReturnFiles] = useState<Record<string, File | null>>({});
  const [dcCutRequestMessage, setDcCutRequestMessage] = useState("");
  const [savingTransition, setSavingTransition] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loadingEngineers, setLoadingEngineers] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeChatRow, setActiveChatRow] = useState<HPStockItem | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!goodPartFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(goodPartFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [goodPartFile]);

  const [goodPartBackFile, setGoodPartBackFile] = useState<File | null>(null);
  const [previewBackUrl, setPreviewBackUrl] = useState<string | null>(null);
  const fileInputBackRef = useRef<HTMLInputElement>(null);
  const cameraInputBackRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!goodPartBackFile) {
      setPreviewBackUrl(null);
      return;
    }
    const url = URL.createObjectURL(goodPartBackFile);
    setPreviewBackUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [goodPartBackFile]);

  const showEngineerField = pendingToStatus === "ISSUED" || pendingToStatus === "HANDOVER";

  const fetchEngineers = async (region?: string) => {
    setLoadingEngineers(true);
    try {
      const data = await getEngineersForAssignment(region);
      setEngineers(data.filter((e) => e.status === "active"));
    } catch {
      setEngineers([]);
    } finally {
      setLoadingEngineers(false);
    }
  };

  const canConfirm = useMemo(() => {
    if (!activeRow) return false;
    if (showEngineerField) {
      return (
        engineerName.trim().length > 0 &&
        engineerPhone.trim().length === 10 &&
        otp.trim().length === 6
      );
    }
    if (pendingToStatus === "GOOD_PART_PHOTO") {
      return goodPartFile !== null && goodPartBackFile !== null;
    }
    return true;
  }, [activeRow, engineerName, engineerPhone, otp, showEngineerField, pendingToStatus, goodPartFile, goodPartBackFile]);

  const openTransition = (row: HPStockItem, target: string) => {
    setActiveRow(row);
    setPendingToStatus(target);
    const isEngineerStep = target === "ISSUED" || target === "HANDOVER";
    setEngineerName(isEngineerStep ? (row.engineer_name || "") : "");
    setEngineerPhone(isEngineerStep ? (row.engineer_phone || "") : "");
    setRemarks("");
    setOtp("");
    setOtpSent(false);
    setGeneratedOtp("");
    setGoodPartFile(null);
    setGoodPartBackFile(null);
    setReturnFiles({});
    setDcCutRequestMessage(target === "DC_CUT_REQUEST" ? (row.dc_cut_request_message || "") : "");
    setTransitionOpen(true);
    if (target === "ISSUED" || target === "HANDOVER") {
      fetchEngineers(row.region || undefined);
    }
  };

  const openTrack = (row: HPStockItem) => {
    if (onViewHistory) {
      onViewHistory(row);
    } else {
      setActiveRow(row);
      setTrackOpen(true);
    }
  };

  const openDetail = (row: HPStockItem) => {
    setActiveRow(row);
    setDetailOpen(true);
  };

  const handleSendOTP = async () => {
    if (!activeRow || !engineerPhone || engineerPhone.trim().length !== 10) {
      toast({ title: "Please enter a valid 10-digit Indian phone number first", variant: "destructive" });
      return;
    }
    setSendingOtp(true);
    try {
      const res = await sendHPStockOTP(activeRow.id, {
        phone: engineerPhone.trim(),
        to_status: pendingToStatus || "",
      });
      setOtpSent(true);
      setGeneratedOtp(res.otp);

      // Open prefilled WhatsApp URL in new window
      if (res.whatsapp_url) {
        window.open(res.whatsapp_url, "_blank");
      }

      toast({ title: "OTP generated! Pre-filled WhatsApp tab opened to send the code." });
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleTransition = async () => {
    if (!activeRow || !canConfirm) return;
    setSavingTransition(true);
    try {
      let payload: any;
      const returnFileEntries = Object.entries(returnFiles).filter(([, f]) => f) as [string, File][];
      if (goodPartFile || goodPartBackFile || returnFileEntries.length > 0) {
        const formData = new FormData();
        formData.append("to_status", pendingToStatus || "");
        if (remarks.trim()) {
          formData.append("remarks", remarks.trim());
        }
        if (goodPartFile) {
          formData.append("good_part_image", goodPartFile);
        }
        if (goodPartBackFile) {
          formData.append("good_part_image_back", goodPartBackFile);
        }
        for (const [key, f] of returnFileEntries) {
          formData.append(key, f);
        }
        if (showEngineerField) {
          formData.append("engineer_name", engineerName.trim());
          formData.append("engineer_phone", engineerPhone.trim());
          formData.append("otp", otp.trim());
        }
        if (pendingToStatus === "DC_CUT_REQUEST") {
          formData.append("dc_cut_request_message", dcCutRequestMessage.trim());
        }
        payload = formData;
      } else {
        payload = {
          engineer_name: showEngineerField ? engineerName.trim() || undefined : undefined,
          engineer_phone: showEngineerField ? engineerPhone.trim() : undefined,
          otp: showEngineerField ? otp.trim() : undefined,
          remarks: remarks.trim() || undefined,
          to_status: pendingToStatus || undefined,
          dc_cut_request_message: pendingToStatus === "DC_CUT_REQUEST" ? dcCutRequestMessage.trim() : undefined,
        };
      }

      const updated = await transitionHPStockItem(activeRow.id, payload);
      onRowUpdated(updated);
      setTransitionOpen(false);
      toast({ title: "HP Stock status updated and verified successfully" });
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    } finally {
      setSavingTransition(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case ID / WO</TableHead>
              <TableHead>Opened Date</TableHead>
              <TableHead>Good Part Number</TableHead>
              <TableHead>Part Order Number</TableHead>
              <TableHead>Region & Engineer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                <TableHead className="font-semibold">Case ID / WO</TableHead>
                <TableHead className="font-semibold">Opened Date</TableHead>
                <TableHead className="font-semibold">Customer & Part</TableHead>
                <TableHead className="font-semibold">Good Part Number</TableHead>
                <TableHead className="font-semibold">Part Order Number</TableHead>
                <TableHead className="font-semibold">SO Number</TableHead>
                {isSuperAdmin && <TableHead className="font-semibold text-right">Price</TableHead>}
                {isSuperAdmin && <TableHead className="font-semibold text-center">Part Value</TableHead>}
                <TableHead className="font-semibold">Region & Engineer</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Next Action</TableHead>
                <TableHead className="text-center font-semibold">History</TableHead>
                <TableHead className="text-center font-semibold">Chat</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <TableCell>
                    <div className="font-medium text-slate-900 dark:text-slate-100">{item.case_id || "N/A"}</div>
                    <div className="text-xs text-slate-500">{item.work_order_id || "N/A"}</div>
                  </TableCell>
                  <TableCell>
                    {item.case_created_time ? (
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {format(new Date(item.case_created_time), "dd/MM/yyyy")}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {format(new Date(item.created_at), "dd/MM/yyyy")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.customer_name || "N/A"}</div>
                    <div className="text-xs text-slate-500 max-w-[220px] truncate" title={item.part_description || ""}>
                      {item.part_description || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-900 dark:text-slate-100">{item.good_part_number || "N/A"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-900 dark:text-slate-100">{item.part_order_number || "N/A"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-900 dark:text-slate-100">{item.so_number || "N/A"}</span>
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell className="text-right">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.price != null
                          ? `₹${Number(item.price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "N/A"}
                      </span>
                    </TableCell>
                  )}
                  {isSuperAdmin && (
                    <TableCell className="text-center">
                      {(() => {
                        const band = getPartValueBand(item.price);
                        if (!band) return <span className="text-slate-400">N/A</span>;
                        return (
                          <Badge className={`${band.className} hover:${band.className} font-semibold border-transparent whitespace-nowrap`}>
                            {band.label}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-fit">
                        {REGION_LABELS[item.region as Region] || item.region || "No Region"}
                      </span>
                      <span className="text-xs text-slate-500">
                        {item.engineer_name || "Unassigned"}
                        {item.engineer_phone && ` (${item.engineer_phone})`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const s = item.status || "PENDING";
                      const st = STATUS_STYLE_MAP[s] || STATUS_STYLE_MAP.PENDING;
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${st.bg} ${st.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
                          {STATUS_LABELS[s] || s}
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {item.status === "DC_CUT_REQUEST" && !item.dc_cut_approved ? (
                      <Badge
                        variant="outline"
                        className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-950 dark:bg-amber-950/20 dark:text-amber-400 font-semibold whitespace-nowrap"
                      >
                        Awaiting RMA Approval
                      </Badge>
                    ) : AVAILABLE_TRANSITIONS[item.status || "PENDING"]?.length > 0 ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" className="gap-1 text-xs">
                            <ArrowRight className="w-3.5 h-3.5" />
                            Next Step <ChevronDown className="w-3 h-3 ml-0.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          {AVAILABLE_TRANSITIONS[item.status || "PENDING"].map((targetStatus) => (
                            <DropdownMenuItem
                              key={targetStatus}
                              className="cursor-pointer gap-2 text-sm"
                              onClick={() => openTransition(item, targetStatus)}
                            >
                              <span className={`w-2 h-2 rounded-full ${STATUS_STYLE_MAP[targetStatus]?.dot || "bg-slate-400"}`} />
                              {TRANSITION_LABELS[targetStatus] || targetStatus}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Badge variant="outline" className="text-slate-400 border-slate-200">Completed</Badge>
                    )}
                  </TableCell>
                   <TableCell className="text-center">
                    <Button size="sm" variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium" onClick={() => openTrack(item)}>
                      History
                    </Button>
                  </TableCell>
                  <TableCell className="text-center">
                    {item.status === "DC_CUT_REQUEST" || (item.dc_cut_chat && item.dc_cut_chat.length > 0) ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setActiveChatRow(item);
                          setChatOpen(true);
                        }}
                        className="relative text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium gap-1.5"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Chat</span>
                        {item.dc_cut_chat && item.dc_cut_chat.length > 0 && (
                          <Badge className="h-5 min-w-[20px] px-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {item.dc_cut_chat.length}
                          </Badge>
                        )}
                      </Button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openDetail(item)} className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50" title="Opencall Case Details">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onEdit(item)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/50">
                        <Edit className="w-4 h-4" />
                      </Button>
                      {!isSubAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {pagination.total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-500 dark:text-slate-400">
          <span>
            Showing {(pagination.page - 1) * pagination.per_page + 1}-
            {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page <= 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page >= pagination.pages}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Transition Ticket Dialog */}
      <Dialog open={transitionOpen} onOpenChange={setTransitionOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transition HP Stock Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(() => {
              const note = pendingToStatus ? getTransitionNote(pendingToStatus) : null;
              if (!note) return null;
              return (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3.5 rounded-xl border flex gap-3 items-start shadow-sm backdrop-blur-sm ${note.bg}`}
                >
                  <div className="p-1 rounded-lg bg-white/60 dark:bg-slate-900/60 shadow-sm border border-slate-100 dark:border-slate-800 flex-shrink-0 mt-0.5">
                    {note.icon}
                  </div>
                  <div className="space-y-1">
                    <h4 className={`text-sm font-semibold tracking-wide ${note.text}`}>
                      {note.title}
                    </h4>
                    <p className="text-xs opacity-90 leading-relaxed text-slate-600 dark:text-slate-300">
                      {note.message}
                    </p>
                  </div>
                </motion.div>
              );
            })()}
            {showEngineerField && (
              <div className="space-y-4 border-l-2 border-indigo-500 pl-3 py-1">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Engineer WhatsApp Verification
                </h4>
                <div className="space-y-2">
                  <Label>Select Engineer *</Label>
                  {loadingEngineers ? (
                    <div className="text-xs text-slate-400 py-2">Loading engineers...</div>
                  ) : (
                    <select
                      className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      value={engineerName}
                      onChange={(e) => {
                        const selected = engineers.find((eng) => eng.name === e.target.value);
                        setEngineerName(e.target.value);
                        setEngineerPhone(selected?.phone || "");
                        setOtp("");
                        setOtpSent(false);
                        setGeneratedOtp("");
                      }}
                    >
                      <option value="">Select engineer...</option>
                      {engineers.map((eng) => (
                        <option key={eng.id} value={eng.name}>
                          {eng.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Engineer Phone (10 digits) *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={engineerPhone}
                      onChange={(e) => setEngineerPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      maxLength={10}
                      disabled={otpSent}
                    />
                    <Button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={sendingOtp || engineerPhone.trim().length !== 10}
                      className="bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap"
                    >
                      {sendingOtp ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
                    </Button>
                  </div>
                </div>

                {otpSent && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Label className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Enter 6-Digit OTP *
                    </Label>
                    <Input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP code"
                      maxLength={6}
                      className="border-emerald-500 focus-visible:ring-emerald-500 text-center tracking-widest font-mono text-lg font-bold"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      WhatsApp pre-filled tab launched. Ask the engineer for the OTP to complete this action.
                    </p>
                    {generatedOtp && (
                      <span className="inline-block mt-1 text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 font-mono">
                        Testing fallback OTP: <strong className="text-indigo-600 dark:text-indigo-400">{generatedOtp}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
            {pendingToStatus === "GOOD_PART_PHOTO" && (
              <div className="space-y-4 border-l-2 border-indigo-500 pl-3 py-1">
                {/* Front Photo */}
                <div className="space-y-2">
                  <Label className="text-indigo-600 dark:text-indigo-400 font-medium text-xs uppercase tracking-wider">
                    Good Part Front Box Photo *
                  </Label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={(e) => setGoodPartFile(e.target.files?.[0] || null)}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      ref={cameraInputRef}
                      className="hidden"
                      onChange={(e) => setGoodPartFile(e.target.files?.[0] || null)}
                    />

                    {previewUrl ? (
                      <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center gap-2">
                        <img src={previewUrl} alt="Front Photo Preview" className="max-h-[140px] rounded-lg shadow-sm object-contain" />
                        <div className="flex items-center justify-between w-full text-xs text-slate-500">
                          <span className="truncate max-w-[200px]">{goodPartFile?.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setGoodPartFile(null)}
                            className="text-red-500 hover:text-red-650 font-medium h-7 px-2"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => cameraInputRef.current?.click()}
                          className="h-16 flex flex-col items-center justify-center gap-1.5 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:border-indigo-400"
                        >
                          <Camera className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          <span className="text-[11px] font-semibold">Take Front Live Photo</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-16 flex flex-col items-center justify-center gap-1.5 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:border-indigo-400"
                        >
                          <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          <span className="text-[11px] font-semibold">Upload Front File</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Back Photo */}
                <div className="space-y-2">
                  <Label className="text-indigo-600 dark:text-indigo-400 font-medium text-xs uppercase tracking-wider">
                    Good Part Back Box Photo *
                  </Label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputBackRef}
                      className="hidden"
                      onChange={(e) => setGoodPartBackFile(e.target.files?.[0] || null)}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      ref={cameraInputBackRef}
                      className="hidden"
                      onChange={(e) => setGoodPartBackFile(e.target.files?.[0] || null)}
                    />

                    {previewBackUrl ? (
                      <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center gap-2">
                        <img src={previewBackUrl} alt="Back Photo Preview" className="max-h-[140px] rounded-lg shadow-sm object-contain" />
                        <div className="flex items-center justify-between w-full text-xs text-slate-500">
                          <span className="truncate max-w-[200px]">{goodPartBackFile?.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setGoodPartBackFile(null)}
                            className="text-red-500 hover:text-red-650 font-medium h-7 px-2"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => cameraInputBackRef.current?.click()}
                          className="h-16 flex flex-col items-center justify-center gap-1.5 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:border-indigo-400"
                        >
                          <Camera className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          <span className="text-[11px] font-semibold">Take Back Live Photo</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputBackRef.current?.click()}
                          className="h-16 flex flex-col items-center justify-center gap-1.5 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:border-indigo-400"
                        >
                          <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          <span className="text-[11px] font-semibold">Upload Back File</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {pendingToStatus === "RETURN_PART_PHOTO" && (
              <div className="space-y-4 border-l-2 border-indigo-500 pl-3 py-1">
                <p className="text-[11px] text-slate-500">
                  Take a live photo or upload for each category below. All photos are optional.
                </p>
                {RETURN_PHOTO_FIELDS.map((f) => (
                  <ReturnPhotoPicker
                    key={f.key as string}
                    label={f.label}
                    file={returnFiles[f.key as string] || null}
                    onChange={(file) =>
                      setReturnFiles((prev) => ({ ...prev, [f.key as string]: file }))
                    }
                  />
                ))}
              </div>
            )}
            {pendingToStatus === "DC_CUT_REQUEST" && (
              <div className="space-y-2 border-l-2 border-cyan-500 pl-3 py-1">
                <Label className="text-cyan-600 dark:text-cyan-400 font-medium">
                  DC Cut Request Message
                </Label>
                <Textarea
                  value={dcCutRequestMessage}
                  onChange={(e) => setDcCutRequestMessage(e.target.value)}
                  placeholder="Enter DC Cut Request Message"
                  className="min-h-[80px]"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Provide details or message for the DC Cut request.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Remarks / Comments</Label>
              <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional comments about this transition" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransitionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTransition} disabled={!canConfirm || savingTransition}>
              {savingTransition ? "Processing..." : "Confirm Transition"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Track Dialog */}
      <Dialog open={trackOpen} onOpenChange={setTrackOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>HP Stock Tracking & Account History</DialogTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Full transition records and logistics details</p>
          </DialogHeader>
          {activeRow && (
            <div className="space-y-6">
              {/* Stepper Progress */}
              {(() => {
                const hasUnused = activeRow.status === "UNUSED_RETURN" ||
                  (activeRow.transition_history || []).some(h => h.to_status === "UNUSED_RETURN" || h.from_status === "UNUSED_RETURN");
                const hasDefective = activeRow.status === "DEFECTIVE_RETURN" ||
                  (activeRow.transition_history || []).some(h => h.to_status === "DEFECTIVE_RETURN" || h.from_status === "DEFECTIVE_RETURN");
                const hasDOA = activeRow.status === "DOA" ||
                  (activeRow.transition_history || []).some(h => h.to_status === "DOA" || h.from_status === "DOA");

                const steps = ["PENDING", "STOCK_CHECK", "GOOD_PART_PHOTO", "ISSUED", "WORK_STATUS"];
                if (hasUnused) {
                  steps.push("UNUSED_RETURN");
                } else if (hasDefective) {
                  steps.push("DEFECTIVE_RETURN");
                } else if (hasDOA) {
                  steps.push("DOA");
                } else {
                  steps.push("UNUSED_RETURN");
                }
                steps.push("HANDOVER", "RETURN_PART_PHOTO", "CLOSED");

                const colsClass = "grid grid-cols-2 md:grid-cols-9 gap-3";

                return (
                  <div className={colsClass}>
                    {steps.map((step, idx) => {
                      const normalizeStatusForStepper = (status: string) => {
                        if (status === "RECEIVED") return "STOCK_CHECK";
                        return status;
                      };
                      const normalizedCurrentStatus = normalizeStatusForStepper(activeRow.status || "PENDING");
                      const currentIndex = steps.indexOf(normalizedCurrentStatus);
                      const completed = idx < currentIndex;
                      const current = idx === currentIndex;
                      const formattedStep = STATUS_LABELS[step] || step;
                      return (
                        <div key={step} className={`rounded-xl border p-2.5 text-center transition-colors ${current ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"}`}>
                          <div className={`h-2.5 w-2.5 rounded-full mx-auto mb-1.5 shadow-sm ${completed ? "bg-emerald-500" : current ? "bg-indigo-500 shadow-indigo-500/40" : "bg-slate-300 dark:bg-slate-700"}`} />
                          <p className={`text-[11px] font-medium ${current ? "text-indigo-700 dark:text-indigo-300" : "text-slate-600 dark:text-slate-400"}`}>{formattedStep}</p>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Timeline Logs */}
              <div className="relative max-h-[380px] overflow-y-auto pr-2 pl-10 py-2 space-y-6">
                {/* Vertical Line */}
                <div className="absolute left-[22px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800" />
                {(() => {
                  const milestones = [
                    {
                      status: "PENDING",
                      label: STATUS_LABELS["PENDING"] || "Stock Entry",
                      timestamp: activeRow.created_at,
                      updated_by: activeRow.created_by_name || "System",
                      comment: "Stock entry registered successfully.",
                      engineer_name: "",
                      engineer_phone: "",
                      image: "",
                      image_back: "",
                      return_images: [] as Array<{ label: string; url: string }>,
                    }
                  ];

                  if (activeRow.transition_history && Array.isArray(activeRow.transition_history)) {
                    activeRow.transition_history.forEach((h) => {
                      milestones.push({
                        status: h.to_status,
                        label: STATUS_LABELS[h.to_status] || h.to_status,
                        timestamp: h.timestamp,
                        updated_by: h.updated_by || "System",
                        comment: h.comment || "",
                        engineer_name: h.engineer_name || "",
                        engineer_phone: h.engineer_phone || "",
                        image: h.image || "",
                        image_back: h.image_back || "",
                        return_images: (h.return_images || []).map((ri: any) =>
                          typeof ri === "string" ? { label: "Return Part Photo", url: ri } : ri
                        ),
                      });
                    });
                  }

                  return milestones.map((m, idx) => {
                    const st = STATUS_STYLE_MAP[m.status] || STATUS_STYLE_MAP.PENDING;
                    const d = new Date(m.timestamp);
                    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                    const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric", hour12: true });
                    const formattedDate = `${dateStr} • ${timeStr}`;

                    return (
                      <div key={`${m.timestamp}-${idx}`} className="relative group">
                        {/* Timeline Dot */}
                        <div className={`absolute -left-[30px] top-1.5 flex items-center justify-center w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 ${st.bg} ${st.text} shadow-sm z-10 transition-transform group-hover:scale-110`}>
                          {getStatusIcon(m.status)}
                        </div>

                        {/* Card Content */}
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 space-y-2.5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-50 text-sm">
                              {m.label}
                            </h4>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${st.bg} ${st.text}`}>
                              {m.status === "PENDING" ? "Initiated" : "Completed"}
                            </span>
                          </div>

                          <div className="grid gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                            {m.updated_by && (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 dark:text-slate-500 w-24">Updated By:</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">{m.updated_by}</span>
                              </div>
                            )}
                            {m.engineer_name && (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 dark:text-slate-500 w-24">Engineer:</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {m.engineer_name} {m.engineer_phone && `(${m.engineer_phone})`}
                                </span>
                              </div>
                            )}
                             {m.comment && (
                              <div className="flex items-start gap-2 mt-1 pt-1.5 border-t border-slate-100 dark:border-slate-800/40">
                                <span className="text-slate-400 dark:text-slate-500 w-24 shrink-0 font-medium">Remarks:</span>
                                <span className="text-slate-700 dark:text-slate-300 italic">"{m.comment}"</span>
                              </div>
                            )}
                            {(m.image || m.image_back) && (
                              <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                                <span className="text-slate-400 dark:text-slate-500 w-24 shrink-0 font-medium">Attachments:</span>
                                <div className="flex flex-wrap gap-3 pl-0 sm:pl-24">
                                  {m.image && (
                                    <div className="space-y-1">
                                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Front Box</p>
                                      <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 aspect-video max-h-24 max-w-[140px] flex items-center justify-center cursor-pointer hover:scale-[1.03] transition-transform duration-200" onClick={() => window.open(m.image, "_blank")}>
                                        <img src={m.image} alt="Front Box" className="object-contain w-full h-full" />
                                      </div>
                                    </div>
                                  )}
                                  {m.image_back && (
                                    <div className="space-y-1">
                                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Back Box</p>
                                      <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 aspect-video max-h-24 max-w-[140px] flex items-center justify-center cursor-pointer hover:scale-[1.03] transition-transform duration-200" onClick={() => window.open(m.image_back, "_blank")}>
                                        <img src={m.image_back} alt="Back Box" className="object-contain w-full h-full" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            {m.return_images && m.return_images.length > 0 && (
                              <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                                <span className="text-slate-400 dark:text-slate-500 w-24 shrink-0 font-medium">Return Part Photos:</span>
                                <div className="flex flex-wrap gap-3 pl-0 sm:pl-24">
                                  {m.return_images.map((ri) => (
                                    <div key={ri.label} className="space-y-1">
                                      <p className="text-[10px] text-slate-400 font-semibold uppercase max-w-[140px]">{ri.label}</p>
                                      <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 aspect-video max-h-24 max-w-[140px] flex items-center justify-center cursor-pointer hover:scale-[1.03] transition-transform duration-200" onClick={() => window.open(ri.url, "_blank")}>
                                        <img src={ri.url} alt={ri.label} className="object-contain w-full h-full" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/40 mt-1 flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formattedDate}</span>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Opencalls Details Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {activeRow && (() => {
            const details = activeRow.opencall_case_details || {};
            const output = details.output || {};
            
            const readVal = (key: string): string => {
              const v = output[key];
              if (v === null || v === undefined || v === "") return "—";
              return String(v);
            };

            const ticketId = readVal("Ticket ID");
            const caseId = readVal("Case ID");
            const customerName = readVal("Customer Name");
            const customerEmail = readVal("Customer Mail");
            const workLocation = readVal("Work Location");
            const location = readVal("Location");
            const regionName = readVal("Region");
            const rtplStatus = readVal("RTPL status");
            const flexStatus = readVal("Flex Status");
            const segment = readVal("Segment");
            const woOtcCode = readVal("WO OTC Code");
            const productLine = readVal("Product Line");
            const caseCreated = readVal("Case Created") || readVal("Case Opened");
            
            const daysOpen = details.days_open != null ? String(details.days_open) : "0";
            const appearances = details.appearances != null ? String(details.appearances) : "1";
            const actionsTaken = details.actions_taken != null ? String(details.actions_taken) : "0";
            const sinceLastAction = "0d";

            // Parse timeline from inventory_details
            const timelineEntries = (activeRow.inventory_details || "")
              .split("\n\n")
              .filter(Boolean)
              .map((line) => {
                const lines = line.split("\n");
                const header = lines[0] || "";
                const remarks = lines[1] || "";
                return { header, remarks };
              });

            return (
              <div className="space-y-6">
                {/* Header */}
                <div className="border-b pb-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    CASE DETAILS
                  </div>
                  <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mt-1">
                    Ticket ID: <span className="text-indigo-600 dark:text-indigo-400">{ticketId}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    {customerName} · {workLocation}
                  </p>
                </div>

                {/* Pills Row */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    {segment}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                    NEW
                  </span>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                    FLEX: {flexStatus}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    SEGMENT: {segment}
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="text-center">
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-50">{daysOpen}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">DAYS OPEN</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-50">{sinceLastAction}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">SINCE LAST ACTION</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-50">{appearances}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">APPEARANCES</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-50">{actionsTaken}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">ACTIONS TAKEN</div>
                  </div>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Details Cards */}
                  <div className="space-y-6">
                    {/* CUSTOMER section */}
                    <div className="bg-white dark:bg-slate-900/20 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50 border-b pb-1.5 uppercase tracking-wide">
                        Customer
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block mb-0.5">CUSTOMER NAME</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{customerName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">CUSTOMER EMAIL</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 break-all">{customerEmail}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">WORK LOCATION (ASP)</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{workLocation}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">LOCATION</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{location}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 block mb-0.5">REGION</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{regionName}</span>
                        </div>
                      </div>
                    </div>

                    {/* CASE & PRODUCT section */}
                    <div className="bg-white dark:bg-slate-900/20 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50 border-b pb-1.5 uppercase tracking-wide">
                        Case &amp; Product
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block mb-0.5">CASE ID</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{caseId}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">WO OTC CODE</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{woOtcCode}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 block mb-0.5">PRODUCT LINE</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{productLine}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">SEGMENT</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{segment}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">CASE CREATED</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{caseCreated}</span>
                        </div>
                      </div>
                    </div>

                    {/* STATUS & ASSIGNMENT section */}
                    <div className="bg-white dark:bg-slate-900/20 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50 border-b pb-1.5 uppercase tracking-wide">
                        Status &amp; Assignment
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block mb-0.5">RTPL STATUS</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{rtplStatus}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">FLEX STATUS</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{flexStatus}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">ENGINEER</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{activeRow.engineer_name || "Unassigned"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">HP OWNER STATUS</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{readVal("HP Owner Status")}</span>
                        </div>
                      </div>
                    </div>

                    {/* GOOD PART PHOTO section */}
                    {(activeRow.good_part_image || activeRow.good_part_image_back) && (
                      <div className="bg-white dark:bg-slate-900/20 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50 border-b pb-1.5 uppercase tracking-wide flex items-center gap-2">
                          <Camera className="w-4 h-4 text-indigo-500" />
                          Good Part Photos
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {activeRow.good_part_image && (
                            <div className="space-y-2">
                              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide text-center">Front Box Photo</p>
                              <div className="relative rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 aspect-video max-h-48 flex items-center justify-center">
                                <img
                                  src={activeRow.good_part_image}
                                  alt="Good Part Front"
                                  className="object-contain w-full h-full cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                                  onClick={() => window.open(activeRow.good_part_image, "_blank")}
                                />
                              </div>
                            </div>
                          )}
                          {activeRow.good_part_image_back && (
                            <div className="space-y-2">
                              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide text-center">Back Box Photo</p>
                              <div className="relative rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 aspect-video max-h-48 flex items-center justify-center">
                                <img
                                  src={activeRow.good_part_image_back}
                                  alt="Good Part Back"
                                  className="object-contain w-full h-full cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                                  onClick={() => window.open(activeRow.good_part_image_back, "_blank")}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 text-center font-medium">Click a photo to open in full size</p>
                      </div>
                    )}

                    {/* RETURN PART PHOTO section */}
                    {activeRow.return_part_image && (
                      <div className="bg-white dark:bg-slate-900/20 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50 border-b pb-1.5 uppercase tracking-wide flex items-center gap-2">
                          <Camera className="w-4 h-4 text-indigo-500" />
                          Return Part Photo
                        </h3>
                        <div className="relative rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 aspect-video max-h-60 flex items-center justify-center">
                          <img
                            src={activeRow.return_part_image}
                            alt="Return Part"
                            className="object-contain w-full h-full cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                            onClick={() => window.open(activeRow.return_part_image, "_blank")}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 text-center font-medium">Click the photo to open in full size</p>
                      </div>
                    )}

                    {/* RETURN PART PHOTO categories */}
                    {RETURN_PHOTO_FIELDS.some((f) => activeRow[f.key]) && (
                      <div className="bg-white dark:bg-slate-900/20 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50 border-b pb-1.5 uppercase tracking-wide flex items-center gap-2">
                          <Camera className="w-4 h-4 text-indigo-500" />
                          Return Part Photos
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {RETURN_PHOTO_FIELDS.filter((f) => activeRow[f.key]).map((f) => {
                            const url = activeRow[f.key] as string;
                            return (
                              <div key={f.key as string} className="space-y-1.5">
                                <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{f.label}</p>
                                <div className="relative rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 aspect-video max-h-48 flex items-center justify-center">
                                  <img
                                    src={url}
                                    alt={f.label}
                                    className="object-contain w-full h-full cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                                    onClick={() => window.open(url, "_blank")}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-slate-400 text-center font-medium">Click a photo to open in full size</p>
                      </div>
                    )}

                    {activeRow.dc_cut_request_message && (
                      <div className="bg-white dark:bg-slate-900/20 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50 border-b pb-1.5 uppercase tracking-wide flex items-center gap-2">
                          <FileText className="w-4 h-4 text-cyan-500" />
                          DC Cut Request Message
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap">
                          {activeRow.dc_cut_request_message}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Status Timeline */}
                  <div className="bg-slate-50/50 dark:bg-slate-900/10 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 h-fit">
                    <div className="border-b pb-2">
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50 uppercase tracking-wide">
                        RTPL Status Timeline
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Each status change and the date it happened.</p>
                    </div>

                    {timelineEntries.length === 0 ? (
                      <div className="text-xs text-slate-400 py-4 text-center">
                        No status changes recorded for this case yet.
                      </div>
                    ) : (
                      <div className="relative pl-6 space-y-6 pt-2">
                        {/* Timeline vertical bar */}
                        <div className="absolute left-[7px] top-3 bottom-3 w-0.5 bg-slate-200 dark:bg-slate-800" />
                        
                        {timelineEntries.map((entry, index) => (
                          <div key={index} className="relative group text-xs">
                            {/* Timeline dot */}
                            <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-500 shadow-sm z-10" />
                            
                            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-1">
                              <p className="font-medium text-slate-900 dark:text-slate-100">{entry.header}</p>
                              {entry.remarks && (
                                <p className="text-slate-500 italic mt-0.5">{entry.remarks}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter className="border-t pt-4">
                  <Button onClick={() => setDetailOpen(false)}>Close Details</Button>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <DCCutChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        item={activeChatRow}
        onMessageSent={(updated) => {
          setActiveChatRow(updated);
          onRowUpdated(updated);
        }}
      />
    </div>
  );
}
