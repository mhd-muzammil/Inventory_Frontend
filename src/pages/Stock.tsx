import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Warehouse, AlertCircle, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StockToolbar } from "@/components/stock/StockToolbar";
import { StockTable } from "@/components/stock/StockTable";
import { StockFormDialog } from "@/components/stock/StockFormDialog";
import { StockAdjustDialog } from "@/components/stock/StockAdjustDialog";
import { useStock } from "@/hooks/useStock";
import { useDebounce } from "@/hooks/useDebounce";
import { getLowStock } from "@/api/stock";
import type { StockItem } from "@/types";

export default function Stock() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  // Dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [adjustItem, setAdjustItem] = useState<StockItem | null>(null);

  // Low stock alert
  const [lowStockCount, setLowStockCount] = useState(0);

  const debouncedSearch = useDebounce(search, 400);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      category: category !== "all" ? category : undefined,
      low_stock_only: lowStockOnly || undefined,
      page,
      per_page: 20,
    }),
    [debouncedSearch, category, lowStockOnly, page],
  );

  const { data, loading, error, pagination, refetch } = useStock(filters);

  // Fetch low stock count on mount and after changes
  useEffect(() => {
    getLowStock().then((items) => setLowStockCount(items.length)).catch(() => {});
  }, [data]);

  const hasActiveFilters = search !== "" || category !== "all" || lowStockOnly;

  const handleClearFilters = () => {
    setSearch("");
    setCategory("all");
    setLowStockOnly(false);
    setPage(1);
  };

  const handleEdit = (id: number | string) => {
    const item = data.find((d) => d.id === id);
    if (item) setEditingItem(item);
  };

  const handleAdjust = (id: number | string) => {
    const item = data.find((d) => d.id === id);
    if (item) setAdjustItem(item);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-800 dark:text-slate-100 font-medium mb-2">Failed to load stock</p>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Stock</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Monitor and manage inventory stock levels.</p>
      </div>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {lowStockCount} item{lowStockCount !== 1 ? "s" : ""} below reorder level
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Review and reorder to avoid service delays.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
            onClick={() => { setLowStockOnly(true); setPage(1); }}
          >
            View Low Stock
          </Button>
        </div>
      )}

      <StockToolbar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        category={category}
        onCategoryChange={(v) => { setCategory(v); setPage(1); }}
        lowStockOnly={lowStockOnly}
        onLowStockToggle={(v) => { setLowStockOnly(v); setPage(1); }}
        onAdd={() => setAddDialogOpen(true)}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        categories={[]}
      />

      {!loading && data.length === 0 ? (
        <Card className="p-12 text-center">
          <Warehouse className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-800 dark:text-slate-100 font-medium mb-1">No stock items</p>
          <p className="text-sm text-slate-500 mb-4">Stock items will appear here once added.</p>
          <Button onClick={() => setAddDialogOpen(true)}>Add Stock Item</Button>
        </Card>
      ) : (
        <StockTable
          data={data}
          loading={loading}
          pagination={pagination}
          onPageChange={setPage}
          onEdit={handleEdit}
          onAdjust={handleAdjust}
        />
      )}

      {/* Dialogs */}
      <StockFormDialog
        open={addDialogOpen || !!editingItem}
        onOpenChange={(v) => { if (!v) { setAddDialogOpen(false); setEditingItem(null); } }}
        editing={editingItem}
        onSuccess={refetch}
      />

      <StockAdjustDialog
        open={!!adjustItem}
        onOpenChange={(v) => { if (!v) setAdjustItem(null); }}
        stockItem={adjustItem}
        onSuccess={refetch}
      />
    </motion.div>
  );
}
