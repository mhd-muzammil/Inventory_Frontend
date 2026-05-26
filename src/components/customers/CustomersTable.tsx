import { Edit, Trash2, History } from "lucide-react";
import { Link } from "react-router-dom";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/workflow/StatusBadge";
import { useAuthStore } from "@/store/authStore";
import { REGION_LABELS } from "@/types";
import type { Customer, PaginationMeta, Region } from "@/types";

interface CustomersTableProps {
  data: Customer[];
  loading: boolean;
  pagination: PaginationMeta;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onPageChange: (page: number) => void;
}

export function CustomersTable({ data, loading, pagination, onEdit, onDelete, onPageChange }: CustomersTableProps) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin" || user?.role === "super_admin" || user?.role === "manager";

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Customer & Case No.</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Contact Info</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Region</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">CSO Status</TableHead>
              <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300">History</TableHead>
              {isAdmin && <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: isAdmin ? 6 : 5 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  const start = (pagination.page - 1) * pagination.per_page + 1;
  const end = Math.min(pagination.page * pagination.per_page, pagination.total);

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Customer & Case No.</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Contact Info</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Region</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">CSO Status</TableHead>
                <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300">History</TableHead>
                {isAdmin && <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="h-32 text-center text-slate-400 dark:text-slate-500">
                    No customer records found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((c) => (
                  <TableRow
                    key={c.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Name & Ticket Details */}
                    <TableCell>
                      <div className="font-medium text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">
                        {c.name || <span className="text-slate-400 italic">No Name</span>}
                      </div>
                      {c.ticket_number && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 font-mono text-[11px] text-slate-500">
                          <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 font-semibold">
                            Ticket: {c.ticket_number}
                          </span>
                          {c.form_number && (
                            <span className="bg-indigo-50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-semibold">
                              Form: {c.form_number}
                            </span>
                          )}
                          {c.company && (
                            <span className="text-slate-400 dark:text-slate-500 font-sans italic">({c.company})</span>
                          )}
                        </div>
                      )}
                    </TableCell>

                    {/* Contact Info */}
                    <TableCell className="text-sm">
                      <div className="text-slate-900 dark:text-slate-100 font-medium">
                        {c.phone || <span className="text-slate-400 italic">—</span>}
                      </div>
                      {c.email && (
                        <div className="text-xs text-slate-500">{c.email}</div>
                      )}
                    </TableCell>

                    {/* Region Badge */}
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-fit">
                        {REGION_LABELS[c.region as Region] || c.region || "No Region"}
                      </span>
                    </TableCell>

                    {/* CSO Status Badge */}
                    <TableCell>
                      {c.status ? (
                        <StatusBadge status={c.status} />
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          cso_created
                        </span>
                      )}
                    </TableCell>

                    {/* Case History Link */}
                    <TableCell className="text-center">
                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                      >
                        <Link to={`/tickets/${c.id}`}>
                          History
                        </Link>
                      </Button>
                    </TableCell>

                    {/* Actions scoped to Admin/Manager */}
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(c)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(c)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {pagination.total > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-500 dark:text-slate-400">
          <span>Showing {start}-{end} of {pagination.total}</span>
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
    </div>
  );
}
