import { Pencil, Trash2, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  const start = (pagination.page - 1) * pagination.per_page + 1;
  const end = Math.min(pagination.page * pagination.per_page, pagination.total);

  return (
    <div>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Customer & Case No.</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Contact Info</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Region</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">CSO Status</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Total Transactions</TableHead>
              {isAdmin && <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-right pr-6">Actions</TableHead>}
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
              data.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  {/* Name & Ticket Details */}
                  <TableCell className="py-4">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        {c.name || <span className="text-slate-400 italic">No Name</span>}
                      </p>
                      {c.ticket_number && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 font-mono text-[11px] text-slate-400">
                          <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">
                            Ticket: {c.ticket_number}
                          </span>
                          {c.form_number && (
                            <span className="bg-indigo-50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400">
                              Form: {c.form_number}
                            </span>
                          )}
                          {c.company && (
                            <span className="text-slate-400 font-sans italic">({c.company})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Contact Info */}
                  <TableCell className="py-4 text-sm">
                    <div className="space-y-0.5 text-slate-600 dark:text-slate-400">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{c.phone || <span className="text-slate-400 italic">—</span>}</p>
                      {c.email && <p className="text-xs text-slate-400 dark:text-slate-500">{c.email}</p>}
                    </div>
                  </TableCell>

                  {/* Region Badge */}
                  <TableCell className="py-4">
                    {c.region ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-900/50">
                        <MapPin className="w-3 h-3 text-indigo-500" />
                        {REGION_LABELS[c.region as Region] || c.region}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Vellore</span>
                    )}
                  </TableCell>

                  {/* CSO Status Badge */}
                  <TableCell className="py-4">
                    {c.status ? (
                      <StatusBadge status={c.status} />
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        cso_created
                      </span>
                    )}
                  </TableCell>

                  {/* Transactions / Cases Count */}
                  <TableCell className="py-4">
                    <Badge variant="secondary" className="font-semibold text-slate-600 dark:text-slate-300">
                      {c.total_transactions || 1} {c.total_transactions === 1 ? "Case" : "Cases"}
                    </Badge>
                  </TableCell>

                  {/* Actions scoped to Admin/Manager */}
                  {isAdmin && (
                    <TableCell className="py-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(c)}
                          className="h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(c)}
                          className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
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
