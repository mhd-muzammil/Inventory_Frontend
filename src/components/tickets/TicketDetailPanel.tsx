import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/workflow/StatusBadge";
import { PriorityBadge } from "@/components/workflow/PriorityBadge";
import { DelayIndicator } from "@/components/workflow/DelayIndicator";
import { TransitionActions } from "@/components/workflow/TransitionActions";
import { TicketTimeline } from "@/components/workflow/TicketTimeline";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  Hash,
  Wrench,
  Calendar,
  Clock,
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
  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {ticket.ticket_number}
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
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              />
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                No timeline entries yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
