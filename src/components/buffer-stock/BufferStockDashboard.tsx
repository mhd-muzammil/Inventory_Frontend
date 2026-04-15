import { useState, useEffect } from "react";
import {
  Package, AlertTriangle, FileCheck, ArrowRightLeft,
  Clock, ShieldCheck, RotateCcw, Boxes,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getBufferStockDashboard } from "@/api/bufferStock";
import type { BufferStockDashboard as DashboardData } from "@/types/bufferStock";

export function BufferStockDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBufferStockDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const kpis = [
    { label: "Total Stock Items", value: data.total_stock_items, icon: Package, color: "text-blue-600" },
    { label: "Total Quantity", value: data.total_qty, icon: Boxes, color: "text-indigo-600" },
    { label: "Low Stock Alerts", value: data.low_stock_count, icon: AlertTriangle, color: "text-amber-600" },
    { label: "Open Cases", value: data.open_cases, icon: FileCheck, color: "text-cyan-600" },
    { label: "IW Cases", value: data.iw_cases, icon: ShieldCheck, color: "text-green-600" },
    { label: "OOW Cases", value: data.oow_cases, icon: Clock, color: "text-orange-600" },
    { label: "Pending Approvals", value: data.pending_approvals, icon: ShieldCheck, color: "text-red-600" },
    { label: "Pending Transfers", value: data.pending_transfers, icon: ArrowRightLeft, color: "text-purple-600" },
    { label: "In-Transit", value: data.in_transit_transfers, icon: ArrowRightLeft, color: "text-blue-500" },
    { label: "Pending Replenishments", value: data.pending_replenishments, icon: RotateCcw, color: "text-teal-600" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {kpi.value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{kpi.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Region Stock Summary */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">
          Region-wise Stock Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.region_stock.map((rs) => (
            <div
              key={rs.region}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700"
            >
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-100">
                  {rs.region_display}
                </p>
                <p className="text-xs text-slate-500">
                  {rs.total_items} items / {rs.total_qty} units
                </p>
              </div>
              <div className="flex items-center gap-2">
                {rs.low_stock_count > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {rs.low_stock_count} low
                  </Badge>
                )}
                <Badge variant="secondary">{rs.total_reserved} reserved</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Cases by Status */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">
          Cases by Status
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.cases_by_status).map(([status, count]) => (
            <Badge key={status} variant="outline" className="text-sm py-1 px-3">
              {status.replace(/_/g, " ")} — <strong>{count}</strong>
            </Badge>
          ))}
          {Object.keys(data.cases_by_status).length === 0 && (
            <p className="text-sm text-slate-400">No cases yet</p>
          )}
        </div>
      </Card>
    </div>
  );
}
