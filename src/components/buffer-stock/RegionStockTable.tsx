import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Plus, MapPin, Globe, AlertTriangle } from "lucide-react";
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
import { useAuthStore } from "@/store/authStore";
import { getBufferStockItems } from "@/api/bufferStock";
import { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import { REGION_LABELS } from "@/types";
import { BUFFER_CATEGORY_LABELS } from "@/types/bufferStock";
import type { BufferStockItem, BufferStockFilters } from "@/types/bufferStock";
import type { PaginationMeta, Region } from "@/types";
import { StockItemFormDialog } from "./StockItemFormDialog";

export function RegionStockTable() {
  const user = useAuthStore((s) => s.user);
  const [viewMode, setViewMode] = useState<"my_region" | "overall">("my_region");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<BufferStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({ total: 0, page: 1, per_page: 20, pages: 1 });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BufferStockItem | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const filters: BufferStockFilters = {
        view: viewMode,
        search: debouncedSearch || undefined,
        category: (category || undefined) as BufferStockFilters["category"],
        page,
        per_page: 20,
      };
      const res = await getBufferStockItems(filters);
      setData(res.items);
      setPagination({ total: res.total, page: res.page, per_page: res.per_page, pages: res.pages });
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [viewMode, debouncedSearch, category, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const start = (pagination.page - 1) * pagination.per_page + 1;
  const end = Math.min(pagination.page * pagination.per_page, pagination.total);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* View mode toggle */}
        <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => { setViewMode("my_region"); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
              viewMode === "my_region"
                ? "bg-indigo-600 text-white"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <MapPin className="w-4 h-4" />
            My Region {user?.region ? `(${REGION_LABELS[user.region as Region] || user.region})` : ""}
          </button>
          <button
            onClick={() => { setViewMode("overall"); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
              viewMode === "overall"
                ? "bg-indigo-600 text-white"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Globe className="w-4 h-4" />
            Overall Stock
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search parts..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>

        <Select value={category} onValueChange={(v) => { setCategory(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(BUFFER_CATEGORY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="gap-2 ml-auto">
          <Plus className="w-4 h-4" /> Add Stock
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : data.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-slate-500">No buffer stock items found.</p>
        </Card>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                  <TableHead>Part Number</TableHead>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-center">On Hand</TableHead>
                  <TableHead className="text-center">Reserved</TableHead>
                  <TableHead className="text-center">Available</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, i) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <TableCell className="font-mono text-sm font-medium">{item.part_number}</TableCell>
                    <TableCell>{item.part_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{item.category_display}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.region_display}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-semibold">{item.qty_on_hand}</TableCell>
                    <TableCell className="text-center">{item.qty_reserved}</TableCell>
                    <TableCell className="text-center">
                      <span className={item.qty_available <= item.reorder_level ? "text-red-600 font-bold" : ""}>
                        {item.qty_available}
                      </span>
                      {item.qty_available <= item.reorder_level && (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 inline ml-1" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => { setEditing(item); setFormOpen(true); }}
                      >
                        Edit
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

      <StockItemFormDialog
        open={formOpen}
        onOpenChange={(v) => { if (!v) { setFormOpen(false); setEditing(null); } }}
        editing={editing}
        onSuccess={fetchData}
      />
    </div>
  );
}
