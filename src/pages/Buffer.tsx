import { useState } from "react";
import { motion } from "framer-motion";
import { Layers, AlertCircle, Plus, Search, MapPin, Globe, BarChart3, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BufferTable } from "@/components/buffer/BufferTable";
import { BufferFormDialog } from "@/components/buffer/BufferFormDialog";
import { getBufferParts, deleteBufferPart, getBufferPartSummary } from "@/api/bufferParts";
import type { BufferPartSummary } from "@/api/bufferParts";
import { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuthStore } from "@/store/authStore";
import { REGION_LABELS } from "@/types";
import type { BufferPart, PaginationMeta, Region } from "@/types";
import { useEffect, useCallback } from "react";

export default function Buffer() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin" || user?.role === "super_admin" || user?.role === "manager";
  const showToggle = !isAdmin && !!user?.region;
  
  const [viewMode, setViewMode] = useState<"my_region" | "overall">(showToggle ? "my_region" : "overall");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<BufferPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({ total: 0, page: 1, per_page: 20, pages: 1 });

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BufferPart | null>(null);

  // Summary state
  const [summary, setSummary] = useState<BufferPartSummary | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const fetchSummary = useCallback(async () => {
    try {
      const apiView = isAdmin ? "overall" : viewMode;
      const apiRegion = isAdmin && selectedRegion !== "all" ? selectedRegion : undefined;
      const res = await getBufferPartSummary(apiView, apiRegion);
      setSummary(res);
    } catch {
      // silent — summary is supplementary
    }
  }, [viewMode, isAdmin, selectedRegion]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiView = isAdmin ? "overall" : viewMode;
      const apiRegion = isAdmin && selectedRegion !== "all" ? selectedRegion : undefined;
      const res = await getBufferParts({
        search: debouncedSearch || undefined,
        view: apiView,
        region: apiRegion,
        page,
        per_page: 20,
      });
      setData(res.items);
      setPagination({ total: res.total, page: res.page, per_page: res.per_page, pages: res.pages });
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, viewMode, page, isAdmin, selectedRegion]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const handleMutated = () => {
    fetchData();
    fetchSummary();
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteBufferPart(id);
      toast({ title: "Buffer part deleted" });
      handleMutated();
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-800 dark:text-slate-100 font-medium mb-2">Failed to load buffer parts</p>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <Button onClick={fetchData}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Buffer</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage buffer parts inventory.</p>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────── */}
      {summary && summary.regions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          {summary.regions.map((r) => (
            <Card
              key={r.region}
              className="p-4 flex flex-col items-center gap-1 border border-slate-200 dark:border-slate-700"
            >
              <MapPin className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {REGION_LABELS[r.region as Region] || r.region}
              </span>
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{r.total}</span>
            </Card>
          ))}
          <Card className="p-4 flex flex-col items-center gap-1 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
            <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
              Total
            </span>
            <span className="text-xl font-bold text-indigo-700 dark:text-indigo-300">{summary.total}</span>
          </Card>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {showToggle && (
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
              My Region ({REGION_LABELS[user!.region as Region] || user!.region})
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
        )}

        {isAdmin && (
          <Select value={selectedRegion} onValueChange={(v) => { setSelectedRegion(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-44 bg-white dark:bg-slate-900">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {(Object.entries(REGION_LABELS) as [Region, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search parts..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2 ml-auto">
          <Plus className="w-4 h-4" /> Add Part
        </Button>
      </div>

      {!loading && data.length === 0 && !debouncedSearch ? (
        <Card className="p-12 text-center">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-800 dark:text-slate-100 font-medium mb-1">No buffer parts</p>
          <p className="text-sm text-slate-500 mb-4">Add parts to the buffer to get started.</p>
          <Button onClick={() => setAddDialogOpen(true)}>Add Part</Button>
        </Card>
      ) : (
        <BufferTable
          data={data}
          loading={loading}
          pagination={pagination}
          onPageChange={setPage}
          onEdit={(item) => setEditingItem(item)}
          onDelete={handleDelete}
          onRowUpdated={(updated) => {
            setData((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
          }}
        />
      )}

      <BufferFormDialog
        open={addDialogOpen || !!editingItem}
        onOpenChange={(v) => { if (!v) { setAddDialogOpen(false); setEditingItem(null); } }}
        editing={editingItem}
        onSuccess={handleMutated}
      />
    </motion.div>
  );
}

