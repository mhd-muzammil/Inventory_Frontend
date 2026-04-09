import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Layers, AlertCircle, Plus, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BufferTable } from "@/components/buffer/BufferTable";
import { BufferFormDialog } from "@/components/buffer/BufferFormDialog";
import { getBufferParts, deleteBufferPart } from "@/api/bufferParts";
import { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import type { BufferPart, PaginationMeta } from "@/types";
import { useEffect, useCallback } from "react";

export default function Buffer() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<BufferPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({ total: 0, page: 1, per_page: 20, pages: 1 });

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BufferPart | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBufferParts({
        search: debouncedSearch || undefined,
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
  }, [debouncedSearch, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: number) => {
    try {
      await deleteBufferPart(id);
      toast({ title: "Buffer part deleted" });
      fetchData();
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

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search parts..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
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
        />
      )}

      <BufferFormDialog
        open={addDialogOpen || !!editingItem}
        onOpenChange={(v) => { if (!v) { setAddDialogOpen(false); setEditingItem(null); } }}
        editing={editingItem}
        onSuccess={fetchData}
      />
    </motion.div>
  );
}
