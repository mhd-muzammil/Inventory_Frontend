import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Ticket as TicketIcon, Plus, AlertCircle, MapPin, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketFormDialog } from "@/components/tickets/TicketFormDialog";
import { TicketsTable } from "@/components/tickets/TicketsTable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createTicket, getTickets } from "@/api/tickets";
import { getRegionComparison } from "@/api/dashboard";
import { toast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/authStore";
import { REGION_LABELS } from "@/types";
import type { Ticket, PaginationMeta, Region, RegionStats } from "@/types";

export default function CSOEntry() {
  const [formOpen, setFormOpen] = useState(false);
  const [data, setData] = useState<Ticket[]>([]);
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [ordering, setOrdering] = useState("-created_at");
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0, page: 1, per_page: 20, pages: 1,
  });
  const [activeTab, setActiveTab] = useState<"active" | "closed">("active");

  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [regionStats, setRegionStats] = useState<RegionStats[] | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | undefined>(undefined);

  const fetchRegionStats = useCallback(async () => {
    try {
      const res = await getRegionComparison();
      setRegionStats(res);
    } catch {
      // silent
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    if (dataRef.current.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await getTickets({
        page,
        ordering,
        region: selectedRegion,
        per_page: 20,
        is_closed: activeTab === "closed",
      });
      setData(res.items);
      setPagination({ total: res.total, page: res.page, per_page: res.per_page, pages: res.pages });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch tickets");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, ordering, selectedRegion, activeTab]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  useEffect(() => { fetchRegionStats(); }, [fetchRegionStats]);

  const handleSort = (field: string) => {
    setOrdering((prev) => (prev === field ? `-${field}` : field));
  };

  const handleSubmit = async (formData: any) => {
    const cleaned: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(formData)) {
      if (val !== null && val !== undefined && val !== "") {
        cleaned[key] = val;
      }
    }
    await createTicket(cleaned);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">CSO Entry</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isAdmin
              ? "Viewing all regions"
              : user?.region
                ? `Region: ${REGION_LABELS[user.region as Region] || user.region}`
                : "Create and manage service tickets."}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2 sm:w-auto w-full">
          <Plus className="w-4 h-4" /> Add Ticket
        </Button>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────── */}
      {isAdmin && regionStats && regionStats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          {regionStats.map((r) => {
            const isSelected = selectedRegion === r.region;
            return (
              <Card
                key={r.region}
                onClick={() => { setSelectedRegion(isSelected ? undefined : (r.region as Region)); setPage(1); }}
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
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{r.open_tickets || 0}</span>
                    <div className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active</div>
                  </div>
                  <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700/50 mx-0.5" />
                  <div className="text-center">
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{(r.total_tickets || 0) - (r.open_tickets || 0)}</span>
                    <div className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Closed</div>
                  </div>
                </div>
              </Card>
            );
          })}
          <Card
            onClick={() => { setSelectedRegion(undefined); setPage(1); }}
            className={`p-4 flex flex-col items-center gap-1 border cursor-pointer hover:bg-indigo-100/50 dark:hover:bg-indigo-900/40 transition-all select-none bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 ${
              selectedRegion === undefined ? "ring-2 ring-indigo-600" : ""
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
              Total
            </span>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="text-center">
                <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                  {regionStats.reduce((acc, r) => acc + (r.open_tickets || 0), 0)}
                </span>
                <div className="text-[9px] font-medium text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-wider">Active</div>
              </div>
              <div className="w-[1px] h-6 bg-indigo-200 dark:bg-indigo-800/50 mx-0.5" />
              <div className="text-center">
                <span className="text-sm font-semibold text-indigo-600/80 dark:text-indigo-400/80">
                  {regionStats.reduce((acc, r) => acc + ((r.total_tickets || 0) - (r.open_tickets || 0)), 0)}
                </span>
                <div className="text-[9px] font-medium text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-wider">Closed</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Non-Admin Region Summary ─────────────────────────────────── */}
      {!isAdmin && user?.region && regionStats && regionStats.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          {(() => {
            const r = regionStats.find((st) => st.region === user.region);
            if (!r) return null;
            return (
              <Card className="p-4 flex flex-col items-center gap-1 border select-none min-w-[180px] border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm">
                <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {REGION_LABELS[user.region as Region] || user.region}
                </span>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="text-center">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{r.open_tickets || 0}</span>
                    <div className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active</div>
                  </div>
                  <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700/50 mx-0.5" />
                  <div className="text-center">
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{(r.total_tickets || 0) - (r.open_tickets || 0)}</span>
                    <div className="text-[9px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Closed</div>
                  </div>
                </div>
              </Card>
            );
          })()}
        </div>
      )}

      <div className="flex justify-start mb-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as "active" | "closed");
            setPage(1);
          }}
          className="w-full sm:w-[400px]"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="text-sm font-medium">
              Active Cases
            </TabsTrigger>
            <TabsTrigger value="closed" className="text-sm font-medium">
              Closed Cases
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Error state */}
      {error && (
        <Card className="p-8 text-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-slate-800 dark:text-slate-100 font-medium mb-1">Failed to load tickets</p>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <Button onClick={fetchTickets} variant="outline">Try Again</Button>
        </Card>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && data.length === 0 && (
        <Card className="p-12 text-center">
          <TicketIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-800 dark:text-slate-100 font-medium mb-1">No tickets yet</p>
          <p className="text-sm text-slate-500 mb-4">Create your first service ticket to get started.</p>
          <Button onClick={() => setFormOpen(true)}>Create Ticket</Button>
        </Card>
      )}

      {/* Tickets table */}
      {!loading && !error && data.length > 0 && (
        <TicketsTable
          data={data}
          loading={false}
          pagination={pagination}
          onPageChange={setPage}
          onSort={handleSort}
          onRefresh={fetchTickets}
        />
      )}

      <TicketFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        onVerifiedSubmit={() => { setFormOpen(false); fetchTickets(); }}
      />
    </motion.div>
  );
}
