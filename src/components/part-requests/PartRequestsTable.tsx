import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  PackageSearch,
  Check,
  X,
  Eye,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  Hash,
  FileText,
  Info,
  DollarSign,
  FileQuestion,
  ExternalLink,
  Download,
  Wrench,
  Send,
  MessageSquare,
} from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PartRequest, PaginationMeta, UserRole, PartRequestMessage } from "@/types";
import { PART_REQUEST_STATUS_LABELS } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getPartRequest, addPartRequestMessage } from "@/api/partRequests";
import { useAuthStore } from "@/store/authStore";

interface PartRequestsTableProps {
  data: PartRequest[];
  loading: boolean;
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  userRole: UserRole;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

const urgencyStyles: Record<string, string> = {
  normal: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  urgent: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  critical: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  approved: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
  rejected: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
  ordered: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  received: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400",
  cancelled: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
};

interface PartRequestDetailDialogProps {
  request: PartRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onMessagesSeen?: (requestId: number, messages: PartRequestMessage[]) => void;
}

function PartRequestDetailDialog({
  request,
  isOpen,
  onClose,
  onMessagesSeen,
}: PartRequestDetailDialogProps) {
  const [activeDocIndex, setActiveDocIndex] = useState(0);
  const [activeDocType, setActiveDocType] = useState<"cso" | "part">("part");
  const [messages, setMessages] = useState<PartRequestMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (request?.id) {
      setMessages(request.messages || []);
      setLoadingMessages(true);
      getPartRequest(request.id)
        .then((data) => {
          if (data.messages) {
            setMessages(data.messages);
          }
        })
        .catch((err) => console.error("Error loading messages:", err))
        .finally(() => setLoadingMessages(false));
    } else {
      setMessages([]);
    }
  }, [request?.id]);

  useEffect(() => {
    if (request?.id && messages.length > 0 && onMessagesSeen) {
      onMessagesSeen(request.id, messages);
    }
  }, [request?.id, messages, onMessagesSeen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || submitting || !request?.id) return;

    setSubmitting(true);
    try {
      const sentMsg = await addPartRequestMessage(request.id, newMessage.trim());
      setMessages((prev) => [...prev, sentMsg]);
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    setActiveDocIndex(0);
    if (request?.ticket_details?.cso_image) {
      setActiveDocType("cso");
    } else {
      setActiveDocType("part");
    }
  }, [request]);

  if (!request) return null;

  const ticket = request.ticket_details;

  const partRequestDocs = ticket
    ? [
        ...(ticket.part_request_images || []).map((img) => img.image),
        ...(ticket.part_request_image ? [ticket.part_request_image] : []),
      ].filter((v, i, self) => self.indexOf(v) === i)
    : [];

  const csoImage = ticket?.cso_image;

  const renderDocPreview = (url: string, title: string) => {
    const isPdf = url.toLowerCase().endsWith(".pdf");
    return (
      <div className="flex flex-col items-center justify-center w-full mt-2">
        {isPdf ? (
          <div className="w-full h-[320px] border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-inner">
            <iframe src={url} className="w-full h-full" title={title} />
          </div>
        ) : (
          <div className="relative max-w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-inner group flex justify-center items-center">
            <img
              src={url}
              alt={title}
              className="max-h-[320px] object-contain transition-transform duration-300 group-hover:scale-[1.01]"
            />
          </div>
        )}
        <div className="w-full flex items-center justify-between mt-3 px-1">
          <span className="text-xs text-slate-500 font-mono truncate max-w-[200px]" title={url.split("/").pop()}>
            {url.split("/").pop()}
          </span>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Full Screen
            </a>
            <a
              href={url}
              download
              className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:underline font-semibold"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl md:max-w-5xl h-[90vh] md:h-[85vh] p-0 overflow-hidden flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl">
        {/* Clean Standard Header */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 px-2.5 py-1 rounded-full">
                Part Request Details
              </span>
              {ticket?.form_number && (
                <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-slate-705 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Form: {ticket.form_number}
                </span>
              )}
              {ticket?.ticket_number && (
                <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-slate-705 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Ticket: {ticket.ticket_number}
                </span>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-bold mt-2 tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              {request.part_name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
              Part No: {request.part_number}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Requested: {new Date(request.created_at).toLocaleDateString()}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border",
                  urgencyStyles[request.urgency] || urgencyStyles.normal
                )}
              >
                {request.urgency}
              </span>
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border",
                  statusStyles[request.status] || statusStyles.pending
                )}
              >
                {PART_REQUEST_STATUS_LABELS[request.status]}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable details panel */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-slate-950/20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Middle Column - Metadata Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product and Request details */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Request & Ticket Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailField label="Work Order" value={ticket?.work_order} icon={Hash} />
                  <DetailField label="Case ID" value={ticket?.case_id} icon={Hash} />
                  <DetailField label="Brand / Manufacturer" value={ticket?.brand} icon={Package} />
                  <DetailField label="Product Name" value={ticket?.product_name} icon={Package} />
                  <DetailField label="Product Serial" value={ticket?.serial_number} icon={Hash} />
                  <DetailField label="Model Number" value={ticket?.model_number} icon={Hash} />
                  <DetailField
                    label="Service Type"
                    value={ticket?.service_type_display || ticket?.service_type}
                    icon={Info}
                    className="capitalize"
                  />
                  <DetailField label="Priority" value={ticket?.priority} icon={Info} className="capitalize" />
                  <DetailField label="Quantity Requested" value={request.quantity.toString()} icon={Info} />
                  <DetailField
                    label="Estimated Cost"
                    value={request.estimated_cost != null ? `₹${request.estimated_cost}` : undefined}
                    icon={DollarSign}
                  />
                  <DetailField
                    label="Region"
                    value={ticket?.region_display || ticket?.region}
                    icon={MapPin}
                    className="capitalize"
                  />
                  <DetailField label="Ticket Status" value={ticket?.current_status_display} icon={Info} />
                </div>

                {request.rejection_reason && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg">
                    <p className="text-xs text-red-500 dark:text-red-400 font-semibold flex items-center gap-1.5">
                      <X className="w-3.5 h-3.5" /> Rejection Reason
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {request.rejection_reason}
                    </p>
                  </div>
                )}
              </div>

              {/* Customer information */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailField label="Customer Name" value={ticket?.cust_name} icon={User} />
                  <DetailField label="Contact Number" value={ticket?.cust_contact} icon={Phone} />
                  <DetailField label="Customer Email" value={ticket?.cust_email} icon={Mail} />
                  <DetailField label="Location" value={ticket?.location} icon={MapPin} />
                  <div className="md:col-span-2">
                    <DetailField label="Customer Address" value={ticket?.cust_address} icon={MapPin} />
                  </div>
                </div>
              </div>

              {/* Description fields */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Descriptions & Failure Log
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400">Condition Received</h4>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1 whitespace-pre-wrap">
                      {ticket?.condition_received || <span className="italic text-slate-400">No condition notes.</span>}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400">Issue Description</h4>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1 whitespace-pre-wrap">
                      {ticket?.issue_description || <span className="italic text-slate-400">No issue description notes.</span>}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400">Part Request Notes / Comments</h4>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1 whitespace-pre-wrap">
                      {request.description || <span className="italic text-slate-400">No request description comments.</span>}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Beautiful Scan / Document Gallery & Premium Discussion Feed */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm flex flex-col">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Document Scans / Image Entry
                </h3>

                {/* Scans tabs if both CSO and Part request images exist */}
                {csoImage && partRequestDocs.length > 0 && (
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 mb-3">
                    <button
                      onClick={() => setActiveDocType("cso")}
                      className={cn(
                        "flex-1 text-xs font-medium py-1.5 rounded-lg transition-all",
                        activeDocType === "cso"
                          ? "bg-white dark:bg-slate-750 shadow-sm text-slate-800 dark:text-white"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      CSO Scan
                    </button>
                    <button
                      onClick={() => setActiveDocType("part")}
                      className={cn(
                        "flex-1 text-xs font-medium py-1.5 rounded-lg transition-all",
                        activeDocType === "part"
                          ? "bg-white dark:bg-slate-750 shadow-sm text-slate-800 dark:text-white"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      Part Requests ({partRequestDocs.length})
                    </button>
                  </div>
                )}

                {/* Previews based on type selection */}
                {activeDocType === "cso" && csoImage && (
                  <div>
                    {renderDocPreview(csoImage, "CSO Image Scan")}
                  </div>
                )}

                {activeDocType === "part" && partRequestDocs.length > 0 && (
                  <div className="flex-1 flex flex-col">
                    {/* Gallery Thumbnails List */}
                    {partRequestDocs.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto py-2 border-b border-slate-200 dark:border-slate-800 mb-4 max-w-full">
                        {partRequestDocs.map((doc, idx) => {
                          const isPdf = doc.toLowerCase().endsWith(".pdf");
                          const isActive = idx === activeDocIndex;
                          return (
                            <button
                              key={idx}
                              onClick={() => setActiveDocIndex(idx)}
                              className={cn(
                                "flex-shrink-0 relative w-12 h-12 rounded-lg overflow-hidden border bg-white dark:bg-slate-900 transition-all flex items-center justify-center p-0.5",
                                isActive
                                  ? "border-indigo-500 ring-2 ring-indigo-500/20 scale-105"
                                  : "border-slate-200 dark:border-slate-800 hover:border-indigo-200"
                              )}
                            >
                              {isPdf ? (
                                <div className="flex flex-col items-center justify-center h-full w-full bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-md">
                                  <FileText className="w-4 h-4" />
                                  <span className="text-[6px] font-bold">PDF</span>
                                </div>
                              ) : (
                                <img
                                  src={doc}
                                  alt={`Doc ${idx + 1}`}
                                  className="w-full h-full object-cover rounded-md"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div>
                      {partRequestDocs[activeDocIndex] && renderDocPreview(partRequestDocs[activeDocIndex], `Part Request Image ${activeDocIndex + 1}`)}
                    </div>
                  </div>
                )}

                {/* Fallbacks */}
                {!csoImage && partRequestDocs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950/10">
                    <FileQuestion className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2" />
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      No scans uploaded for this request.
                    </span>
                  </div>
                )}

                {activeDocType === "cso" && !csoImage && partRequestDocs.length > 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <p className="text-xs">No CSO Entry scan available.</p>
                    <Button variant="link" size="sm" onClick={() => setActiveDocType("part")} className="text-indigo-500">
                      View Part Request Scans
                    </Button>
                  </div>
                )}

                {activeDocType === "part" && partRequestDocs.length === 0 && csoImage && (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <p className="text-xs">No Part Request scans available.</p>
                    <Button variant="link" size="sm" onClick={() => setActiveDocType("cso")} className="text-indigo-500">
                      View CSO Scan
                    </Button>
                  </div>
                )}
              </div>

              {/* Chat / Discussion Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm flex flex-col h-[400px]">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2 mb-3 flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Discussion & History
                </h3>

                {/* Scrollable messages container */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-3 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scroll-smooth">
                  {loadingMessages && messages.length === 0 ? (
                    <div className="flex flex-col gap-3 py-2">
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-3.5 w-24" />
                          <Skeleton className="h-10 w-2/3 rounded-xl rounded-tl-none" />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end self-end w-full">
                        <div className="flex-1 flex flex-col items-end space-y-1.5">
                          <Skeleton className="h-3.5 w-24" />
                          <Skeleton className="h-10 w-2/3 rounded-xl rounded-tr-none" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-slate-400 text-center">
                      <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2 opacity-60" />
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-350">No discussions yet</p>
                      <p className="text-[11px] text-slate-400 max-w-[200px] mt-1 leading-normal">
                        Ask a question or post an update about this part request.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const role = msg.sender.role.toLowerCase();
                      const isSuperAdmin = role.includes("super admin") || role === "super_admin";
                      const isSubAdmin = role.includes("sub admin") || role === "sub_admin";
                      const isManager = (role.includes("manager") || role === "manager" || role.includes("admin") || role === "admin") && !isSubAdmin && !isSuperAdmin;

                      let roleBadgeClass = "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
                      if (isSuperAdmin) {
                        roleBadgeClass = "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50";
                      } else if (isManager) {
                        roleBadgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50";
                      } else if (isSubAdmin) {
                        roleBadgeClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50";
                      }

                      const getInitials = (name: string) => {
                        return name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase();
                      };
                      const initials = getInitials(msg.sender.full_name);

                      return (
                        <div key={msg.id} className="flex items-start gap-2.5 text-xs">
                          {/* Avatar Circle */}
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 shadow-inner border",
                            isSubAdmin
                              ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900"
                              : isSuperAdmin || isManager
                              ? "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900"
                              : "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                          )}>
                            {initials}
                          </div>

                          {/* Message Body */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-semibold text-slate-700 dark:text-slate-350 flex items-center gap-1.5 truncate">
                                {msg.sender.full_name}
                                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border tracking-wide uppercase flex-shrink-0", roleBadgeClass)}>
                                  {msg.sender.role}
                                </span>
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className={cn(
                              "p-3 rounded-2xl border text-sm text-slate-850 dark:text-slate-200 leading-relaxed break-words shadow-sm",
                              isSubAdmin
                                ? "bg-amber-50/20 border-amber-100/50 dark:bg-amber-950/10 dark:border-amber-900/20 rounded-tl-none"
                                : isSuperAdmin || isManager
                                ? "bg-indigo-50/20 border-indigo-100/50 dark:bg-indigo-950/10 dark:border-indigo-900/20 rounded-tl-none"
                                : "bg-slate-50/40 border-slate-100/50 dark:bg-slate-800/20 dark:border-slate-800 rounded-tl-none"
                            )}>
                              {msg.message}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {/* Scroll target anchor */}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input form footer */}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t border-slate-150 dark:border-slate-800 pt-3 flex-shrink-0">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ask a question or reply..."
                    className="flex-1 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all placeholder-slate-400"
                    disabled={submitting}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-9 w-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex-shrink-0 flex items-center justify-center shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    disabled={!newMessage.trim() || submitting}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailField({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: React.ReactNode | null | undefined;
  icon: React.ElementType;
  className?: string;
}) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className={cn("text-sm font-medium text-slate-800 dark:text-slate-100 break-words mt-0.5", className)}>
          {value || <span className="text-slate-350 dark:text-slate-650 italic">--</span>}
        </p>
      </div>
    </div>
  );
}

export function PartRequestsTable({
  data,
  loading,
  pagination,
  onPageChange,
  userRole,
  onApprove,
  onReject,
}: PartRequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<PartRequest | null>(null);

  const user = useAuthStore((s) => s.user);

  const [seenMap, setSeenMap] = useState<Record<string, number>>(() => {
    if (!user?.id) return {};
    try {
      const stored = localStorage.getItem(`seen_messages_user_${user.id}`);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    if (user?.id) {
      try {
        const stored = localStorage.getItem(`seen_messages_user_${user.id}`);
        setSeenMap(stored ? JSON.parse(stored) : {});
      } catch (e) {
        setSeenMap({});
      }
    } else {
      setSeenMap({});
    }
  }, [user?.id]);

  const markAsRead = (requestId: number, messages: PartRequestMessage[]) => {
    if (!user?.id || messages.length === 0) return;
    const maxId = Math.max(...messages.map((m) => m.id));
    const currentSeen = seenMap[requestId] || 0;
    if (maxId > currentSeen) {
      const updated = { ...seenMap, [requestId]: maxId };
      setSeenMap(updated);
      try {
        localStorage.setItem(`seen_messages_user_${user.id}`, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const getUnreadCount = (pr: PartRequest) => {
    if (!user?.id || !pr.messages || pr.messages.length === 0) return 0;
    const lastSeenId = seenMap[pr.id] || 0;
    const unreadMessages = pr.messages.filter(
      (msg) => msg.sender.id !== user.id && msg.id > lastSeenId
    );
    return unreadMessages.length;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <PackageSearch className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
          No part requests found
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Try adjusting your filters or create a new part request.
        </p>
      </Card>
    );
  }

  const start = (pagination.page - 1) * pagination.per_page + 1;
  const end = Math.min(pagination.page * pagination.per_page, pagination.total);
  const isManager = userRole === "manager" || userRole === "admin" || userRole === "super_admin";
  const showRegion = isManager || userRole === "sub_admin";

  return (
    <div>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
              <TableHead>Ticket #</TableHead>
              {showRegion && <TableHead>Region</TableHead>}
              <TableHead>Part Number</TableHead>
              <TableHead>Part Name</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((pr, i) => {
              const unreadCount = getUnreadCount(pr);
              return (
                <motion.tr
                  key={pr.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{pr.ticket_number}</span>
                      {unreadCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full border border-red-100 dark:border-red-900/30 shadow-sm animate-pulse">
                          <MessageSquare className="w-3 h-3" />
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                  </TableCell>
                {showRegion && (
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {pr.region_display || pr.region}
                    </Badge>
                  </TableCell>
                )}
                <TableCell className="font-mono text-sm">{pr.part_number}</TableCell>
                <TableCell>{pr.part_name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{pr.quantity}</Badge>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      urgencyStyles[pr.urgency] || urgencyStyles.normal
                    )}
                  >
                    {pr.urgency.charAt(0).toUpperCase() + pr.urgency.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      statusStyles[pr.status] || statusStyles.pending
                    )}
                  >
                    {PART_REQUEST_STATUS_LABELS[pr.status]}
                  </span>
                </TableCell>
                <TableCell>{pr.requested_by.full_name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedRequest(pr)}
                      className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 relative"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      )}
                    </Button>
                    {isManager && pr.status === "pending" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onApprove(pr.id)}
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onReject(pr.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </motion.tr>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {pagination.total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
          <span>
            Showing <span className="font-semibold text-slate-900 dark:text-white">{start}-{end}</span> of{" "}
            <span className="font-semibold text-slate-900 dark:text-white">{pagination.total}</span>
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <PartRequestDetailDialog
        request={selectedRequest}
        isOpen={selectedRequest !== null}
        onClose={() => setSelectedRequest(null)}
        onMessagesSeen={markAsRead}
      />
    </div>
  );
}
