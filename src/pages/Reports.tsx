import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  RefreshCw,
  AlertCircle,
  Warehouse,
  Package,
  History,
  DollarSign,
  Layers,
  TrendingUp,
  TrendingDown,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  User,
  MapPin,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useReports } from "@/hooks/useReports";
import { CategoryPieChart } from "@/components/reports/CategoryPieChart";
import { StockByCategoryChart } from "@/components/reports/StockByCategoryChart";
import { formatCurrency, formatNumber } from "@/lib/utils";

// ---------------------------------------------------------------------------
// KPICard Component for premium styling
// ---------------------------------------------------------------------------
interface ReportCardProps {
  title: string;
  value: string | number;
  icon: any;
  color: "blue" | "green" | "amber" | "purple" | "rose" | "indigo";
  subtitle?: string;
}

function ReportMiniCard({ title, value, icon: Icon, color, subtitle }: ReportCardProps) {
  const colorMap = {
    blue: "from-blue-500/10 to-cyan-500/5 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50",
    green: "from-emerald-500/10 to-teal-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50",
    amber: "from-amber-500/10 to-orange-500/5 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50",
    purple: "from-purple-500/10 to-indigo-500/5 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50",
    rose: "from-rose-500/10 to-pink-500/5 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50",
    indigo: "from-indigo-500/10 to-blue-500/5 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50",
  };

  return (
    <Card className={`overflow-hidden border bg-gradient-to-br ${colorMap[color]} shadow-sm`}>
      <CardContent className="p-5 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {value}
          </p>
          {subtitle && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {subtitle}
            </p>
          )}
        </div>
        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50">
          <Icon className="w-5 h-5" />
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Reusable loading skeleton
// ---------------------------------------------------------------------------
function KPISkeletonRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="border-red-200 dark:border-red-900/50">
      <CardContent className="flex items-center gap-4 py-6">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">Failed to load data</p>
          <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5 truncate">{message}</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5 flex-shrink-0">
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function SectionSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className={`w-full ${height}`} />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Reports Page
// ---------------------------------------------------------------------------
export default function Reports() {
  const { summary, categories, movements, loading, error, refetch } = useReports();
  const [feedTab, setFeedTab] = useState<"rtpl" | "hp" | "buffer">("rtpl");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 pb-10"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header + Refresh Button                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-500" />
            Overall Inventory Reports
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Comprehensive dynamic report tracking RTPL Stock, HP Stock, and Buffer Stock
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} disabled={loading} className="gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && <ErrorCard message={error} onRetry={refetch} />}

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 1: RTPL Inventory (General Stock)                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-slate-800">
          <Warehouse className="w-5 h-5 text-indigo-500" />
          RTPL Stock Summary
        </h2>
        {loading ? (
          <KPISkeletonRow />
        ) : summary?.rtpl ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportMiniCard
              title="Inventory Value"
              value={formatCurrency(summary.rtpl.inventory_value)}
              icon={DollarSign}
              color="indigo"
              subtitle="Current hand-on stock valuation"
            />
            <ReportMiniCard
              title="Total Inflow"
              value={formatNumber(summary.rtpl.total_inflow)}
              icon={TrendingUp}
              color="green"
              subtitle="Stock entries & adjustments in"
            />
            <ReportMiniCard
              title="Total Outflow"
              value={formatNumber(summary.rtpl.total_outflow)}
              icon={TrendingDown}
              color="amber"
              subtitle="Stock issuances & adjustments out"
            />
            <ReportMiniCard
              title="Total Categories"
              value={summary.rtpl.category_count}
              icon={Layers}
              color="purple"
              subtitle="Distinct stock classifications"
            />
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400">No RTPL data found</div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 2: HP Stock Summary                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-slate-800">
          <Wrench className="w-5 h-5 text-emerald-500" />
          HP Stock Summary
        </h2>
        {loading ? (
          <KPISkeletonRow />
        ) : summary?.hp_stock ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportMiniCard
              title="Total HP Cases"
              value={summary.hp_stock.total_items}
              icon={Package}
              color="blue"
              subtitle="Total cases registered"
            />
            <ReportMiniCard
              title="Issued to Engineer"
              value={summary.hp_stock.issued}
              icon={User}
              color="indigo"
              subtitle="Active parts with engineers"
            />
            <ReportMiniCard
              title="Defective Returns"
              value={summary.hp_stock.defective}
              icon={AlertTriangle}
              color="rose"
              subtitle="Old faulty parts returned"
            />
            <ReportMiniCard
              title="Closed Cases"
              value={summary.hp_stock.closed}
              icon={CheckCircle2}
              color="green"
              subtitle="Cases fully completed & closed"
            />
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400">No HP Stock data found</div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 3: Buffer Parts Summary                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-slate-800">
          <Layers className="w-5 h-5 text-amber-500" />
          Buffer Parts Summary
        </h2>
        {loading ? (
          <KPISkeletonRow />
        ) : summary?.buffer_stock ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportMiniCard
              title="Total Buffer Parts"
              value={summary.buffer_stock.total_parts}
              icon={Package}
              color="purple"
              subtitle="Distinct buffer entries"
            />
            <ReportMiniCard
              title="Available Quantity"
              value={summary.buffer_stock.usable}
              icon={CheckCircle2}
              color="green"
              subtitle="Usable parts ready to deploy"
            />
            <ReportMiniCard
              title="Faulty / Defective"
              value={summary.buffer_stock.defective}
              icon={ShieldAlert}
              color="rose"
              subtitle="Parts tagged as defective"
            />
            <ReportMiniCard
              title="Engineer Issued"
              value={summary.buffer_stock.taken_by_engineer}
              icon={User}
              color="amber"
              subtitle="Parts currently taken by engineers"
            />
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400">No Buffer Stock data found</div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Charts Row for RTPL Category Distribution                        */}
      {/* ------------------------------------------------------------------ */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionSkeleton height="h-[300px]" />
          <SectionSkeleton height="h-[300px]" />
        </div>
      ) : categories && categories.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryPieChart data={categories} />
          <StockByCategoryChart data={categories} />
        </div>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 4: Live happening feeds (Tabbed Feeds)                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800 gap-4">
          <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            Live Happened Logs (Activity Feed)
          </h2>

          {/* Feed Switcher buttons */}
          <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 p-1">
            <button
              onClick={() => setFeedTab("rtpl")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                feedTab === "rtpl"
                  ? "bg-indigo-600 text-white shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              RTPL Stock
            </button>
            <button
              onClick={() => setFeedTab("hp")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                feedTab === "hp"
                  ? "bg-indigo-600 text-white shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              HP Stock
            </button>
            <button
              onClick={() => setFeedTab("buffer")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                feedTab === "buffer"
                  ? "bg-indigo-600 text-white shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              Buffer Parts
            </button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <AnimatePresence mode="wait">
              {loading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : feedTab === "rtpl" ? (
                <motion.div
                  key="rtpl"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-x-auto"
                >
                  {movements?.rtpl && movements.rtpl.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-6">Part Info</TableHead>
                          <TableHead className="text-center">Type</TableHead>
                          <TableHead className="text-center">Quantity</TableHead>
                          <TableHead>Performed By</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead className="text-right pr-6">Timestamp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movements.rtpl.map((m) => {
                          const isPositive = ["in", "buffer_in", "released"].includes(m.movement_type) || (m.movement_type === "adjustment" && m.quantity > 0);
                          const isNegative = ["out", "buffer_out", "reserved"].includes(m.movement_type) || (m.movement_type === "adjustment" && m.quantity < 0);
                          return (
                            <TableRow key={m.id}>
                              <TableCell className="pl-6">
                                <div className="font-semibold text-slate-800 dark:text-slate-200">{m.part_name}</div>
                                <div className="text-xs text-slate-400 font-mono">{m.part_number}</div>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  m.movement_type === "in" || m.movement_type === "buffer_in"
                                    ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                                    : m.movement_type === "out" || m.movement_type === "buffer_out"
                                      ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                                      : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                                }`}>
                                  {m.movement_type.replace("_", " ")}
                                </span>
                              </TableCell>
                              <TableCell className={`text-center font-bold font-mono ${
                                isPositive ? "text-green-600 dark:text-green-400" : isNegative ? "text-red-500" : "text-slate-600"
                              }`}>
                                {isPositive ? `+${m.quantity}` : m.quantity}
                              </TableCell>
                              <TableCell className="font-medium text-slate-700 dark:text-slate-300">{m.performed_by}</TableCell>
                              <TableCell className="max-w-[200px] truncate text-slate-500 text-xs">
                                {m.notes || <span className="text-slate-300 italic">No notes</span>}
                              </TableCell>
                              <TableCell className="text-right text-xs text-slate-400 pr-6">
                                {new Date(m.created_at).toLocaleString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-12 text-center text-slate-400 italic">No RTPL movements recorded</div>
                  )}
                </motion.div>
              ) : feedTab === "hp" ? (
                <motion.div
                  key="hp"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-x-auto"
                >
                  {movements?.hp && movements.hp.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-6">Case / WO ID</TableHead>
                          <TableHead>Current Status</TableHead>
                          <TableHead>Engineer Info</TableHead>
                          <TableHead className="text-center">Region</TableHead>
                          <TableHead>Assigned By</TableHead>
                          <TableHead className="text-right pr-6">Last Updated</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movements.hp.map((h) => (
                          <TableRow key={h.id}>
                            <TableCell className="pl-6">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">Case: {h.case_id || "--"}</div>
                              <div className="text-xs text-slate-400 font-mono">WO: {h.work_order_id || "--"}</div>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                {h.status_display}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                              {h.engineer_name || <span className="text-slate-300 italic">Not Assigned</span>}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="capitalize">
                                {h.region || "unassigned"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-500 text-xs">{h.created_by}</TableCell>
                            <TableCell className="text-right text-xs text-slate-400 pr-6">
                              {new Date(h.updated_at).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-12 text-center text-slate-400 italic">No HP stock updates recorded</div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="buffer"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-x-auto"
                >
                  {movements?.buffer && movements.buffer.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-6">Part Info</TableHead>
                          <TableHead className="text-center">Quantity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Engineer Name</TableHead>
                          <TableHead className="text-center">Region</TableHead>
                          <TableHead className="text-right pr-6">Created At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movements.buffer.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell className="pl-6">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">{b.part_name}</div>
                              <div className="text-xs text-slate-400 font-mono">{b.part_number}</div>
                            </TableCell>
                            <TableCell className="text-center font-semibold font-mono">{b.quantity}</TableCell>
                            <TableCell>
                              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                                {b.status_display.replace("_", " ")}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                              {b.engineer_name || <span className="text-slate-300 italic">Not Claimed</span>}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="capitalize">
                                {b.region || "unassigned"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-xs text-slate-400 pr-6">
                              {new Date(b.created_at).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-12 text-center text-slate-400 italic">No Buffer parts recorded</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
