import { motion } from "framer-motion";
import { BoxesIcon, Pencil, Trash2 } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import type { BufferPart, PaginationMeta } from "@/types";

interface BufferTableProps {
  data: BufferPart[];
  loading: boolean;
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onEdit: (item: BufferPart) => void;
  onDelete: (id: number) => void;
}

export function BufferTable({ data, loading, pagination, onPageChange, onEdit, onDelete }: BufferTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <BoxesIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
          No buffer parts found
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Add parts to the buffer to get started.
        </p>
      </Card>
    );
  }

  const start = (pagination.page - 1) * pagination.per_page + 1;
  const end = Math.min(pagination.page * pagination.per_page, pagination.total);

  return (
    <div>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
              <TableHead className="w-12">S.No</TableHead>
              <TableHead>Part Number</TableHead>
              <TableHead>Part Name</TableHead>
              <TableHead>General Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((entry, i) => (
              <motion.tr
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                  {(pagination.page - 1) * pagination.per_page + i + 1}
                </TableCell>
                <TableCell className="font-mono text-sm font-medium">
                  {entry.part_number}
                </TableCell>
                <TableCell>{entry.part_name}</TableCell>
                <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                  {entry.general_name || <span className="text-slate-400 italic">—</span>}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{entry.quantity}</Badge>
                </TableCell>
                <TableCell>
                  {entry.region_display ? (
                    <Badge variant="outline">{entry.region_display}</Badge>
                  ) : (
                    <span className="text-slate-400 italic">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(entry)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => onDelete(entry.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
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
    </div>
  );
}
