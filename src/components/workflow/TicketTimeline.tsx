import { cn } from "@/lib/utils";
import { formatDateTime, formatTimeAgo } from "@/lib/utils";
import { formatDuration, STATUS_CONFIG, getFullPath } from "@/lib/workflow";
import { StatusBadge } from "./StatusBadge";
import { Check, Circle, AlertCircle, Clock, User } from "lucide-react";
import type { TimelineEntry, TicketStatus } from "@/types";
import { ROLE_LABELS } from "@/types";

interface TicketTimelineProps {
  timeline: TimelineEntry[];
  currentStatus: TicketStatus;
  requiresParts: boolean;
  assignedEngineerName?: string | null;
  className?: string;
}

const PARTS_STATUSES = new Set<TicketStatus>([
  "part_requested", "part_approved", "quotation_sent", "cx_pending",
  "part_ordered", "part_received",
]);

export function TicketTimeline({ timeline, currentStatus, requiresParts, assignedEngineerName, className }: TicketTimelineProps) {
  // If current status is in the parts flow, force parts path even if flag is stale
  const needsParts = requiresParts || PARTS_STATUSES.has(currentStatus);
  const fullPath = getFullPath(needsParts);
  const currentIndex = fullPath.indexOf(currentStatus);

  return (
    <div className={cn("relative", className)}>
      <div className="space-y-0">
        {fullPath.map((status, idx) => {
          // Latest timeline entry for this status
          const entry = [...timeline].reverse().find((e) => e.to_status === status);
          // Position-based: before current = completed, at current = current, after = pending
          const isCurrent = status === currentStatus;
          const isCompleted = isCurrent ? false : (!!entry || (currentIndex >= 0 && idx < currentIndex));
          const isPending = !isCompleted && !isCurrent;
          const config = STATUS_CONFIG[status];

          return (
            <div key={status} className="relative flex gap-4">
              {/* Vertical line */}
              {idx < fullPath.length - 1 && (
                <div
                  className={cn(
                    "absolute left-[15px] top-8 w-0.5 bottom-0",
                    isCompleted
                      ? "bg-green-300 dark:bg-green-700"
                      : isCurrent
                        ? "bg-amber-300 dark:bg-amber-700"
                        : "bg-slate-200 dark:bg-slate-700",
                  )}
                />
              )}

              {/* Icon */}
              <div className="flex-shrink-0 relative z-10 mt-1">
                {isCompleted ? (
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                ) : isCurrent ? (
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", entry?.is_breached ? "bg-red-100 dark:bg-red-900" : "bg-blue-100 dark:bg-blue-900")}>
                    {entry?.is_breached ? (
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                    )}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className={cn("flex-1 pb-6 min-w-0", isPending && "opacity-50")}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("font-medium text-sm", isPending ? "text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-100")}>
                    {config.label}
                  </span>
                  {status === "assigned" && assignedEngineerName && !isPending && (
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full">
                      {assignedEngineerName}
                    </span>
                  )}
                  {isCurrent && <StatusBadge status={status} size="sm" />}
                  {entry?.is_breached && (
                    <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-full">
                      {formatDuration(entry.breach_minutes)} overdue
                    </span>
                  )}
                </div>

                {entry && (isCompleted || isCurrent) && (
                  <div className="mt-1 space-y-1">
                    {/* Actor + time */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <User className="w-3 h-3" />
                      <span>{entry.actor.full_name}</span>
                      <span className="text-slate-300 dark:text-slate-600">&middot;</span>
                      <span>{ROLE_LABELS[entry.actor.role]}</span>
                      <span className="text-slate-300 dark:text-slate-600">&middot;</span>
                      <span title={formatDateTime(entry.entered_at)}>{formatTimeAgo(entry.entered_at)}</span>
                    </div>

                    {/* Duration */}
                    {entry.duration_minutes != null && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>
                          Duration: {formatDuration(entry.duration_minutes)}
                          {entry.sla_minutes && (
                            <span className="text-slate-400 dark:text-slate-500"> / SLA: {formatDuration(entry.sla_minutes)}</span>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Comment */}
                    {entry.comment && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 mt-1 italic">
                        "{entry.comment}"
                      </p>
                    )}
                  </div>
                )}

                {isPending && (
                  <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Pending</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
