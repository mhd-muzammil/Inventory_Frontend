import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, AlertCircle, Trash2, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuotationsToolbar } from "@/components/quotations/QuotationsToolbar";
import { QuotationsTable } from "@/components/quotations/QuotationsTable";
import { useQuotations } from "@/hooks/useQuotations";
import { toast } from "@/components/ui/use-toast";
import { sendQuotation, recordCustomerResponse } from "@/api/quotations";
import { extractApiError } from "@/api/client";
import { QuotationFormDialog } from "@/components/quotations/QuotationFormDialog";

export default function Quotation() {
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeStyle, setActiveStyle] = useState<"classic" | "orange">("classic");
  const [localQuotations, setLocalQuotations] = useState<any[]>(() => {
    const saved = localStorage.getItem("localQuotations");
    return saved ? JSON.parse(saved) : [];
  });

  const [editingQuotation, setEditingQuotation] = useState<any>(null);

  const handleSaveLocalQuotation = async (quotation: any) => {
    const newList = [quotation, ...localQuotations];
    setLocalQuotations(newList);
    localStorage.setItem("localQuotations", JSON.stringify(newList));
    toast({ title: "Quotation saved successfully!" });
  };

  const filters = useMemo(
    () => ({
      status: status !== "all" ? (status as QuotationStatus) : undefined,
      page,
      per_page: 20,
    }),
    [status, page],
  );

  const { data, loading, error, pagination, refetch } = useQuotations(filters);

  const hasActiveFilters = status !== "all";

  const handleClearFilters = () => {
    setStatus("all");
    setPage(1);
  };

  const handleSend = async (id: number | string) => {
    try {
      await sendQuotation(id);
      toast({ title: "Quotation sent successfully" });
      refetch();
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    }
  };

  const handleRecordResponse = async (
    id: number | string,
    response: "approved" | "rejected",
    reason?: string,
  ) => {
    try {
      await recordCustomerResponse(id, { response, reason });
      toast({
        title:
          response === "approved"
            ? "Customer approved the quotation"
            : "Customer rejected the quotation",
      });
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
            Failed to load quotations
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
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Quotations
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Create and manage quotations for service tickets.
        </p>
      </div>

      <QuotationsToolbar
        status={status}
        onStatusChange={(v) => { setStatus(v); setPage(1); }}
        onAddClassic={() => { setEditingQuotation(null); setActiveStyle("classic"); setOpenDialog(true); }}
        onAddOrange={() => { setEditingQuotation(null); setActiveStyle("orange"); setOpenDialog(true); }}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <QuotationFormDialog
        key={openDialog ? (editingQuotation ? `edit-${editingQuotation.quoteNumber}` : `new-${activeStyle}`) : "closed"}
        open={openDialog}
        onOpenChange={setOpenDialog}
        onSubmitQuotation={handleSaveLocalQuotation}
        initialStyle={activeStyle}
        initialData={editingQuotation}
      />

      {!loading && data.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-800 dark:text-slate-100 font-medium mb-1">
            No quotations yet
          </p>
          <p className="text-sm text-slate-500 mb-4">
            Quotations will appear here when created from approved part requests.
          </p>
        </Card>
      ) : (
        <QuotationsTable
          data={data}
          loading={loading}
          pagination={pagination}
          onPageChange={setPage}
          onSend={handleSend}
          onRecordResponse={handleRecordResponse}
        />
      )}

      {localQuotations.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Manually Created Quotations
          </h3>
          <Card className="p-4 bg-white dark:bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 text-xs">
                    <th className="p-2">Quote No</th>
                    <th className="p-2">Customer</th>
                    <th className="p-2">Issue Date</th>
                    <th className="p-2">Valid Until</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-200 text-xs">
                  {localQuotations.map((q: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2 font-medium text-slate-900 dark:text-white">{q.quoteNumber}</td>
                      <td className="p-2">{q.quoteToName}</td>
                      <td className="p-2">{q.issueDate}</td>
                      <td className="p-2">{q.validUntil}</td>
                      <td className="p-2 text-right font-semibold">
                        ₹{Number(q.overallTotal).toLocaleString("en-IN", {
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
                            setEditingQuotation(q);
                            setActiveStyle(q.style || "classic");
                            setOpenDialog(true);
                          }}
                        >
                          <Download className="w-3.5 h-3.5 mr-1" /> Download
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 px-2"
                          onClick={() => {
                            const updated = localQuotations.filter((_: any, idx: number) => idx !== i);
                            setLocalQuotations(updated);
                            localStorage.setItem("localQuotations", JSON.stringify(updated));
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
    </motion.div>
  );
}
