import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { getBufferCases } from "@/api/bufferStock";
import { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import {
  BUFFER_CASE_STATUS_LABELS, BUFFER_CASE_TYPE_LABELS,
  CASE_STATUS_COLORS,
} from "@/types/bufferStock";
import type { BufferCase, BufferCaseFilters, BufferCaseStatus, BufferCaseType } from "@/types/bufferStock";
import type { PaginationMeta } from "@/types";
import { BufferCaseFormDialog } from "./BufferCaseFormDialog";
import { CaseDetailDialog } from "./CaseDetailDialog";

export function BufferCaseTable() {
  const [search, setSearch] = useState("");
  const [caseType, setCaseType] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<BufferCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({ total: 0, page: 1, per_page: 20, pages: 1 });

  const [formOpen, setFormOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<BufferCase | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const filters: BufferCaseFilters = {
        search: debouncedSearch || undefined,
        case_type: (caseType || undefined) as BufferCaseType | undefined,
        status: (statusFilter || undefined) as BufferCaseStatus | undefined,
        page,
        per_page: 20,
      };
      const res = await getBufferCases(filters);
      setData(res.items);
      setPagination({ total: res.total, page: res.page, per_page: res.per_page, pages: res.pages });
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, caseType, statusFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const start = (pagination.page - 1) * pagination.per_page + 1;
  const end = Math.min(pagination.page * pagination.per_page, pagination.total);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search cases..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>

        <Select value={caseType} onValueChange={(v) => { setCaseType(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Case Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(BUFFER_CASE_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(BUFFER_CASE_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => setFormOpen(true)} className="gap-2 ml-auto">
          <Plus className="w-4 h-4" /> New Case
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : data.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-slate-500">No buffer cases found.</p>
        </Card>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                  <TableHead>Case #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Part</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Engineer</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <TableCell className="font-mono text-sm font-medium">
                      {c.case_number}
                      {c.case_id && (
                        <span className="block text-xs text-slate-400">HP: {c.case_id}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.case_type === "iw" ? "default" : "destructive"} className="text-xs">
                        {c.case_type_display}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${CASE_STATUS_COLORS[c.status] || ""}`}>
                        {c.status_display}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate">{c.customer_name}</TableCell>
                    <TableCell className="text-sm">
                      {c.part_number && <span className="font-mono">{c.part_number}</span>}
                      {c.part_name && <span className="block text-xs text-slate-400">{c.part_name}</span>}
                    </TableCell>
                    <TableCell><Badge variant="secondary">{c.region_display}</Badge></TableCell>
                    <TableCell className="text-sm">{c.assigned_engineer_name || "—"}</TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {new Date(c.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedCase(c)} className="gap-1">
                        <Eye className="w-3.5 h-3.5" /> View
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>

          {pagination.total > 0 && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Showing {start}–{end} of {pagination.total}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= pagination.pages}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      <BufferCaseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={fetchData}
      />

      <CaseDetailDialog
        bufferCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        onRefresh={fetchData}
      />
    </div>
  );
}
