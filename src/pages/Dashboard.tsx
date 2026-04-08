import { useState } from "react";
import { motion } from "framer-motion";
import {
  Ticket,
  CalendarDays,
  UserCheck,
  UserX,
  Package,
  FileText,
  Clock,
  CheckCircle2,
  Plus,
  MapPin,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SLABreachFeed } from "@/components/dashboard/SLABreachFeed";
import { useAuthStore } from "@/store/authStore";
import { useWorkflowStore } from "@/store/workflowStore";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "@/hooks/useDashboard";
import { useSLABreaches } from "@/hooks/useSLABreaches";
import { REGION_LABELS } from "@/types";
import type { Region } from "@/types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Metric row item inside a service card
// ---------------------------------------------------------------------------
interface MetricItemProps {
  label: string;
  value: number;
  color: string;
}

function MetricItem({ label, value, color }: MetricItemProps) {
  return (
    <div className={cn("rounded-xl border p-3 text-center", color)}>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wide">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Service summary card (Overall / Today)
// ---------------------------------------------------------------------------
interface ServiceCardProps {
  title: string;
  total: number;
  warranty: number;
  outOfWarranty: number;
  assigned: number;
  unassigned: number;
  partPending: number;
  partOrderPending: number;
  partQuotePending: number;
  cxPending: number;
  completed: number;
  completedLabel: string;
  delay?: number;
}

function ServiceCard({
  title, total, warranty, outOfWarranty, assigned, unassigned,
  partPending, partOrderPending, partQuotePending, cxPending,
  completed, completedLabel, delay = 0,
}: ServiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay * 0.1 }}
      className="flex-1"
    >
      <Card className="overflow-hidden h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-4 text-white">
          <p className="text-sm font-medium opacity-90 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold mt-1">{total}</p>
        </div>

        {/* Metrics grid */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <MetricItem label="Warranty" value={warranty} color="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30" />
            <MetricItem label="Out of Warranty" value={outOfWarranty} color="border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/30" />
            <MetricItem label="Assigned" value={assigned} color="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30" />
            <MetricItem label="Unassigned" value={unassigned} color="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30" />
            <MetricItem label="Part Pending" value={partPending} color="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30" />
            <MetricItem label="Part Order Pending" value={partOrderPending} color="border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/30" />
            <MetricItem label="Part Quote Pending" value={partQuotePending} color="border-pink-200 bg-pink-50/50 dark:border-pink-900 dark:bg-pink-950/30" />
            <MetricItem label="CX Pending" value={cxPending} color="border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/30" />
          </div>

          {/* Completed row */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30 p-3 flex items-center justify-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{completed}</p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{completedLabel}</p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function ServiceCardSkeleton() {
  return (
    <Card className="overflow-hidden flex-1">
      <div className="bg-slate-200 dark:bg-slate-700 px-5 py-4">
        <Skeleton className="h-4 w-32 bg-slate-300 dark:bg-slate-600" />
        <Skeleton className="h-8 w-16 mt-2 bg-slate-300 dark:bg-slate-600" />
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-3 text-center">
              <Skeleton className="h-7 w-10 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto mt-2" />
            </div>
          ))}
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const dismissAlert = useWorkflowStore((s) => s.dismissAlert);
  const [selectedRegion, setSelectedRegion] = useState("");

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const { data: dashData, loading: dashLoading, error: dashError, refetch } = useDashboard(
    isAdmin && selectedRegion ? selectedRegion : undefined
  );
  const { data: breaches = [] } = useSLABreaches();

  const o = dashData?.overview;
  const regions = dashData?.regions ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isAdmin
              ? selectedRegion
                ? `Region: ${REGION_LABELS[selectedRegion as Region] || selectedRegion}`
                : "Overview of all regions"
              : user?.region
                ? `Region: ${REGION_LABELS[user.region as Region] || user.region}`
                : "Welcome back"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Region selector for super admin */}
          {isAdmin && (
            <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1">
              <button
                onClick={() => setSelectedRegion("")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  !selectedRegion
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                All
              </button>
              {Object.entries(REGION_LABELS).map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => setSelectedRegion(code)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    selectedRegion === code
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={refetch} disabled={dashLoading} className="gap-1.5">
            <RefreshCw className={cn("w-3.5 h-3.5", dashLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button onClick={() => navigate("/cso-entry")} className="gap-2">
            <Plus className="w-4 h-4" /> New Ticket
          </Button>
        </div>
      </div>

      {/* Error */}
      {dashError && (
        <Card className="border-red-200 dark:border-red-900/50">
          <CardContent className="flex items-center gap-4 py-6">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300 flex-1">{dashError}</p>
            <Button variant="outline" size="sm" onClick={refetch} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Service Cards (Overall + Today) ────────────────────────────── */}
      {dashLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ServiceCardSkeleton />
          <ServiceCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ServiceCard
            title="Overall Services"
            total={o?.total_tickets ?? 0}
            warranty={o?.warranty_count ?? 0}
            outOfWarranty={o?.out_of_warranty_count ?? 0}
            assigned={o?.assigned_count ?? 0}
            unassigned={o?.unassigned_count ?? 0}
            partPending={o?.part_pending_count ?? 0}
            partOrderPending={o?.part_order_pending_count ?? 0}
            partQuotePending={o?.part_quote_pending_count ?? 0}
            cxPending={o?.cx_pending_count ?? 0}
            completed={o?.completed_count ?? 0}
            completedLabel="Completed"
            delay={0}
          />
          <ServiceCard
            title="Today Services"
            total={o?.tickets_today ?? 0}
            warranty={o?.today_warranty ?? 0}
            outOfWarranty={o?.today_out_of_warranty ?? 0}
            assigned={o?.today_assigned ?? 0}
            unassigned={o?.today_unassigned ?? 0}
            partPending={o?.today_part_pending ?? 0}
            partOrderPending={o?.today_part_order_pending ?? 0}
            partQuotePending={o?.today_part_quote_pending ?? 0}
            cxPending={o?.today_cx_pending ?? 0}
            completed={o?.closed_today ?? 0}
            completedLabel="Today Completed"
            delay={1}
          />
        </div>
      )}

      {/* SLA Breaches + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SLABreachFeed alerts={breaches} onDismiss={dismissAlert} />
        </div>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Quick Actions</h3>
          <div className="space-y-2.5">
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/cso-entry")}>
              <Ticket className="w-4 h-4" /> Create CSO Entry
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/part-request")}>
              <Package className="w-4 h-4" /> Review Part Requests
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/quotation")}>
              <FileText className="w-4 h-4" /> Manage Quotations
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/stock")}>
              <TrendingUp className="w-4 h-4" /> Check Stock
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/reports")}>
              <BarChart3 className="w-4 h-4" /> View Reports
            </Button>
          </div>
        </Card>
      </div>

      {/* Region Breakdown (admin only) */}
      {isAdmin && !dashLoading && regions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Region Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {regions.map((r, i) => (
              <motion.div
                key={r.region}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
              >
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    <span className="font-semibold text-slate-800 dark:text-slate-100 capitalize">
                      {REGION_LABELS[r.region as Region] || r.region}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-3">{r.total_tickets}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">{r.open_tickets} open</Badge>
                    {r.breached > 0 && (
                      <Badge variant="destructive" className="text-xs gap-1">
                        <AlertTriangle className="w-3 h-3" /> {r.breached} breached
                      </Badge>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
