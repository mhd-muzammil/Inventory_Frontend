import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, RefreshCw, Package } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { getDailyRegionCounts, type DailyRegionCountsResponse } from "@/api/hpStock";
import { REGION_LABELS } from "@/types";

const REGION_KEYS = Object.keys(REGION_LABELS) as (keyof typeof REGION_LABELS)[];

// Read-only view: day-by-day, region-wise count of parts calls synced from OpenCall.
// Each HP Stock item is a parts call, so this simply groups them by day + region.
export default function PartsCalls() {
  const [data, setData] = useState<DailyRegionCountsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<number | "">(30);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDailyRegionCounts(days ? { days: Number(days) } : {});
      setData(res);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || "Failed to load parts-call counts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const { dayList, matrix } = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    const daySet = new Set<string>();
    for (const r of data?.rows ?? []) {
      if (!r.day) continue;
      daySet.add(r.day);
      m[r.day] = m[r.day] || {};
      m[r.day][r.region] = (m[r.day][r.region] || 0) + r.count;
    }
    const dl = Array.from(daySet).sort((a, b) => (a < b ? 1 : -1)); // newest first
    return { dayList: dl, matrix: m };
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              Parts Calls — Day by Day
            </h1>
            <p className="text-sm text-slate-500">
              Region-wise count of parts calls synced from OpenCall (read-only)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(e.target.value === "" ? "" : Number(e.target.value))}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-sm bg-white dark:bg-slate-900"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value="">All time</option>
          </select>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Total parts calls</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{data?.total ?? 0}</p>
          </CardContent>
        </Card>
        {REGION_KEYS.map((rk) => (
          <Card key={rk}>
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">{REGION_LABELS[rk]}</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">
                {data?.region_totals?.[rk] ?? 0}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily breakdown matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4" /> Daily breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : dayList.length === 0 ? (
            <p className="text-sm text-slate-500">No parts calls found for this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    {REGION_KEYS.map((rk) => (
                      <TableHead key={rk} className="text-right">
                        {REGION_LABELS[rk]}
                      </TableHead>
                    ))}
                    <TableHead className="text-right font-bold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dayList.map((d) => (
                    <TableRow key={d}>
                      <TableCell className="font-medium">{d}</TableCell>
                      {REGION_KEYS.map((rk) => (
                        <TableCell key={rk} className="text-right">
                          {matrix[d]?.[rk] ?? 0}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-bold">
                        {data?.day_totals?.[d] ?? 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
