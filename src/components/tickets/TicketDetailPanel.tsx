import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/workflow/StatusBadge";
import { PriorityBadge } from "@/components/workflow/PriorityBadge";
import { DelayIndicator } from "@/components/workflow/DelayIndicator";
import { TransitionActions } from "@/components/workflow/TransitionActions";
import { TicketTimeline } from "@/components/workflow/TicketTimeline";
import { PrintTemplate } from "./PrintTemplate";
import { TicketEditDialog } from "./TicketEditDialog";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { deleteTicket } from "@/api/tickets";
import { toast } from "@/components/ui/use-toast";
import { extractApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  Hash,
  Wrench,
  Calendar,
  Clock,
  Trash2,
  FileText,
} from "lucide-react";
import {
  SERVICE_TYPE_LABELS,
} from "@/types";
import type {
  Ticket,
  TimelineEntry,
  AvailableTransition,
} from "@/types";

interface TicketDetailPanelProps {
  ticket: Ticket;
  timeline: TimelineEntry[];
  transitions: AvailableTransition[];
  onTransitioned: () => void;
}

function InfoRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 break-words">
          {value || <span className="text-slate-400 dark:text-slate-500 italic">--</span>}
        </p>
      </div>
    </div>
  );
}

export function TicketDetailPanel({
  ticket,
  timeline,
  transitions,
  onTransitioned,
}: TicketDetailPanelProps) {
  const [editOpen, setEditOpen] = useState(false);
  const navigate = useNavigate();
  const userRole = useAuthStore((s) => s.user?.role);
  const [activeDocIndex, setActiveDocIndex] = useState(0);

  const partRequestDocs = [
    ...(ticket.part_request_images || []).map(img => img.image),
    ...(ticket.part_request_image ? [ticket.part_request_image] : [])
  ].filter((v, i, self) => self.indexOf(v) === i);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await deleteTicket(ticket.id);
      toast({ title: "Ticket deleted successfully" });
      navigate("/cso-entry");
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {ticket.ticket_number}
            {ticket.form_number && (
              <span className="ml-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full align-middle">
                {ticket.form_number}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {ticket.product_name}
            {ticket.serial_number && ` - S/N: ${ticket.serial_number}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={ticket.current_status} size="md" />
          <PriorityBadge priority={ticket.priority} size="md" />
          <DelayIndicator
            health={ticket.sla_health}
            remainingMins={ticket.sla_remaining_mins}
            elapsedMins={ticket.current_stage_elapsed_mins}
            size="md"
          />
          <Button variant="outline" onClick={() => setEditOpen(true)} className="gap-2">
            <Pencil className="w-4 h-4" /> Edit
          </Button>
          <PrintTemplate ticket={ticket} />
          {(userRole === "super_admin" || userRole === "admin") && (
            <Button variant="outline" onClick={handleDelete} className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 dark:text-red-400 dark:hover:bg-red-950/50 dark:border-red-900/50">
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      {/* ── Transition Actions ──────────────────────────── */}
      {transitions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <TransitionActions
              ticketId={ticket.id}
              transitions={transitions}
              onTransitioned={onTransitioned}
              csoImage={ticket.cso_image}
              partRequestImage={ticket.part_request_image}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Document Scans (CSO Entry & Part Request) for Managers & Admins ── */}
        {(userRole === "manager" || userRole === "super_admin" || userRole === "admin") && (ticket.cso_image || partRequestDocs.length > 0) && (
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {ticket.cso_image && (
              <Card className={cn("overflow-hidden border-indigo-100 dark:border-indigo-900/50 shadow-sm", (partRequestDocs.length === 0) && "md:col-span-2")}>
                <CardHeader className="pb-3 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span>📄</span> CSO Entry Image / Scan
                    </span>
                    <a
                      href={ticket.cso_image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                    >
                      Open Full Screen
                    </a>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 flex flex-col items-center justify-center bg-slate-50/20 dark:bg-slate-950/20">
                  {ticket.cso_image.toLowerCase().endsWith(".pdf") ? (
                    <div className="w-full h-[350px] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                      <iframe src={ticket.cso_image} className="w-full h-full" title="CSO Document Preview" />
                    </div>
                  ) : (
                    <div className="relative max-w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-inner group">
                      <img
                        src={ticket.cso_image}
                        alt="CSO Entry scan"
                        className="max-h-[350px] object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {partRequestDocs.length > 0 && (() => {
              const activeDoc = partRequestDocs[activeDocIndex] || partRequestDocs[0];
              return (
                <Card className={cn("overflow-hidden border-amber-100 dark:border-amber-900/50 shadow-sm", (!ticket.cso_image) && "md:col-span-2")}>
                  <CardHeader className="pb-3 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span>🔧</span> Part Request Scan / Gallery {partRequestDocs.length > 1 && `(${activeDocIndex + 1}/${partRequestDocs.length})`}
                      </span>
                      {activeDoc && (
                        <a
                          href={activeDoc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                        >
                          Open Full Screen
                        </a>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 flex flex-col items-center bg-slate-50/20 dark:bg-slate-950/20 gap-4">
                    {activeDoc ? (
                      activeDoc.toLowerCase().endsWith(".pdf") ? (
                        <div className="w-full h-[350px] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                          <iframe src={activeDoc} className="w-full h-full" title="Part Request Document Preview" />
                        </div>
                      ) : (
                        <div className="relative max-w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-inner group">
                          <img
                            src={activeDoc}
                            alt="Part Request scan"
                            className="max-h-[350px] object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                          />
                        </div>
                      )
                    ) : (
                      <div className="text-xs text-slate-400 italic py-8">No document selected</div>
                    )}

                    {/* Horizontal scrollable slider for multiple documents */}
                    {partRequestDocs.length > 1 && (
                      <div className="w-full flex items-center gap-2 overflow-x-auto py-2 px-1 border-t border-slate-100 dark:border-slate-800/80 mt-2">
                        {partRequestDocs.map((doc, idx) => {
                          const isPdf = doc.toLowerCase().endsWith(".pdf");
                          const isActive = idx === activeDocIndex;
                          return (
                            <button
                              key={idx}
                              onClick={() => setActiveDocIndex(idx)}
                              className={cn(
                                "flex-shrink-0 relative w-16 h-16 rounded-xl overflow-hidden border-2 bg-white dark:bg-slate-900 transition-all shadow-sm flex items-center justify-center p-1",
                                isActive 
                                  ? "border-amber-500 shadow-amber-100/50 dark:shadow-amber-950/30 scale-105" 
                                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                              )}
                            >
                              {isPdf ? (
                                <div className="flex flex-col items-center justify-center h-full w-full bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-lg">
                                  <FileText className="w-6 h-6" />
                                  <span className="text-[8px] font-bold mt-0.5">PDF</span>
                                </div>
                              ) : (
                                <img
                                  src={doc}
                                  alt={`Document ${idx + 1}`}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              )}
                              <span className="absolute bottom-0.5 right-1 bg-black/60 text-white text-[8px] font-bold px-1 rounded-sm">
                                #{idx + 1}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        )}

        {/* ── Customer Info ─────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={User} label="Name" value={ticket.cust_name} />
            <InfoRow icon={Phone} label="Contact" value={ticket.cust_contact} />
            <InfoRow icon={Mail} label="Email" value={ticket.cust_email} />
            <InfoRow
              icon={MapPin}
              label="Address"
              value={ticket.cust_address}
            />
          </CardContent>
        </Card>

        {/* ── Product Info ──────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={Package}
              label="Product"
              value={ticket.product_name}
            />
            <InfoRow
              icon={Hash}
              label="Serial Number"
              value={ticket.serial_number}
            />
            <InfoRow
              icon={Hash}
              label="Model Number"
              value={ticket.model_number}
            />
            <InfoRow icon={Package} label="Brand" value={ticket.brand} />
            <InfoRow icon={Hash} label="Case ID" value={ticket.case_id} />
            <InfoRow
              icon={Calendar}
              label="CSO Date"
              value={formatDate(ticket.cso_date)}
            />
            <InfoRow
              icon={Package}
              label="Condition Received"
              value={ticket.condition_received}
            />
          </CardContent>
        </Card>

        {/* ── Service Info ──────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Service Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={Wrench}
              label="Service Type"
              value={
                SERVICE_TYPE_LABELS[ticket.service_type] ||
                ticket.service_type_display
              }
            />
            <InfoRow
              icon={Wrench}
              label="Issue Description"
              value={ticket.issue_description}
            />
            <InfoRow
              icon={User}
              label="Assigned Engineer"
              value={ticket.assigned_engineer?.name ?? ticket.current_assignee?.full_name}
            />
            <InfoRow
              icon={MapPin}
              label="Region"
              value={ticket.region_display}
            />
            <InfoRow
              icon={User}
              label="Created By"
              value={ticket.created_by?.full_name}
            />
            <InfoRow
              icon={Calendar}
              label="Arrival Date"
              value={formatDate(ticket.arrival_date)}
            />
            <InfoRow
              icon={Calendar}
              label="Target Completion"
              value={formatDate(ticket.target_completion)}
            />
            <InfoRow
              icon={Clock}
              label="Created"
              value={formatDateTime(ticket.created_at)}
            />
            <InfoRow
              icon={Clock}
              label="Last Updated"
              value={formatDateTime(ticket.updated_at)}
            />
            {ticket.closed_at && (
              <InfoRow
                icon={Clock}
                label="Closed At"
                value={formatDateTime(ticket.closed_at)}
              />
            )}
          </CardContent>
        </Card>

        {/* ── Timeline ──────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Ticket Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeline.length > 0 ? (
              <TicketTimeline
                timeline={timeline}
                currentStatus={ticket.current_status}
                requiresParts={ticket.requires_parts}
                assignedEngineerName={ticket.assigned_engineer?.name ?? null}
              />
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                No timeline entries yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <TicketEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        ticket={ticket}
        onSaved={onTransitioned}
      />
    </div>
  );
}
