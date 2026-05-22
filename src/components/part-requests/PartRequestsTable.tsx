import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PartRequest, PaginationMeta, UserRole } from "@/types";
import { PART_REQUEST_STATUS_LABELS } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
}

function PartRequestDetailDialog({
  request,
  isOpen,
  onClose,
}: PartRequestDetailDialogProps) {
  const [activeDocIndex, setActiveDocIndex] = useState(0);
  const [activeDocType, setActiveDocType] = useState<"cso" | "part">("part");

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

            {/* Right Column - Beautiful Scan / Document Gallery */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm flex flex-col h-full">
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

  return (
    <div>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
              <TableHead>Ticket #</TableHead>
              {isManager && <TableHead>Region</TableHead>}
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
            {data.map((pr, i) => (
              <motion.tr
                key={pr.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <TableCell className="font-medium">{pr.ticket_number}</TableCell>
                {isManager && (
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
                      className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
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
            ))}
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
      />
    </div>
  );
}
