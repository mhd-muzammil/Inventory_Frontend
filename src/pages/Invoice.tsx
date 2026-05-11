import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Receipt, AlertCircle, Plus, Trash2, FileText, Download } from "lucide-react";
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
  const [activeStyle, setActiveStyle] = useState<"classic" | "orange">("classic");
  const [localInvoices, setLocalInvoices] = useState<any[]>(() => {
    const saved = localStorage.getItem("localInvoices");
    return saved ? JSON.parse(saved) : [];
  });

  const [editingInvoice, setEditingInvoice] = useState<any>(null);

  const handleSaveLocalInvoice = async (invoiceData: any) => {
    const newList = [invoiceData, ...localInvoices];
    setLocalInvoices(newList);
    localStorage.setItem("localInvoices", JSON.stringify(newList));
    toast({ title: "Invoice saved successfully locally!" });
  };

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
      <div className="mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Invoices
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage and track invoices.
          </p>
        </div>
      </div>

      <InvoicesToolbar
        status={status}
        onStatusChange={(v) => { setStatus(v); setPage(1); }}
        onAddClassic={() => { setEditingInvoice(null); setActiveStyle("classic"); setIsFormOpen(true); }}
        onAddOrange={() => { setEditingInvoice(null); setActiveStyle("orange"); setIsFormOpen(true); }}
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

      {localInvoices.length > 0 && (
        <div className="mt-12 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Manually Created Invoices
          </h3>
          <Card className="p-4 bg-white dark:bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 text-xs">
                    <th className="p-2">Inv No</th>
                    <th className="p-2">Customer</th>
                    <th className="p-2">Issue Date</th>
                    <th className="p-2">Due Date</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-200 text-xs">
                  {localInvoices.map((inv: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2 font-medium text-slate-900 dark:text-white">{inv.invoiceNumber}</td>
                      <td className="p-2">{inv.billToName}</td>
                      <td className="p-2">{inv.issueDate}</td>
                      <td className="p-2">{inv.dueDate}</td>
                      <td className="p-2 text-right font-semibold">
                        ₹{Number(inv.overallTotal).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-2 text-right flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-2"
                          onClick={() => {
                            setEditingInvoice(inv);
                            setActiveStyle(inv.style || "classic");
                            setIsFormOpen(true);
                          }}
                        >
                          <Download className="w-3.5 h-3.5 mr-1" /> Download
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 px-2"
                          onClick={() => {
                            const updated = localInvoices.filter((_: any, idx: number) => idx !== i);
                            setLocalInvoices(updated);
                            localStorage.setItem("localInvoices", JSON.stringify(updated));
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      <InvoiceFormDialog 
        key={isFormOpen ? (editingInvoice ? `edit-${editingInvoice.invoiceNumber}` : `new-${activeStyle}`) : "inactive"} 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        initialStyle={activeStyle}
        initialData={editingInvoice}
        onSubmitInvoice={handleSaveLocalInvoice}
      />
    </motion.div>
  );
}

