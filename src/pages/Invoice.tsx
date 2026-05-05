import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Receipt, AlertCircle, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvoicesToolbar } from "@/components/invoices/InvoicesToolbar";
import { InvoicesTable } from "@/components/invoices/InvoicesTable";
import { InvoiceFormDialog } from "@/components/invoices/InvoiceFormDialog";
import { useInvoices } from "@/hooks/useInvoices";
import { toast } from "@/components/ui/use-toast";
import { sendInvoice, markInvoicePaid } from "@/api/invoices";
import { extractApiError } from "@/api/client";
import type { InvoiceStatus } from "@/types";

export default function Invoice() {
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const filters = useMemo(
    () => ({
      status: status !== "all" ? (status as InvoiceStatus) : undefined,
      page,
      per_page: 20,
    }),
    [status, page],
  );

  const { data, loading, error, pagination, refetch } = useInvoices(filters);

  const hasActiveFilters = status !== "all";

  const handleClearFilters = () => {
    setStatus("all");
    setPage(1);
  };

  const handleSend = async (id: number | string) => {
    try {
      await sendInvoice(id);
      toast({ title: "Invoice sent successfully" });
      refetch();
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    }
  };

  const handleMarkPaid = async (
    id: number | string,
    payload: { payment_method: string; paid_amount: number },
  ) => {
    try {
      await markInvoicePaid(id, payload);
      toast({ title: "Invoice marked as paid" });
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
          <p className="text-slate-800 dark:text-slate-100 font-medium mb-2">
            Failed to load invoices
          </p>
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Invoices
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage and track invoices.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Invoice
        </Button>
      </div>

      <InvoicesToolbar
        status={status}
        onStatusChange={(v) => { setStatus(v); setPage(1); }}
        onAdd={() => setIsFormOpen(true)}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {!loading && data.length === 0 ? (
        <Card className="p-12 text-center">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-800 dark:text-slate-100 font-medium mb-1">
            No invoices yet
          </p>
          <p className="text-sm text-slate-500 mb-4">
            Invoices will be generated from approved quotations.
          </p>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Create First Invoice
          </Button>
        </Card>
      ) : (
        <InvoicesTable
          data={data}
          loading={loading}
          pagination={pagination}
          onPageChange={setPage}
          onSend={handleSend}
          onMarkPaid={handleMarkPaid}
        />
      )}

      <InvoiceFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} />
    </motion.div>
  );
}

