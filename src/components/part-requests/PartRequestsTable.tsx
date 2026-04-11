import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, PackageSearch, Check, X } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PartRequest, PaginationMeta, UserRole } from "@/types";
import { PART_REQUEST_STATUS_LABELS } from "@/types";

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

export function PartRequestsTable({
  data,
  loading,
  pagination,
  onPageChange,
  userRole,
  onApprove,
  onReject,
}: PartRequestsTableProps) {
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
                <TableCell className="font-mono text-sm">{pr.part_number}</TableCell>
                <TableCell>{pr.part_name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{pr.quantity}</Badge>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      urgencyStyles[pr.urgency]
                    )}
                  >
                    {pr.urgency.charAt(0).toUpperCase() + pr.urgency.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      statusStyles[pr.status]
                    )}
                  >
                    {PART_REQUEST_STATUS_LABELS[pr.status]}
                  </span>
                </TableCell>
                <TableCell>{pr.requested_by.full_name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {isManager && pr.status === "pending" ? (
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
                    ) : (
                      <span className="text-xs text-slate-400">--</span>
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
    </div>
  );
}
