import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpDown, UserPlus, Eye, ArrowRight, Loader2, ChevronDown, MessageSquare, Clock, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/workflow/StatusBadge";
import { AssignEngineerDialog } from "./AssignEngineerDialog";
import { TransitionDialog } from "@/components/workflow/TransitionDialog";
import { WORKFLOW_TRANSITIONS, STATUS_CONFIG, DEFAULT_SLAS, formatDuration } from "@/lib/workflow";
import { cn } from "@/lib/utils";
import { transitionTicket } from "@/api/tickets";
import { toast } from "@/components/ui/use-toast";
import { extractApiError } from "@/api/client";
import { formatDate } from "@/lib/utils";
import { SERVICE_TYPE_LABELS } from "@/types";
import type { Ticket, PaginationMeta, TicketStatus, AvailableTransition } from "@/types";

interface TicketsTableProps {
  data: Ticket[];
  loading: boolean;
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onSort: (field: string) => void;
  onRefresh?: () => void;
}

export function TicketsTable({
  data,
  loading,
  pagination,
  onPageChange,
  onSort,
  onRefresh,
}: TicketsTableProps) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignTicketId, setAssignTicketId] = useState<number>(0);
  const [assignTicketRegion, setAssignTicketRegion] = useState<string | undefined>(undefined);
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [selectedTransition, setSelectedTransition] = useState<AvailableTransition | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<number>(0);
  const [transitioning, setTransitioning] = useState<number | null>(null);

  const getTransitions = (status: TicketStatus) => {
    const defs = WORKFLOW_TRANSITIONS[status] || [];
    return defs.map((d) => ({
      to_status: d.to as TicketStatus,
      label: d.label,
      requires_comment: d.requiresComment,
    }));
  };

  const handleQuickTransition = async (ticketId: number, toStatus: TicketStatus) => {
    setTransitioning(ticketId);
    try {
      await transitionTicket(ticketId, { to_status: toStatus });
      toast({ title: `Ticket moved to ${STATUS_CONFIG[toStatus]?.label || toStatus}` });
      onRefresh?.();
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    } finally {
      setTransitioning(null);
    }
  };

  const handleTransitionWithComment = (ticketId: number, transition: AvailableTransition) => {
    setSelectedTicketId(ticketId);
    setSelectedTransition(transition);
    setTransitionDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    );
  }

  const start = (pagination.page - 1) * pagination.per_page + 1;
  const end = Math.min(pagination.page * pagination.per_page, pagination.total);

  return (
    <div>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
              <TableHead>
                <button onClick={() => onSort("ticket_number")} className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200">
                  UID <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead>Work Order</TableHead>
              <TableHead>Case ID</TableHead>
              <TableHead>
                <button onClick={() => onSort("cust_name")} className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200">
                  Customer <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Warranty</TableHead>
              <TableHead>Complaint</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Delay / SLA</TableHead>
              <TableHead>Engineer</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-32 text-center text-slate-500 dark:text-slate-400">
                  No tickets found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((ticket, i) => {
                const transitions = getTransitions(ticket.current_status);
                const isTransitioning = transitioning === ticket.id;
                const warrantyLabel = SERVICE_TYPE_LABELS[ticket.service_type] || ticket.service_type;

                return (
                  <motion.tr
                    key={ticket.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* UID */}
                    <TableCell className="font-mono text-xs font-medium">
                      <Link to={`/tickets/${ticket.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                        {ticket.ticket_number}
                      </Link>
                    </TableCell>

                    {/* Work Order */}
                    <TableCell>
                      <span className="text-sm">{ticket.work_order || <span className="text-slate-400 italic">—</span>}</span>
                    </TableCell>

                    {/* Case ID */}
                    <TableCell>
                      <span className="text-sm font-medium">{ticket.case_id || <span className="text-slate-400 italic">—</span>}</span>
                    </TableCell>

                    {/* Customer Name / Number */}
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{ticket.cust_name}</p>
                        {ticket.cust_contact && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{ticket.cust_contact}</p>
                        )}
                      </div>
                    </TableCell>

                    {/* Location */}
                    <TableCell>
                      <span className="text-sm">{ticket.location || <span className="text-slate-400 italic">—</span>}</span>
                    </TableCell>

                    {/* Warranty Status */}
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        ticket.service_type === "warranty"
                          ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                      }`}>
                        {warrantyLabel}
                      </span>
                    </TableCell>

                    {/* Complaint (truncated) */}
                    <TableCell className="max-w-[200px]">
                      <p className="text-sm text-slate-600 dark:text-slate-300 truncate" title={ticket.issue_description}>
                        {ticket.issue_description || <span className="text-slate-400 italic">—</span>}
                      </p>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <StatusBadge status={ticket.current_status} />
                    </TableCell>

                    {/* Delay / SLA */}
                    <TableCell>
                      {ticket.current_status === "closed" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <CheckCircle2 className="w-3 h-3" /> Closed
                        </span>
                      ) : (() => {
                        const elapsed = ticket.current_stage_elapsed_mins ?? 0;
                        const sla = DEFAULT_SLAS.find((s) => s.status === ticket.current_status);
                        const slaMin = sla?.sla_minutes ?? 0;
                        const isBreached = slaMin > 0 && elapsed > slaMin;
                        const isWarning = slaMin > 0 && !isBreached && elapsed > slaMin * 0.75;
                        const delayMin = isBreached ? elapsed - slaMin : 0;
                        const totalDelay = ticket.total_delay_mins ?? 0;

                        return (
                          <div className="space-y-1">
                            {/* Current stage elapsed */}
                            <div className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                              isBreached
                                ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                                : isWarning
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                                  : "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                            )}>
                              {isBreached ? (
                                <AlertCircle className="w-3 h-3" />
                              ) : isWarning ? (
                                <AlertTriangle className="w-3 h-3" />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )}
                              {formatDuration(elapsed)}
                              {slaMin > 0 && (
                                <span className="opacity-70">/ {formatDuration(slaMin)}</span>
                              )}
                            </div>

                            {/* Breach detail */}
                            {isBreached && (
                              <p className="text-[10px] font-medium text-red-600 dark:text-red-400">
                                {formatDuration(delayMin)} overdue
                              </p>
                            )}

                            {/* Total accumulated delay */}
                            {totalDelay > 0 && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                Total delay: {formatDuration(totalDelay)}
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>

                    {/* Engineer (Assignee) */}
                    <TableCell>
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {ticket.assigned_engineer?.name ?? (
                          <span className="text-slate-400 dark:text-slate-500 italic">Unassigned</span>
                        )}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {ticket.current_status === "cso_created" && (
                          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => { setAssignTicketId(ticket.id); setAssignTicketRegion(ticket.region); setAssignDialogOpen(true); }}>
                            <UserPlus className="w-3.5 h-3.5" /> Assign
                          </Button>
                        )}

                        {ticket.current_status !== "cso_created" && transitions.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" className="gap-1 text-xs" disabled={isTransitioning}>
                                {isTransitioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                                Next Step <ChevronDown className="w-3 h-3 ml-0.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              {transitions.map((t) => (
                                <DropdownMenuItem
                                  key={t.to_status}
                                  className="cursor-pointer gap-2 text-sm"
                                  onClick={() => t.requires_comment ? handleTransitionWithComment(ticket.id, t) : handleQuickTransition(ticket.id, t.to_status)}
                                >
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_CONFIG[t.to_status]?.dotClass || "bg-slate-400"}`} />
                                  {t.label}
                                  {t.requires_comment && <MessageSquare className="w-3 h-3 ml-auto text-slate-400" />}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}

                        <Link to={`/tickets/${ticket.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1 text-xs">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-500 dark:text-slate-400">
          <span>Showing {start}–{end} of {pagination.total}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page <= 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page >= pagination.pages}>Next</Button>
          </div>
        </div>
      )}

      <AssignEngineerDialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen} ticketId={assignTicketId} ticketRegion={assignTicketRegion as any} onSuccess={() => onRefresh?.()} />

      {selectedTransition && (
        <TransitionDialog
          open={transitionDialogOpen}
          onOpenChange={setTransitionDialogOpen}
          ticketId={selectedTicketId}
          transition={selectedTransition}
          onSuccess={() => { setTransitionDialogOpen(false); setSelectedTransition(null); onRefresh?.(); }}
        />
      )}
    </div>
  );
}
