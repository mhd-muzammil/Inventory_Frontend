import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Coins, AlertCircle, Plus, Search, MapPin, Globe, Trash2, Calendar, FileText, User as UserIcon, IndianRupee } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import client, { extractApiError } from "@/api/client";
import { toast } from "@/components/ui/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuthStore } from "@/store/authStore";
import { REGION_LABELS } from "@/types";
import type { ActivityCharge, PaginationMeta, Region } from "@/types";

export default function ActivityCharges() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ActivityCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    per_page: 20,
    pages: 1,
  });

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formRegion, setFormRegion] = useState<string>("");
  const [formAmount, setFormAmount] = useState("");
  const [formRemarks, setFormRemarks] = useState("");

  const debouncedSearch = useDebounce(search, 400);

  // Initialize region in form based on user profile
  useEffect(() => {
    if (user?.region) {
      setFormRegion(user.region);
    } else {
      setFormRegion("vellore");
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page,
        per_page: 20,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (isAdmin && selectedRegion !== "all") params.region = selectedRegion;

      const response = await client.get<{ items: ActivityCharge[] } & PaginationMeta>(
        "/activity-charges/",
        { params }
      );
      setData(response.data.items);
      setPagination({
        total: response.data.total,
        page: response.data.page,
        per_page: response.data.per_page,
        pages: response.data.pages,
      });
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, isAdmin, selectedRegion]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast({ title: "Please enter an activity name", variant: "destructive" });
      return;
    }
    if (!formAmount || isNaN(Number(formAmount)) || Number(formAmount) <= 0) {
      toast({ title: "Please enter a valid amount greater than 0", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await client.post("/activity-charges/", {
        activity_name: formName.trim(),
        region: formRegion,
        amount: Number(formAmount),
        remarks: formRemarks.trim(),
      });
      toast({ title: "Activity charge logged successfully" });
      setAddDialogOpen(false);
      // Reset form
      setFormName("");
      setFormAmount("");
      setFormRemarks("");
      if (user?.region) setFormRegion(user.region);
      setPage(1);
      fetchData();
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this activity charge?")) return;
    try {
      await client.delete(`/activity-charges/${id}/`);
      toast({ title: "Activity charge deleted successfully" });
      fetchData();
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    }
  };

  // Calculate sum metrics from current dataset
  const totalAmount = data.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-1 sm:p-2 space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Coins className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Activity Charges
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track and log regional operational charges and expenses.
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Log New Charge
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-6 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden">
          <div className="absolute right-4 top-4 w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-full flex items-center justify-center">
            <IndianRupee className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Total (Current Page)
          </p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">
            ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Sum of all charges displayed below.
          </p>
        </Card>

        <Card className="p-6 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden">
          <div className="absolute right-4 top-4 w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center">
            <Globe className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Active Region
          </p>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-3 uppercase">
            {user?.region ? REGION_LABELS[user.region as Region] : "All Regions"}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Role: {user?.role ? user.role.replace("_", " ") : "N/A"}
          </p>
        </Card>

        <Card className="p-6 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden">
          <div className="absolute right-4 top-4 w-12 h-12 bg-amber-50 dark:bg-amber-950/40 rounded-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Record Count
          </p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">
            {pagination.total}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Total number of entries stored.
          </p>
        </Card>
      </div>

      {/* Toolbar Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search activities or remarks..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 h-10 w-full bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 focus:ring-indigo-500"
          />
        </div>

        {isAdmin && (
          <Select
            value={selectedRegion}
            onValueChange={(v) => {
              setSelectedRegion(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-48 h-10 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200">
              <SelectValue placeholder="All Regions" />
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
      </div>

      {/* Table Section */}
      {error ? (
        <Card className="p-8 border border-red-100 bg-red-50/20 dark:border-red-900/30 dark:bg-red-950/10 text-center max-w-lg mx-auto rounded-xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="font-semibold text-slate-900 dark:text-white">Failed to load activity charges</p>
          <p className="text-sm text-slate-500 mt-1 mb-4">{error}</p>
          <Button onClick={fetchData} className="bg-red-600 hover:bg-red-700 text-white font-medium">
            Try Again
          </Button>
        </Card>
      ) : loading ? (
        <div className="space-y-4 py-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <Card className="p-16 border border-dashed border-slate-200 dark:border-slate-800 text-center rounded-2xl bg-white dark:bg-slate-900">
          <Coins className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No activity charges logged</h3>
          <p className="text-sm text-slate-400 mt-1 mb-6 max-w-sm mx-auto">
            Log operational costs or charges associated with the region to organize your transactions.
          </p>
          <Button onClick={() => setAddDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
            Log First Charge
          </Button>
        </Card>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Activity</th>
                  <th className="px-6 py-4">Ticket No.</th>
                  <th className="px-6 py-4">Region</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Logged By</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Remarks</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm text-slate-700 dark:text-slate-300">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-100">
                      {item.activity_name}
                    </td>
                    <td className="px-6 py-4 text-indigo-600 dark:text-indigo-400 font-medium">
                      {item.ticket_number || <span className="text-slate-400 text-xs italic">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {item.region_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">
                      ₹{Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        {item.created_by_detail?.full_name || "System"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(item.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-500" title={item.remarks}>
                      {item.remarks || "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(isAdmin || item.created_by === user?.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                Showing Page <span className="font-semibold text-slate-900 dark:text-white">{pagination.page}</span> of{" "}
                <span className="font-semibold text-slate-900 dark:text-white">{pagination.pages}</span>
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === pagination.pages}
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  className="h-8"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialog for Logging Charges */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-150 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
              Log Activity Charge
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm">
              Log an operation or labor charge. Filled details will be immediately visible to super admins and managers.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 my-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Activity Name
              </label>
              <Input
                placeholder="e.g. Courier charges, Local travel"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Region
                </label>
                {isAdmin ? (
                  <Select value={formRegion} onValueChange={setFormRegion}>
                    <SelectTrigger className="h-10 bg-white dark:bg-slate-950">
                      <SelectValue placeholder="Region" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(REGION_LABELS) as [Region, string][]).map(([val, label]) => (
                        <SelectItem key={val} value={val}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={REGION_LABELS[formRegion as Region] || formRegion} disabled className="h-10 bg-slate-50 dark:bg-slate-950 opacity-80" />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Amount (₹)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Remarks
              </label>
              <Textarea
                placeholder="Describe details of the operation/charge (optional)"
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <DialogFooter className="pt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
                className="h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-10 px-5 shadow-sm"
              >
                {submitting ? "Saving..." : "Log Charge"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
