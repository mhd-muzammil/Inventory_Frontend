import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { POToolbar } from "@/components/purchase-orders/POToolbar";
import { POTable } from "@/components/purchase-orders/POTable";
import { POFormDialog } from "@/components/purchase-orders/POFormDialog";
import { POReceiveDialog } from "@/components/purchase-orders/POReceiveDialog";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { toast } from "@/components/ui/use-toast";
import { sendPurchaseOrder, receivePurchaseOrder } from "@/api/purchaseOrders";
import { extractApiError } from "@/api/client";
import type { POStatus, PurchaseOrder as POType } from "@/types";

export default function PurchaseOrder() {
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  // Dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [receivePO, setReceivePO] = useState<POType | null>(null);

  const filters = useMemo(
    () => ({
      status: status !== "all" ? (status as POStatus) : undefined,
      page,
      per_page: 20,
    }),
    [status, page],
  );

  const { data, loading, error, pagination, refetch } = usePurchaseOrders(filters);

  const hasActiveFilters = status !== "all";

  const handleClearFilters = () => {
    setStatus("all");
    setPage(1);
  };

  const handleSend = async (id: number | string) => {
    try {
      await sendPurchaseOrder(id);
      toast({ title: "Purchase order sent to supplier" });
      refetch();
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    }
  };

  const handleReceiveClick = (id: number | string) => {
    const po = data.find((d) => d.id === id);
    if (po) setReceivePO(po);
  };

  const handleReceive = async (
    id: number | string,
    items: { po_item_id: number; received_qty: number }[],
  ) => {
    try {
      await receivePurchaseOrder(id, items);
      toast({ title: "Items received — stock updated automatically" });
      refetch();
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-800 dark:text-slate-100 font-medium mb-2">Failed to load purchase orders</p>
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
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Purchase Orders</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Create and manage purchase orders for parts.</p>
      </div>

      <POToolbar
        status={status}
        onStatusChange={(v) => { setStatus(v); setPage(1); }}
        onAdd={() => setAddDialogOpen(true)}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {!loading && data.length === 0 ? (
        <Card className="p-12 text-center">
          <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-800 dark:text-slate-100 font-medium mb-1">No purchase orders</p>
          <p className="text-sm text-slate-500 mb-4">Create a purchase order to start ordering parts.</p>
          <Button onClick={() => setAddDialogOpen(true)}>Create Purchase Order</Button>
        </Card>
      ) : (
        <POTable
          data={data}
          loading={loading}
          pagination={pagination}
          onPageChange={setPage}
          onSend={handleSend}
          onReceive={(id) => handleReceiveClick(id)}
        />
      )}

      {/* Dialogs */}
      <POFormDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onSuccess={refetch} />

      <POReceiveDialog
        open={!!receivePO}
        onOpenChange={(v) => { if (!v) setReceivePO(null); }}
        purchaseOrder={receivePO}
        onReceive={handleReceive}
      />
    </motion.div>
  );
}
