import { useMemo, useState } from "react";
import { format } from "date-fns";
import { PackageCheck, Truck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { markHPStockReceived } from "@/api/hpStock";
import type { HPStockItem } from "@/api/hpStock";
import { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import { REGION_LABELS } from "@/types";
import type { PaginationMeta, Region } from "@/types";

interface Props {
  data: HPStockItem[];
  loading: boolean;
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onReceived: () => void;
}

/**
 * The receiving desk: every part the received-spare filter is holding back.
 *
 * A courier drops a batch of spares, the employee marks them in the Flex portal,
 * and then comes straight here to shoot the good-part photo — but the Flex value
 * only reaches us on the next 15-minute export. This table closes that gap: tick
 * the parts that are physically on the counter, and they move into Active Cases
 * immediately. The sync confirms it on the next pass and can never undo it.
 *
 * Deliberately its own table rather than a mode of HPStockTable: this is a
 * check-them-off worklist, not the full workflow grid, and the main table stays
 * untouched.
 */
export function HPStockInTransitTable({ data, loading, pagination, onPageChange, onReceived }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const allOnPageSelected = useMemo(
    () => data.length > 0 && data.every((item) => selected.has(item.id)),
    [data, selected]
  );

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) data.forEach((item) => next.delete(item.id));
      else data.forEach((item) => next.add(item.id));
      return next;
    });
  };

  const handleMarkReceived = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    setSaving(true);
    try {
      const res = await markHPStockReceived(ids);
      toast({
        title:
          res.updated === 1
            ? "1 part marked as received"
            : `${res.updated} parts marked as received`,
        description: "They are in Active Cases now — ready for the good part photo.",
      });
      setSelected(new Set());
      onReceived();
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12" />
              <TableHead>Case ID / WO</TableHead>
              <TableHead>Customer & Part</TableHead>
              <TableHead>Good Part Number</TableHead>
              <TableHead>Part Order Number</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Flex Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((__, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm">
        <PackageCheck className="w-12 h-12 text-emerald-500/70 mx-auto mb-4" />
        <p className="text-slate-800 dark:text-slate-100 font-medium mb-1">Everything has landed</p>
        <p className="text-sm text-slate-500">
          No parts are waiting on a delivery. New ones appear here as soon as Flex reports them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 px-4 py-3">
        <div className="flex items-center gap-3">
          <Truck className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Waiting on delivery
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tick the parts that are physically on your counter. They move to Active Cases straight away.
            </p>
          </div>
        </div>
        <Button
          onClick={handleMarkReceived}
          disabled={selected.size === 0 || saving}
          className="gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
          {selected.size > 0 ? `Mark ${selected.size} received` : "Mark received"}
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    aria-label="Select every part on this page"
                    checked={allOnPageSelected}
                    onChange={toggleAllOnPage}
                    className="h-4 w-4 accent-indigo-600 cursor-pointer"
                  />
                </TableHead>
                <TableHead className="font-semibold">Case ID / WO</TableHead>
                <TableHead className="font-semibold">Customer & Part</TableHead>
                <TableHead className="font-semibold">Good Part Number</TableHead>
                <TableHead className="font-semibold">Part Order Number</TableHead>
                <TableHead className="font-semibold">Region</TableHead>
                <TableHead className="font-semibold">Flex Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => {
                const isSelected = selected.has(item.id);
                return (
                  <TableRow
                    key={item.id}
                    onClick={() => toggleOne(item.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-indigo-50/70 dark:bg-indigo-950/30"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select case ${item.case_id || item.id}`}
                        checked={isSelected}
                        onChange={() => toggleOne(item.id)}
                        className="h-4 w-4 accent-indigo-600 cursor-pointer"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900 dark:text-slate-100">{item.case_id || "N/A"}</div>
                      <div className="text-xs text-slate-500">{item.work_order_id || "N/A"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {item.customer_name || "N/A"}
                      </div>
                      <div
                        className="text-xs text-slate-500 max-w-[220px] truncate"
                        title={item.part_description || ""}
                      >
                        {item.part_description || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-900 dark:text-slate-100">
                        {item.good_part_number || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-900 dark:text-slate-100">
                        {item.part_order_number || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-fit">
                        {REGION_LABELS[item.region as Region] || item.region || "No Region"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          {item.flex_installed_status || "In transit"}
                        </span>
                        {item.case_created_time && (
                          <span className="text-[11px] text-slate-400">
                            opened {format(new Date(item.case_created_time), "dd/MM/yyyy")}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Showing {(pagination.page - 1) * pagination.per_page + 1}-
            {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page <= 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page >= pagination.pages}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
