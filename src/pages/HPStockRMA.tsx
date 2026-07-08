import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Info, Loader2, ArrowLeft, Trash2 } from "lucide-react";
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
import type { PaginationMeta } from "@/types";
import { extractApiError } from "@/api/client";
import { format } from "date-fns";

export default function HPStockRMA() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin" || user?.role === "super_admin" || user?.role === "manager";

  const [parts, setParts] = useState<HPStockRMAPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({ total: 0, page: 1, per_page: 20, pages: 1 });
  const [error, setError] = useState<string | null>(null);

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
    if (isAdmin) {
      fetchParts();
    }
  }, [fetchParts, isAdmin]);

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

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Card className="p-8 text-center max-w-md border-red-200 dark:border-red-950 bg-red-50/20">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Access Denied</h3>
          <p className="text-sm text-slate-500 mb-4">
            You do not have permission to view the HP Stock RMA Parts Catalog. Only Admins and Managers can access this section.
          </p>
        </Card>
      </div>
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
            <FileSpreadsheet className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>HP Stock RMA Parts Catalog</span>
            {!loading && (
              <Badge variant="secondary" className="ml-2 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-semibold border-indigo-100/10">
                {pagination.total} Parts
              </Badge>
            )}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Browse and upload the master database of valid parts for HP RMA workflows.
          </p>
        </div>
      </div>

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
    </motion.div>
  );
}
