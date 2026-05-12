import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, AlertCircle, Trash2, Download, MapPin, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuotationsToolbar } from "@/components/quotations/QuotationsToolbar";
import { QuotationsTable } from "@/components/quotations/QuotationsTable";
import { useQuotations } from "@/hooks/useQuotations";
import { toast } from "@/components/ui/use-toast";
import { sendQuotation, recordCustomerResponse, getQuotationSummary } from "@/api/quotations";
import { extractApiError } from "@/api/client";
import { QuotationFormDialog } from "@/components/quotations/QuotationFormDialog";
import { useAuthStore } from "@/store/authStore";
import { REGION_LABELS } from "@/types";
import type { QuotationStatus, Region, QuotationSummary } from "@/types";
import { useEffect, useCallback } from "react";

export default function Quotation() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [status, setStatus] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState<Region | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeStyle, setActiveStyle] = useState<"classic" | "orange">("classic");
  
  const [summary, setSummary] = useState<QuotationSummary | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await getQuotationSummary();
      setSummary(res);
    } catch (err) {
      toast({ title: "Summary Load Failed", description: extractApiError(err), variant: "destructive" });
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const [localQuotations, setLocalQuotations] = useState<any[]>(() => {
    const saved = localStorage.getItem("localQuotations");
    return saved ? JSON.parse(saved) : [];
  });

  const [editingQuotation, setEditingQuotation] = useState<any>(null);

  const handleSaveLocalQuotation = async (quotation: any) => {
    // Ensure localId exists for reliable state management
    const targetId = quotation.localId || editingQuotation?.localId || Date.now().toString();
    const updatedQuotation = { 
      ...quotation, 
      localId: targetId,
      region: quotation.region || user?.region || "chennai" 
    };

    setLocalQuotations((prev) => {
      const idx = prev.findIndex((q) => q.localId === targetId);
      let newList;
      if (idx > -1) {
        // Replace existing entry instead of appending
        newList = [...prev];
        newList[idx] = updatedQuotation;
      } else {
        // New entry prepend
        newList = [updatedQuotation, ...prev];
      }
      localStorage.setItem("localQuotations", JSON.stringify(newList));
      return newList;
    });

    toast({ title: "Quotation saved successfully!" });
    fetchSummary(); 
  };

  const filters = useMemo(
    () => ({
      status: status !== "all" ? (status as QuotationStatus) : undefined,
      region: selectedRegion,
      page,
      per_page: 20,
    }),
    [status, selectedRegion, page],
  );

  // Utility: Detect region mapping for dashboard filtering and count distribution
  const inferRegion = useCallback((q: any): Region => {
    // 1. Use explicit region metadata (Primary)
    if (q.region) return q.region as Region;
    
    // 2. Only fallback to scan CUSTOMER address (Not sender address which lists all branches!)
    const text = (q.quoteToAddress || "").toLowerCase();
    if (text.includes("vellore")) return "vellore";
    if (text.includes("salem")) return "salem";
    if (text.includes("chennai")) return "chennai";
    if (text.includes("kanchipuram")) return "kanchipuram";
    if (text.includes("hosur")) return "hosur";
    
    // 3. Safety fallback
    return user?.region || "chennai";
  }, [user?.region]);

  // Combine backend summaries with client-side local storage data
  const combinedSummary = useMemo(() => {
    if (!summary) return null;
    
    // Initialize counts with existing summary data (deep copy structure)
    const aggregated: Record<string, number> = {};
    summary.regions.forEach(r => aggregated[r.region] = r.total);
    
    // Tally client-side items
    localQuotations.forEach((q) => {
      const r = inferRegion(q);
      aggregated[r] = (aggregated[r] || 0) + 1;
    });
    
    const mergedRegions = Object.entries(aggregated).map(([region, total]) => ({
      region,
      total
    }));
    
    const grandTotal = mergedRegions.reduce((acc, cur) => acc + cur.total, 0);
    
    return {
      regions: mergedRegions,
      total: grandTotal
    };
  }, [summary, localQuotations, inferRegion]);

  // Filter Local Table too so interactions FEEL wired
  const visibleLocalQuotations = useMemo(() => {
    let base = localQuotations;
    
    // If not admin, permanently restrict to user's own region
    if (!isAdmin && user?.region) {
      base = base.filter((q) => inferRegion(q) === user.region);
    }
    
    // Then apply active UI click filter if active
    if (!selectedRegion) return base;
    return base.filter((q) => inferRegion(q) === selectedRegion);
  }, [localQuotations, selectedRegion, inferRegion, isAdmin, user?.region]);

  const { data, loading, error, pagination, refetch } = useQuotations(filters);

  const hasActiveFilters = status !== "all" || !!selectedRegion;

  const handleClearFilters = () => {
    setStatus("all");
    setSelectedRegion(undefined);
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

      {/* ── Summary Cards ──────────────────────────────────────── */}
      {isAdmin && combinedSummary && combinedSummary.regions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          {combinedSummary.regions.map((r) => {
            const isSelected = selectedRegion === r.region;
            const regionLabel = REGION_LABELS[r.region as Region] || r.region;
            return (
              <Card
                key={r.region}
                onClick={() => {
                  setSelectedRegion(isSelected ? undefined : (r.region as Region));
                  setPage(1);
                }}
                className={`p-4 flex flex-col items-center gap-1 border cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all select-none ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-600"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <MapPin
                  className={`w-4 h-4 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-indigo-500"}`}
                />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {regionLabel}
                </span>
                <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{r.total || 0}</span>
              </Card>
            );
          })}
          <Card
            onClick={() => {
              setSelectedRegion(undefined);
              setPage(1);
            }}
            className={`p-4 flex flex-col items-center gap-1 border cursor-pointer hover:bg-indigo-100/50 dark:hover:bg-indigo-900/40 transition-all select-none bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 ${
              selectedRegion === undefined ? "ring-2 ring-indigo-600" : ""
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
              Total
            </span>
            <span className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
              {combinedSummary.total}
            </span>
          </Card>
        </div>
      )}

      {/* Non-admin single region count */}
      {!isAdmin && user?.region && combinedSummary && (
        <div className="flex flex-wrap gap-3 mb-6">
          {(() => {
            const regionCount = combinedSummary.regions.find((r) => r.region === user.region)?.total || 0;
            const regionLabel = REGION_LABELS[user.region as Region] || user.region;
            return (
              <Card className="p-4 flex flex-col items-center gap-1 border select-none min-w-[120px] border-indigo-100 bg-indigo-50/30 dark:border-indigo-900 dark:bg-indigo-950/20">
                <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {regionLabel}
                </span>
                <span className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                  {regionCount}
                </span>
              </Card>
            );
          })()}
        </div>
      )}

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
        defaultRegion={user?.region}
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

      {visibleLocalQuotations.length > 0 && (
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
                    <th className="p-2">Region</th>
                    <th className="p-2">Valid Until</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-200 text-xs">
                  {visibleLocalQuotations.map((q: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2 font-medium text-slate-900 dark:text-white">{q.quoteNumber}</td>
                      <td className="p-2">{q.quoteToName}</td>
                      <td className="p-2">{q.issueDate}</td>
                      <td className="p-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 capitalize">
                          {inferRegion(q)}
                        </span>
                      </td>
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
                            const targetId = q.localId;
                            const updated = localQuotations.filter((item: any, idx: number) => {
                               // Filter by localId if exists, fallback to index for legacy
                               return targetId ? item.localId !== targetId : idx !== i;
                            });
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
