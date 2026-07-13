import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Info, Loader2, ArrowLeft, Trash2, FileText, Check, MapPin, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuthStore } from "@/store/authStore";
import { getHPStockRMAParts, importHPStockRMAPartsExcel, deleteAllHPStockRMAParts } from "@/api/hpStockRMAParts";
import type { HPStockRMAPart } from "@/api/hpStockRMAParts";
import type { PaginationMeta, Region } from "@/types";
import { REGION_LABELS } from "@/types";
import { extractApiError } from "@/api/client";
import { format } from "date-fns";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { getHPStockItems, approveHPStockDCCut, getHPStockSummary, getHPStockDCCutValueCounts } from "@/api/hpStock";
import type { HPStockItem, HPStockSummary, DCCutValueCounts } from "@/api/hpStock";
import { HPStockHistoryView } from "@/components/hp-stock/HPStockHistoryView";
import { DCCutChatDialog } from "@/components/hp-stock/DCCutChatDialog";
import { getPartValueBand } from "@/lib/partValue";
import { canAccessSection } from "@/lib/sections";

export default function HPStockRMA() {
  const user = useAuthStore((s) => s.user);
  // Access follows the section permission (see @/lib/sections), not the role — an
  // admin can grant HP Stock RMA to anyone, and the sidebar/route guard already agree.
  const hasAccess = canAccessSection(user, "/hp-stock-rma");
  // Price is super-admin-only (the API omits it for everyone else).
  const isSuperAdmin = user?.role === "super_admin";

  const [parts, setParts] = useState<HPStockRMAPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({ total: 0, page: 1, per_page: 20, pages: 1 });
  const [error, setError] = useState<string | null>(null);

  // DC Cut approvals are the main view here; the parts catalog is a side trip.
  const [rmaView, setRmaView] = useState<"approvals" | "catalog">("approvals");

  // DC Cut Approvals states
  const [dcRequests, setDcRequests] = useState<HPStockItem[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsPagination, setRequestsPagination] = useState<PaginationMeta>({ total: 0, page: 1, per_page: 20, pages: 1 });
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HPStockItem | null>(null);
  const [summary, setSummary] = useState<HPStockSummary | null>(null);
  // Value band counts across the DC Cut requests only (super-admin only).
  const [dcValueCounts, setDcValueCounts] = useState<DCCutValueCounts | null>(null);
  const [selectedRequestRegion, setSelectedRequestRegion] = useState<string>("all");
  const [chatOpen, setChatOpen] = useState(false);
  const [activeChatRow, setActiveChatRow] = useState<HPStockItem | null>(null);

  // Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ detail: string; errors?: string[] } | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const fetchParts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getHPStockRMAParts({
        search: debouncedSearch || undefined,
        page,
        per_page: 20,
      });
      setParts(res.items);
      setPagination({
        total: res.total,
        page: res.page,
        per_page: res.per_page,
        pages: res.pages,
      });
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    if (hasAccess) {
      fetchParts();
    }
  }, [fetchParts, hasAccess]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await getHPStockSummary("overall");
      setSummary(res);
    } catch (err) {
      console.error("Failed to fetch summary:", err);
    }
  }, []);

  // Counts cover every DC Cut request in scope, not just the current page, so they
  // come from the API rather than from `dcRequests`. Region-scoped like the table.
  const fetchDCValueCounts = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const res = await getHPStockDCCutValueCounts(
        selectedRequestRegion !== "all" ? selectedRequestRegion : undefined
      );
      setDcValueCounts(res);
    } catch {
      setDcValueCounts(null);
    }
  }, [isSuperAdmin, selectedRequestRegion]);

  const fetchDCRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await getHPStockItems({
        page: requestsPage,
        per_page: 20,
        is_closed: "dc_cut_request",
        region: selectedRequestRegion !== "all" ? selectedRequestRegion : undefined
      });
      setDcRequests(res.items);
      setRequestsPagination({
        total: res.total,
        page: res.page,
        per_page: res.per_page,
        pages: res.pages
      });
    } catch (err) {
      toast({ title: "Failed to fetch DC Cut requests", description: extractApiError(err), variant: "destructive" });
    } finally {
      setLoadingRequests(false);
    }
  }, [requestsPage, selectedRequestRegion]);

  useEffect(() => {
    if (hasAccess) {
      fetchDCRequests();
      fetchSummary();
      fetchDCValueCounts();
    }
  }, [fetchDCRequests, fetchSummary, fetchDCValueCounts, hasAccess, selectedRequestRegion]);

  const handleApproveDCCut = async (id: number) => {
    const confirmed = window.confirm("Are you sure you want to approve the DC Cut for this item?");
    if (!confirmed) return;

    setApprovingId(id);
    try {
      await approveHPStockDCCut(id);
      toast({ title: "DC Cut Approved successfully!" });
      fetchDCRequests();
      fetchSummary();
      fetchDCValueCounts();
    } catch (err) {
      toast({ title: "Failed to approve DC Cut", description: extractApiError(err), variant: "destructive" });
    } finally {
      setApprovingId(null);
    }
  };

  const openTrack = (row: HPStockItem) => {
    setSelectedHistoryItem(row);
  };

  const openChat = (row: HPStockItem) => {
    setActiveChatRow(row);
    setChatOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({ title: "Please select an Excel file first.", variant: "destructive" });
      return;
    }

    setImporting(true);
    setImportResult(null);
    try {
      const res = await importHPStockRMAPartsExcel(selectedFile);
      setImportResult(res);
      toast({ title: "Import Completed!", description: res.detail });
      setSelectedFile(null);
      // Reset input element
      const fileInput = document.getElementById("excel-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      // Refresh page 1 list
      setPage(1);
      fetchParts();
    } catch (err) {
      toast({ title: "Import Failed", description: extractApiError(err), variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const [deletingAll, setDeletingAll] = useState(false);

  const handleDeleteAll = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete all parts from the catalog? This action will permanently wipe the entire parts database and cannot be undone."
    );
    if (!confirmed) return;

    setDeletingAll(true);
    try {
      const res = await deleteAllHPStockRMAParts();
      toast({ title: "Catalog Cleared", description: res.detail });
      setPage(1);
      fetchParts();
    } catch (err) {
      toast({ title: "Failed to clear catalog", description: extractApiError(err), variant: "destructive" });
    } finally {
      setDeletingAll(false);
    }
  };

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Card className="p-8 text-center max-w-md border-red-200 dark:border-red-950 bg-red-50/20">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Access Denied</h3>
          <p className="text-sm text-slate-500 mb-4">
            You do not have permission to view HP Stock RMA. Ask an admin to grant you this section.
          </p>
        </Card>
      </div>
    );
  }

  if (selectedHistoryItem) {
    return (
      <HPStockHistoryView
        item={selectedHistoryItem}
        onBack={() => setSelectedHistoryItem(null)}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center flex-wrap gap-2">
            {rmaView === "catalog" ? (
              <FileSpreadsheet className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            )}
            <span>{rmaView === "catalog" ? "Parts Catalog" : "DC Cut Approvals"}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {rmaView === "catalog"
              ? "Browse and import the HP RMA parts catalog."
              : "Review and process DC Cut approvals for the HP RMA workflow."}
          </p>
        </div>

        {rmaView === "approvals" ? (
          <Button
            variant="outline"
            onClick={() => setRmaView("catalog")}
            className="flex items-center gap-2 shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Parts Catalog
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => setRmaView("approvals")}
            className="flex items-center gap-2 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to DC Cut Approvals
            {dcRequests.some((r) => !r.dc_cut_approved) && (
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </Button>
        )}
      </div>

      <Tabs value={rmaView} onValueChange={(v) => setRmaView(v as "approvals" | "catalog")} className="space-y-6">
        <TabsContent value="catalog" className="space-y-6">
          {/* Excel Upload Area */}
          <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Upload className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-850 dark:text-slate-200 uppercase tracking-wide">
                Bulk Import Parts
              </h3>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative flex-1">
                <Input
                  id="excel-file-input"
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  disabled={importing}
                  className="cursor-pointer pr-10"
                />
                {selectedFile && (
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      const fileInput = document.getElementById("excel-file-input") as HTMLInputElement;
                      if (fileInput) fileInput.value = "";
                    }}
                    className="absolute right-3 top-2.5 text-xs text-slate-450 hover:text-slate-650"
                  >
                    ✕
                  </button>
                )}
              </div>
              <Button
                onClick={handleImport}
                disabled={!selectedFile || importing}
                className="bg-indigo-600 hover:bg-indigo-700 font-semibold gap-2 whitespace-nowrap min-w-[140px]"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload & Import
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleDeleteAll}
                disabled={deletingAll || importing}
                className="border-red-200 hover:border-red-300 dark:border-red-950 dark:hover:border-red-900 text-red-650 hover:text-red-700 hover:bg-red-50/50 dark:hover:bg-red-950/20 font-semibold gap-2 whitespace-nowrap"
              >
                {deletingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Clear Catalog
                  </>
                )}
              </Button>
            </div>

            {/* Display Import Results */}
            {importResult && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border text-sm ${
                  importResult.errors && importResult.errors.length > 0
                    ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-850 dark:text-amber-300"
                    : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-850 dark:text-emerald-300"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {importResult.errors && importResult.errors.length > 0 ? (
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold">{importResult.detail}</p>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="mt-2.5 space-y-1 max-h-32 overflow-y-auto pr-1">
                        <p className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-1">
                          Errors Encountered:
                        </p>
                        {importResult.errors.map((err, i) => (
                          <p key={i} className="text-xs font-mono text-red-500">
                            • {err}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </Card>

          {/* Main Content (Table) */}
          <div className="space-y-4">
            {/* Search */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-455 pointer-events-none" />
                <Input
                  placeholder="Search parts catalog..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            {error && (
              <Card className="p-6 border-red-100 bg-red-50/30 text-center">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                <p className="text-slate-800 dark:text-slate-100 font-medium mb-1">Error Loading Catalog</p>
                <p className="text-sm text-slate-500 mb-3">{error}</p>
                <Button size="sm" onClick={fetchParts}>
                  Retry
                </Button>
              </Card>
            )}

            {!loading && parts.length === 0 && !debouncedSearch ? (
              <Card className="p-12 text-center border-dashed border-2">
                <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-800 dark:text-slate-100 font-medium mb-1">Catalog is Empty</p>
                <p className="text-sm text-slate-500">
                  Please upload an Excel spreadsheet above to populate the HP Stock RMA Parts list.
                </p>
              </Card>
            ) : (
              <Card className="border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                        <TableHead className="font-semibold w-36">Part Number</TableHead>
                        <TableHead className="font-semibold">Description</TableHead>
                        <TableHead className="font-semibold">Category</TableHead>
                        <TableHead className="font-semibold text-right">Price</TableHead>
                        <TableHead className="font-semibold">HSN Code</TableHead>
                        <TableHead className="font-semibold">Taxes</TableHead>
                        <TableHead className="font-semibold text-center">EOSL</TableHead>
                        <TableHead className="font-semibold">Validity</TableHead>
                        <TableHead className="font-semibold text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><div className="h-4 bg-slate-150 dark:bg-slate-800 rounded animate-pulse w-24" /></TableCell>
                            <TableCell><div className="h-4 bg-slate-150 dark:bg-slate-800 rounded animate-pulse w-48" /></TableCell>
                            <TableCell><div className="h-4 bg-slate-150 dark:bg-slate-800 rounded animate-pulse w-28" /></TableCell>
                            <TableCell><div className="h-4 bg-slate-150 dark:bg-slate-800 rounded animate-pulse w-16 ml-auto" /></TableCell>
                            <TableCell><div className="h-4 bg-slate-150 dark:bg-slate-800 rounded animate-pulse w-20" /></TableCell>
                            <TableCell><div className="h-4 bg-slate-150 dark:bg-slate-800 rounded animate-pulse w-24" /></TableCell>
                            <TableCell><div className="h-4 bg-slate-150 dark:bg-slate-800 rounded animate-pulse w-12 mx-auto" /></TableCell>
                            <TableCell><div className="h-4 bg-slate-150 dark:bg-slate-800 rounded animate-pulse w-20" /></TableCell>
                            <TableCell><div className="h-4 bg-slate-150 dark:bg-slate-800 rounded animate-pulse w-20 mx-auto" /></TableCell>
                          </TableRow>
                        ))
                      ) : parts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                            No matching parts found in the catalog.
                          </TableCell>
                        </TableRow>
                      ) : (
                        parts.map((p) => {
                          const isEosl = p.eosl_flag?.trim().toLowerCase() === "yes";
                          const isSupported = p.parts_status?.trim().toLowerCase() === "supported";
                          
                          return (
                            <TableRow key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <TableCell className="font-semibold font-mono text-indigo-650 dark:text-indigo-400 text-sm">
                                {p.part_number}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                                {p.description || "—"}
                              </TableCell>
                              <TableCell className="text-xs text-slate-500 uppercase tracking-wide">
                                {p.category || "—"}
                              </TableCell>
                              <TableCell className="text-right font-medium text-slate-900 dark:text-slate-150">
                                {p.price ? `₹${parseFloat(String(p.price)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-slate-650 dark:text-slate-350">
                                {p.hsn_code || "—"}
                              </TableCell>
                              <TableCell className="text-[11px] text-slate-500">
                                <div className="flex flex-col gap-0.5">
                                  {p.igst && <span>IGST: {p.igst}</span>}
                                  {(p.cgst || p.sgst) && (
                                    <span>
                                      CGST: {p.cgst || "0%"} • SGST: {p.sgst || "0%"}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant="outline"
                                  className={
                                    isEosl
                                      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-950 dark:bg-red-950/20 dark:text-red-400 font-semibold"
                                      : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-400"
                                  }
                                >
                                  {p.eosl_flag || "No"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs font-semibold text-slate-600 dark:text-slate-450">
                                {p.validity ? format(new Date(p.validity), "dd/MM/yyyy") : "—"}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  className={
                                    isSupported
                                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border-transparent font-semibold"
                                      : "bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border-transparent font-semibold"
                                  }
                                >
                                  {p.parts_status || "—"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}

            {/* Pagination */}
            {!loading && pagination.total > 0 && (
              <div className="flex items-center justify-between mt-4 text-sm text-slate-500 dark:text-slate-400">
                <span>
                  Showing {(pagination.page - 1) * pagination.per_page + 1}-
                  {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          {/* Region-wise counts */}
          {summary && summary.regions && summary.regions.some((r) => (r.dc_cut_request || 0) > 0) && (
            <div className="flex flex-wrap gap-2.5">
              <Card
                onClick={() => {
                  setSelectedRequestRegion("all");
                  setRequestsPage(1);
                }}
                className={`px-3.5 py-2 flex items-center gap-2 border cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all select-none rounded-xl shadow-sm ${
                  selectedRequestRegion === "all"
                    ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-600"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                }`}
              >
                <div className={`h-2 w-2 rounded-full ${selectedRequestRegion === "all" ? "bg-indigo-600" : "bg-slate-400"}`} />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  All Regions
                </span>
                <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-bold ml-0.5">
                  {summary.dc_cut_request_total || 0}
                </Badge>
              </Card>

              {summary.regions
                .filter((r) => (r.dc_cut_request || 0) > 0)
                .map((r) => {
                  const isSelected = selectedRequestRegion === r.region;
                  const label = REGION_LABELS[r.region as Region] || r.region;
                  return (
                    <Card
                      key={r.region}
                      onClick={() => {
                        setSelectedRequestRegion(isSelected ? "all" : r.region);
                        setRequestsPage(1);
                      }}
                      className={`px-3.5 py-2 flex items-center gap-2 border cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all select-none rounded-xl shadow-sm ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-600"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                      }`}
                    >
                      <MapPin className={`w-3.5 h-3.5 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-350 uppercase tracking-wide">
                        {label}
                      </span>
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold ml-0.5 border-transparent">
                        {r.dc_cut_request || 0}
                      </Badge>
                    </Card>
                  );
                })}
            </div>
          )}

          {/* Value bands across the DC Cut requests in scope. Price-derived, so super-admin only. */}
          {isSuperAdmin && dcValueCounts && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {[
                {
                  label: "Low Value Part",
                  hint: "Up to ₹5,000",
                  value: dcValueCounts.part_value_low_total || 0,
                  color: "text-emerald-600 dark:text-emerald-400",
                  ring: "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20",
                  dot: "bg-emerald-500",
                },
                {
                  label: "Mid Value Part",
                  hint: "₹5,001 – ₹10,000",
                  value: dcValueCounts.part_value_mid_total || 0,
                  color: "text-amber-600 dark:text-amber-400",
                  ring: "border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20",
                  dot: "bg-amber-500",
                },
                {
                  label: "High Value Part",
                  hint: "₹10,001 – ₹15,000",
                  value: dcValueCounts.part_value_high_total || 0,
                  color: "text-orange-600 dark:text-orange-400",
                  ring: "border-orange-200 dark:border-orange-800/60 bg-orange-50/40 dark:bg-orange-950/20",
                  dot: "bg-orange-500",
                },
                {
                  label: "Critical Value Part",
                  hint: "Above ₹15,000",
                  value: dcValueCounts.part_value_critical_total || 0,
                  color: "text-red-600 dark:text-red-400",
                  ring: "border-red-200 dark:border-red-800/60 bg-red-50/40 dark:bg-red-950/20",
                  dot: "bg-red-500",
                },
              ].map((b) => (
                <Card key={b.label} className={`p-4 flex items-center gap-3 border ${b.ring}`}>
                  <span className={`shrink-0 w-2.5 h-2.5 rounded-full ${b.dot}`} />
                  <div className="min-w-0">
                    <div className={`text-xl font-bold leading-none ${b.color}`}>{b.value}</div>
                    <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-1 truncate">
                      {b.label}
                    </div>
                    <div className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {b.hint}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Card className="border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                    <TableHead className="font-semibold">Case ID / WO</TableHead>
                    <TableHead className="font-semibold">Opened Date</TableHead>
                    <TableHead className="font-semibold">Customer & Part</TableHead>
                    {isSuperAdmin && <TableHead className="font-semibold text-right">Price</TableHead>}
                    {isSuperAdmin && <TableHead className="font-semibold text-center">Part Value</TableHead>}
                    <TableHead className="font-semibold">Region & Engineer</TableHead>
                    <TableHead className="font-semibold">DC Cut Message</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                    <TableHead className="text-center font-semibold">History</TableHead>
                    <TableHead className="text-center font-semibold">Chat</TableHead>
                    <TableHead className="text-right font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingRequests ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><div className="h-4 bg-slate-150 dark:bg-slate-800 rounded animate-pulse w-24" /></TableCell>
                        <TableCell><div className="h-4 bg-slate-150 dark:bg-slate-800 rounded animate-pulse w-20" /></TableCell>
                        <TableCell><div className="h-4 bg-slate-150 dark:bg-slate-800 rounded animate-pulse w-48" /></TableCell>
                        {isSuperAdmin && <TableCell><div className="h-4 bg-slate-150 dark:bg-slate-800 rounded animate-pulse w-20 ml-auto" /></TableCell>}
                        {isSuperAdmin && <TableCell><div className="h-4 bg-slate-150 dark:bg-slate-800 rounded animate-pulse w-24 mx-auto" /></TableCell>}
                        <TableCell><div className="h-4 bg-slate-150 dark:bg-slate-800 rounded animate-pulse w-32" /></TableCell>
                        <TableCell><div className="h-4 bg-slate-150 dark:bg-slate-800 rounded animate-pulse w-64" /></TableCell>
                        <TableCell><div className="h-4 bg-slate-150 dark:bg-slate-800 rounded animate-pulse w-20 mx-auto" /></TableCell>
                        <TableCell><div className="h-4 bg-slate-150 dark:bg-slate-800 rounded animate-pulse w-16 mx-auto" /></TableCell>
                        <TableCell><div className="h-4 bg-slate-150 dark:bg-slate-800 rounded animate-pulse w-16 mx-auto" /></TableCell>
                        <TableCell><div className="h-8 bg-slate-150 dark:bg-slate-800 rounded animate-pulse w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : dcRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isSuperAdmin ? 11 : 9} className="text-center py-12 text-slate-400">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-60" />
                        <p className="font-medium text-slate-800 dark:text-slate-200">All caught up!</p>
                        <p className="text-xs text-slate-500">No pending DC Cut requests needing approval.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    dcRequests.map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <TableCell>
                          <div className="font-semibold text-slate-900 dark:text-slate-150">{item.case_id || "N/A"}</div>
                          <div className="text-xs text-slate-500">{item.work_order_id || "N/A"}</div>
                        </TableCell>
                        <TableCell>
                          {item.case_created_time ? (
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                              {format(new Date(item.case_created_time), "dd/MM/yyyy")}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">
                              {format(new Date(item.created_at), "dd/MM/yyyy")}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.customer_name || "—"}</div>
                          <div className="text-xs text-slate-500 max-w-[200px] truncate" title={item.part_description || ""}>
                            {item.part_description || "—"}
                          </div>
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell className="text-right">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {item.price != null
                                ? `₹${Number(item.price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : "—"}
                            </span>
                          </TableCell>
                        )}
                        {isSuperAdmin && (
                          <TableCell className="text-center">
                            {(() => {
                              const band = getPartValueBand(item.price);
                              if (!band) return <span className="text-slate-400">—</span>;
                              return (
                                <Badge className={`${band.className} hover:${band.className} font-semibold border-transparent whitespace-nowrap`}>
                                  {band.label}
                                </Badge>
                              );
                            })()}
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.engineer_name || "—"}</div>
                          <div className="text-xs text-slate-500">{item.engineer_phone || "—"}</div>
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate font-medium text-slate-700 dark:text-slate-350" title={item.dc_cut_request_message || ""}>
                          {item.dc_cut_request_message || <span className="text-slate-400 italic">No message provided</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.dc_cut_approved ? (
                            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 hover:bg-emerald-50 font-semibold border-transparent">
                              Approved
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450 hover:bg-amber-50 font-semibold border-transparent">
                              Pending Approval
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                            onClick={() => openTrack(item)}
                          >
                            History
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openChat(item)}
                            className="relative text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium gap-1.5"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>Chat</span>
                            {item.dc_cut_chat && item.dc_cut_chat.length > 0 && (
                              <Badge className="h-5 min-w-[20px] px-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {item.dc_cut_chat.length}
                              </Badge>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.dc_cut_approved ? (
                            <span className="text-xs text-emerald-500 font-semibold flex items-center justify-end gap-1">
                              <Check className="w-4 h-4" /> Ready to Close
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleApproveDCCut(item.id)}
                              disabled={approvingId === item.id}
                              className="bg-indigo-650 hover:bg-indigo-700 text-white font-semibold gap-1.5"
                            >
                              {approvingId === item.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              Approve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Pagination */}
          {!loadingRequests && requestsPagination.total > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm text-slate-500 dark:text-slate-400">
              <span>
                Showing {(requestsPagination.page - 1) * requestsPagination.per_page + 1}-
                {Math.min(requestsPagination.page * requestsPagination.per_page, requestsPagination.total)} of {requestsPagination.total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRequestsPage(requestsPagination.page - 1)}
                  disabled={requestsPagination.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRequestsPage(requestsPagination.page + 1)}
                  disabled={requestsPagination.page >= requestsPagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      <DCCutChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        item={activeChatRow}
        onMessageSent={(updated) => {
          setActiveChatRow(updated);
          fetchDCRequests();
        }}
      />
    </motion.div>
  );
}
