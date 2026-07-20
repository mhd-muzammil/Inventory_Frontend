import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Plus, Search, MapPin, Globe, BarChart3, Layers, Calendar, Camera, RotateCcw, UserCheck, PackageCheck, Clock } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HPStockTable } from "@/components/hp-stock/HPStockTable";
import { HPStockFormDialog } from "@/components/hp-stock/HPStockFormDialog";
import { HPStockHistoryView } from "@/components/hp-stock/HPStockHistoryView";
import { getHPStockItems, deleteHPStockItem, getHPStockSummary, getHPStockFilterOptions, getPartsCallCounts } from "@/api/hpStock";
import type { HPStockItem, HPStockSummary, HPStockFilterOptions } from "@/api/hpStock";
import { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuthStore } from "@/store/authStore";
import { REGION_LABELS } from "@/types";
import type { PaginationMeta, Region } from "@/types";

export default function HPStock() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin" || user?.role === "super_admin" || user?.role === "manager";
  // Part value is derived from price, which is super-admin-only.
  const isSuperAdmin = user?.role === "super_admin";
  const showToggle = !isAdmin && !!user?.region;
  
  const [viewMode, setViewMode] = useState<"my_region" | "overall">(showToggle ? "my_region" : "overall");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [search, setSearch] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("search") || "";
    }
    return "";
  });
  const [selectedDate, setSelectedDate] = useState<string>("");
  // Stage cards use their OWN date, defaulting to today (local, YYYY-MM-DD), so the
  // four count cards open on today's transition counts without touching the table's
  // own date filter (selectedDate). Clearing it shows the all-time totals.
  const [summaryDate, setSummaryDate] = useState<string>(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  });
  // When set, the table lists cases that completed this stage (a stage count card
  // is selected). It supersedes the active/dc-cut/closed tab so the row count
  // matches the number on the card.
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  // Same idea for the part value bands (super-admin only, like price itself).
  const [valueBandFilter, setValueBandFilter] = useState<string | null>(null);
  const [warrantyTrade, setWarrantyTrade] = useState<string>("all");
  const [partShipmentStatus, setPartShipmentStatus] = useState<string>("all");
  const [filterOptions, setFilterOptions] = useState<HPStockFilterOptions>({ warranty_trade: [], part_shipment_status: [] });
  // OpenCall "Active Part Cases" count (region-wise) — pushed in from OpenCall. Count only.
  const [ocPartsByRegion, setOcPartsByRegion] = useState<Record<string, number>>({});
  const [ocPartsTotal, setOcPartsTotal] = useState(0);

  useEffect(() => {
    getPartsCallCounts()
      .then((rows) => {
        if (rows.length === 0) return;
        const latest = rows.reduce(
          (mx, r) => (r.report_date > mx ? r.report_date : mx),
          rows[0].report_date,
        );
        const map: Record<string, number> = {};
        let sum = 0;
        for (const r of rows) {
          if (r.report_date !== latest) continue;
          map[r.region] = (map[r.region] || 0) + r.count;
          sum += r.count;
        }
        setOcPartsByRegion(map);
        setOcPartsTotal(sum);
      })
      .catch(() => {
        /* non-fatal: cards just show 0 */
      });
  }, []);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"active" | "dc_cut_request" | "closed">("active");
  const [data, setData] = useState<HPStockItem[]>([]);
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({ total: 0, page: 1, per_page: 20, pages: 1 });

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HPStockItem | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HPStockItem | null>(null);

  const [summary, setSummary] = useState<HPStockSummary | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const fetchSummary = useCallback(async () => {
    try {
      const apiView = isAdmin ? "overall" : viewMode;
      // Pass the cards' own date so the stage cards count that day's transitions.
      const res = await getHPStockSummary(apiView, undefined, summaryDate || undefined);
      setSummary(res);
    } catch {
      // silent fail for summary
    }
  }, [viewMode, isAdmin, summaryDate]);

  const fetchData = useCallback(async () => {
    if (dataRef.current.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const apiView = isAdmin ? "overall" : viewMode;
      const apiRegion = isAdmin && selectedRegion !== "all" ? selectedRegion : undefined;
      const res = await getHPStockItems({
        search: debouncedSearch || undefined,
        view: apiView,
        region: apiRegion,
        page,
        per_page: 20,
        // A stage/value filter spans every tab, so the tab filter is dropped while one is on.
        is_closed: (stageFilter || valueBandFilter)
          ? undefined
          : activeTab === "closed" ? "true" : activeTab === "dc_cut_request" ? "dc_cut_request" : "false",
        stage_done: stageFilter || undefined,
        // When a stage card is clicked while its date is set, scope the table to the
        // cases that reached that stage on that day — so the rows match the card count.
        // PENDING_RETURN is a current-state card (date-independent), so it opts out.
        stage_on_date: stageFilter && stageFilter !== "PENDING_RETURN" && summaryDate ? summaryDate : undefined,
        value_band: valueBandFilter || undefined,
        date: selectedDate || undefined,
        warranty_trade: warrantyTrade !== "all" ? warrantyTrade : undefined,
        part_shipment_status: partShipmentStatus !== "all" ? partShipmentStatus : undefined,
      });
      setData(res.items);
      setPagination({ total: res.total, page: res.page, per_page: res.per_page, pages: res.pages });
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, viewMode, page, isAdmin, selectedRegion, activeTab, selectedDate, summaryDate, warrantyTrade, partShipmentStatus, stageFilter, valueBandFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  useEffect(() => {
    getHPStockFilterOptions()
      .then(setFilterOptions)
      .catch(() => { /* silent — filters just stay empty */ });
  }, [viewMode, isAdmin]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryVal = params.get("search");
      if (queryVal !== null && queryVal !== search) {
        setSearch(queryVal);
      }
    }
  }, []);

  const handleMutated = () => {
    fetchData();
    fetchSummary();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteHPStockItem(id);
      toast({ title: "HP stock deleted successfully" });
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
          <p className="text-slate-800 dark:text-slate-100 font-medium mb-2">Failed to load HP stock</p>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <Button onClick={fetchData}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {selectedHistoryItem ? (
        <HPStockHistoryView
          item={selectedHistoryItem}
          onBack={() => setSelectedHistoryItem(null)}
        />
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">HP Stock RMA Workflow</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage HP stock and logistics.</p>
          </div>

      {summary && summary.regions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          {summary.regions.map((r) => {
            const isSelected = selectedRegion === r.region;
            return (
              <Card
                key={r.region}
                onClick={() => { setSelectedRegion(isSelected ? "all" : r.region); setStageFilter(null); setValueBandFilter(null); setPage(1); }}
                className={`p-4 flex flex-col items-center gap-1 border cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all select-none ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-600"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <MapPin className={`w-4 h-4 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-indigo-500"}`} />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {REGION_LABELS[r.region as Region] || r.region}
                </span>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="text-center">
                    {/* Active = OpenCall Overview's "Active Part Cases" count for this region. */}
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{ocPartsByRegion[r.region] ?? 0}</span>
                    <div className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active</div>
                  </div>
                  <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700/50 mx-0.5" />
                  <div className="text-center">
                    <span className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">{r.dc_cut_request || 0}</span>
                    <div className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">DC Cut</div>
                  </div>
                  <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700/50 mx-0.5" />
                  <div className="text-center">
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{r.closed || 0}</span>
                    <div className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Closed</div>
                  </div>
                </div>
              </Card>
            );
          })}
          {/* Total spans every region, so only full admins see it. */}
          {isAdmin && (
            <Card
              onClick={() => { setSelectedRegion("all"); setStageFilter(null); setValueBandFilter(null); setPage(1); }}
              className={`p-4 flex flex-col items-center gap-1 border cursor-pointer hover:bg-indigo-100/50 dark:hover:bg-indigo-900/40 transition-all select-none bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 ${
                selectedRegion === "all" ? "ring-2 ring-indigo-600" : ""
              }`}
            >
              <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                Total
              </span>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="text-center">
                  {/* Active = OpenCall Overview's total "Active Part Cases" count. */}
                  <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                    {ocPartsTotal}
                  </span>
                  <div className="text-[9px] font-medium text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-wider">Active</div>
                </div>
                <div className="w-[1px] h-6 bg-indigo-200 dark:bg-indigo-800/50 mx-0.5" />
                <div className="text-center">
                  <span className="text-sm font-semibold text-cyan-700 dark:text-cyan-400">
                    {summary.dc_cut_request_total || 0}
                  </span>
                  <div className="text-[9px] font-medium text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-wider">DC Cut</div>
                </div>
                <div className="w-[1px] h-6 bg-indigo-200 dark:bg-indigo-800/50 mx-0.5" />
                <div className="text-center">
                  <span className="text-sm font-semibold text-indigo-650/80 dark:text-indigo-400/80">
                    {summary.closed_total || 0}
                  </span>
                  <div className="text-[9px] font-medium text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-wider">Closed</div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Stage completion counts — how many cases did each action on the chosen day. */}
      {summary && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Actions on{" "}
            <span className="text-indigo-600 dark:text-indigo-400">
              {summaryDate
                ? new Date(summaryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                : "all dates"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={summaryDate}
              onChange={(e) => setSummaryDate(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {summaryDate && (
              <button
                onClick={() => setSummaryDate("")}
                className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Show all-time
              </button>
            )}
          </div>
        </div>
      )}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {[
            {
              stage: "GOOD_PART_PHOTO",
              label: "Good Part Photo",
              value: summary.good_part_photo_total || 0,
              icon: Camera,
              color: "text-indigo-600 dark:text-indigo-400",
              ring: "border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/20",
              activeRing: "ring-2 ring-indigo-600",
            },
            {
              stage: "RETURN_PART_PHOTO",
              label: "Return Part Photo",
              value: summary.return_part_photo_total || 0,
              icon: RotateCcw,
              color: "text-blue-600 dark:text-blue-400",
              ring: "border-blue-200 dark:border-blue-800/60 bg-blue-50/40 dark:bg-blue-950/20",
              activeRing: "ring-2 ring-blue-600",
            },
            {
              stage: "ISSUED",
              label: "Part Taken by Engineer",
              value: summary.issued_total || 0,
              icon: UserCheck,
              color: "text-amber-600 dark:text-amber-400",
              ring: "border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20",
              activeRing: "ring-2 ring-amber-600",
            },
            {
              stage: "HANDOVER",
              label: "Handover by Engineer",
              value: summary.handover_total || 0,
              icon: PackageCheck,
              color: "text-emerald-600 dark:text-emerald-400",
              ring: "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20",
              activeRing: "ring-2 ring-emerald-600",
            },
            {
              // Part still out with an engineer (taken, not yet handed back). Current
              // state, so it ignores the date filter — always "who is holding a part now".
              stage: "PENDING_RETURN",
              label: "Pending Return (with Engineer)",
              value: summary.pending_return_total || 0,
              icon: Clock,
              color: "text-rose-600 dark:text-rose-400",
              ring: "border-rose-200 dark:border-rose-800/60 bg-rose-50/40 dark:bg-rose-950/20",
              activeRing: "ring-2 ring-rose-600",
            },
          ].map((s) => {
            const isSelected = stageFilter === s.stage;
            return (
              <Card
                key={s.stage}
                onClick={() => { setStageFilter(isSelected ? null : s.stage); setValueBandFilter(null); setPage(1); }}
                className={`p-4 flex items-center gap-3 border cursor-pointer select-none transition-all hover:shadow-md ${s.ring} ${
                  isSelected ? s.activeRing : ""
                }`}
              >
                <div className={`shrink-0 ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className={`text-xl font-bold leading-none ${s.color}`}>{s.value}</div>
                  <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-1 truncate">
                    {s.label}
                  </div>
                  <div className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {isSelected ? "Click to clear" : "Click to view"}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Part value bands — derived from price, so super-admin only. */}
      {summary && isSuperAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            {
              band: "LOW",
              label: "Low Value Part",
              hint: "Up to ₹5,000",
              value: summary.part_value_low_total || 0,
              color: "text-emerald-600 dark:text-emerald-400",
              ring: "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20",
              activeRing: "ring-2 ring-emerald-600",
              dot: "bg-emerald-500",
            },
            {
              band: "MID",
              label: "Mid Value Part",
              hint: "₹5,001 – ₹10,000",
              value: summary.part_value_mid_total || 0,
              color: "text-amber-600 dark:text-amber-400",
              ring: "border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20",
              activeRing: "ring-2 ring-amber-600",
              dot: "bg-amber-500",
            },
            {
              band: "HIGH",
              label: "High Value Part",
              hint: "₹10,001 – ₹15,000",
              value: summary.part_value_high_total || 0,
              color: "text-orange-600 dark:text-orange-400",
              ring: "border-orange-200 dark:border-orange-800/60 bg-orange-50/40 dark:bg-orange-950/20",
              activeRing: "ring-2 ring-orange-600",
              dot: "bg-orange-500",
            },
            {
              band: "CRITICAL",
              label: "Critical Value Part",
              hint: "Above ₹15,000",
              value: summary.part_value_critical_total || 0,
              color: "text-red-600 dark:text-red-400",
              ring: "border-red-200 dark:border-red-800/60 bg-red-50/40 dark:bg-red-950/20",
              activeRing: "ring-2 ring-red-600",
              dot: "bg-red-500",
            },
          ].map((b) => {
            const isSelected = valueBandFilter === b.band;
            return (
              <Card
                key={b.band}
                onClick={() => { setValueBandFilter(isSelected ? null : b.band); setStageFilter(null); setPage(1); }}
                className={`p-4 flex items-center gap-3 border cursor-pointer select-none transition-all hover:shadow-md ${b.ring} ${
                  isSelected ? b.activeRing : ""
                }`}
              >
                <span className={`shrink-0 w-2.5 h-2.5 rounded-full ${b.dot}`} />
                <div className="min-w-0">
                  <div className={`text-xl font-bold leading-none ${b.color}`}>{b.value}</div>
                  <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-1 truncate">
                    {b.label}
                  </div>
                  <div className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {isSelected ? "Click to clear" : b.hint}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

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
              Overall
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
            placeholder="Search HP Stock..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>

        <div className="relative w-full sm:w-44">
          <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setPage(1); }}
            className="pl-9 pr-8"
          />
          {selectedDate && (
            <button
              onClick={() => { setSelectedDate(""); setPage(1); }}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        <Select value={warrantyTrade} onValueChange={(v) => { setWarrantyTrade(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44 bg-white dark:bg-slate-900">
            <SelectValue placeholder="Warranty / Trade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Warranty / Trade</SelectItem>
            {filterOptions.warranty_trade.map((v) => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={partShipmentStatus} onValueChange={(v) => { setPartShipmentStatus(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-52 bg-white dark:bg-slate-900">
            <SelectValue placeholder="Part Shipment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Shipment Status</SelectItem>
            {filterOptions.part_shipment_status.map((v) => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => setAddDialogOpen(true)} className="gap-2 ml-auto">
          <Plus className="w-4 h-4" /> Add Record
        </Button>
      </div>

      <div className="flex justify-start mb-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as "active" | "dc_cut_request" | "closed");
            setStageFilter(null);
            setValueBandFilter(null);
            setPage(1);
          }}
          className="w-full sm:w-[500px]"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="text-sm font-medium">
              Active Cases
            </TabsTrigger>
            <TabsTrigger value="dc_cut_request" className="text-sm font-medium">
              DC Cut Request
            </TabsTrigger>
            <TabsTrigger value="closed" className="text-sm font-medium">
              Closed Cases
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {!loading && data.length === 0 && !debouncedSearch ? (
        <Card className="p-12 text-center">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-800 dark:text-slate-100 font-medium mb-1">No records found</p>
          <p className="text-sm text-slate-500 mb-4">Add HP stock records to get started.</p>
          <Button onClick={() => setAddDialogOpen(true)}>Add Record</Button>
        </Card>
      ) : (
        <HPStockTable
          data={data}
          loading={loading}
          pagination={pagination}
          onPageChange={setPage}
          onEdit={(item) => setEditingItem(item)}
          onDelete={handleDelete}
          onRowUpdated={handleMutated}
          onViewHistory={(item) => setSelectedHistoryItem(item)}
        />
      )}
        </>
      )}

      <HPStockFormDialog
        open={addDialogOpen || !!editingItem}
        onOpenChange={(v) => { if (!v) { setAddDialogOpen(false); setEditingItem(null); } }}
        editing={editingItem}
        onSuccess={handleMutated}
      />
    </motion.div>
  );
}
