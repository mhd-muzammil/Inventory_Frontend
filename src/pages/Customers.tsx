import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, AlertCircle, MapPin, Search, Plus, Clock, CheckCircle2, BarChart2 } from "lucide-react";
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
import { CustomersTable } from "@/components/customers/CustomersTable";
import { CustomerFormDialog } from "@/components/customers/CustomerFormDialog";
import { DeleteConfirmDialog } from "@/components/materials/DeleteConfirmDialog";
import { useCustomers } from "@/hooks/useCustomers";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/authStore";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "@/api/customers";
import { extractApiError } from "@/api/client";
import { REGION_LABELS } from "@/types";
import type { Customer, Region } from "@/types";
import type { CustomerFormData } from "@/lib/validations";

export default function Customers() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin" || user?.role === "super_admin" || user?.role === "manager";
  const userRegion = user?.region || "vellore";

  const [activeTab, setActiveTab] = useState<"active" | "closed">("active");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Dynamic status counts states
  const [activeCount, setActiveCount] = useState(0);
  const [closedCount, setClosedCount] = useState(0);

  const debouncedSearch = useDebounce(search, 300);

  // Parameters for primary query hook
  const queryParams = {
    search: debouncedSearch || undefined,
    page,
    per_page: 8,
    is_closed: activeTab === "closed" ? "true" : "false",
    region: isAdmin
      ? (selectedRegion === "all" ? undefined : selectedRegion)
      : userRegion,
  };

  const { data, loading, error, pagination, refetch } = useCustomers(queryParams);

  // Parallel lightweight fetch to retrieve totals for badges
  const fetchCounts = useCallback(async () => {
    try {
      const apiRegion = isAdmin
        ? (selectedRegion === "all" ? undefined : selectedRegion)
        : userRegion;

      const [activeRes, closedRes] = await Promise.all([
        getCustomers({
          search: debouncedSearch || undefined,
          region: apiRegion,
          is_closed: "false",
          per_page: 1,
        }),
        getCustomers({
          search: debouncedSearch || undefined,
          region: apiRegion,
          is_closed: "true",
          per_page: 1,
        }),
      ]);

      setActiveCount(activeRes.total);
      setClosedCount(closedRes.total);
    } catch (err) {
      console.error("Failed to load customer counts:", err);
    }
  }, [debouncedSearch, selectedRegion, isAdmin, userRegion]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts, data]);

  const handleMutated = () => {
    refetch();
    fetchCounts();
  };

  const handleSubmit = async (formData: CustomerFormData) => {
    setFormLoading(true);
    try {
      if (selectedCustomer) {
        await updateCustomer(selectedCustomer.id.toString(), formData);
        toast({ title: "Customer updated successfully" });
      } else {
        const payload = {
          ...formData,
          region: isAdmin ? (selectedRegion !== "all" ? selectedRegion : userRegion) : userRegion,
        };
        await createCustomer(payload);
        toast({ title: "Customer case synced successfully" });
      }
      setFormOpen(false);
      setSelectedCustomer(null);
      handleMutated();
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    try {
      await deleteCustomer(selectedCustomer.id.toString());
      toast({ title: "Customer case removed successfully" });
      setDeleteOpen(false);
      setSelectedCustomer(null);
      handleMutated();
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4 animate-bounce" />
          <p className="text-slate-800 dark:text-slate-100 font-semibold mb-2">Failed to load synchronized customers</p>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <Button onClick={refetch} className="bg-indigo-600 hover:bg-indigo-700">Try Again</Button>
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
      {/* Premium Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            CSO Customer Accounts
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Live synchronized customers and cases from the CSO Ticket entries.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedCustomer(null);
            setFormOpen(true);
          }}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-colors rounded-xl h-11 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Manual Entry
        </Button>
      </div>

      {/* High-Fidelity Interactive Summary Cards Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Cases */}
        <Card
          onClick={() => {
            setActiveTab("active");
            setPage(1);
          }}
          className={`p-4 border cursor-pointer transition-all duration-300 relative overflow-hidden select-none hover:shadow-md ${
            activeTab === "active"
              ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 ring-1 ring-indigo-500/50"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Active Cases
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              {activeCount}
            </span>
            <span className="text-xs text-slate-400">cases under action</span>
          </div>
          <div className="absolute right-3 bottom-1 opacity-5 dark:opacity-[0.02]">
            <Clock className="w-14 h-14 text-indigo-900" />
          </div>
        </Card>

        {/* Card 2: Closed Cases */}
        <Card
          onClick={() => {
            setActiveTab("closed");
            setPage(1);
          }}
          className={`p-4 border cursor-pointer transition-all duration-300 relative overflow-hidden select-none hover:shadow-md ${
            activeTab === "closed"
              ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 ring-1 ring-emerald-500/50"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Closed Cases
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-855 dark:text-slate-100 tracking-tight text-emerald-600 dark:text-emerald-400">
              {closedCount}
            </span>
            <span className="text-xs text-slate-400">resolved cases</span>
          </div>
          <div className="absolute right-3 bottom-1 opacity-5 dark:opacity-[0.02]">
            <CheckCircle2 className="w-14 h-14 text-emerald-900" />
          </div>
        </Card>

        {/* Card 3: Total Cases */}
        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Total CSO Entry Sync
            </span>
            <BarChart2 className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
              {activeCount + closedCount}
            </span>
            <span className="text-xs text-slate-400">synchronized overall</span>
          </div>
          <div className="absolute right-3 bottom-1 opacity-5 dark:opacity-[0.02]">
            <Users className="w-14 h-14 text-sky-900" />
          </div>
        </Card>

        {/* Card 4: Region Profile Scoping */}
        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Scoping Access
            </span>
            <MapPin className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2.5">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 capitalize">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
              {isAdmin ? "Global Scope (Admin)" : `${REGION_LABELS[userRegion as Region] || userRegion} Region`}
            </span>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              {isAdmin ? "Viewing and managing all offices" : "Locked to local region workspace data"}
            </p>
          </div>
        </Card>
      </div>

      {/* Filter and Search Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-2xl border border-slate-150 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, contact or UID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full sm:w-80 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            />
          </div>

          {/* Region Select (only for Admins/Managers) */}
          {isAdmin && (
            <Select
              value={selectedRegion}
              onValueChange={(val) => {
                setSelectedRegion(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-44 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl h-10 shadow-sm font-medium">
                <SelectValue placeholder="Filter Region" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                <SelectItem value="all" className="font-semibold text-indigo-600 dark:text-indigo-400">All Regions</SelectItem>
                {(Object.entries(REGION_LABELS) as [Region, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="capitalize">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Tab Controls for separation of Closed and Active Cases */}
        <div className="w-full md:w-auto flex justify-end">
          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val as "active" | "closed");
              setPage(1);
            }}
            className="w-full sm:w-[280px]"
          >
            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 p-1">
              <TabsTrigger value="active" className="text-xs font-semibold rounded-lg">
                Active Cases ({activeCount})
              </TabsTrigger>
              <TabsTrigger value="closed" className="text-xs font-semibold rounded-lg">
                Closed ({closedCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Table rendering */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 w-full rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700"></div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900">
          <Users className="w-14 h-14 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-slate-800 dark:text-slate-100 font-bold text-lg mb-1">No synced customer cases</p>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            We couldn't find any synchronized customer tickets matching the filters or query.
          </p>
          <Button
            onClick={() => {
              setSelectedCustomer(null);
              setFormOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 h-11"
          >
            Add Customer Case
          </Button>
        </Card>
      ) : (
        <CustomersTable
          data={data}
          loading={loading}
          pagination={pagination}
          onEdit={(c) => {
            setSelectedCustomer(c);
            setFormOpen(true);
          }}
          onDelete={(c) => {
            setSelectedCustomer(c);
            setDeleteOpen(true);
          }}
          onPageChange={setPage}
        />
      )}

      {/* Add / Edit Dialog Form */}
      <CustomerFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        onSubmit={handleSubmit}
        loading={formLoading}
      />

      {/* Deletion confirmation dialog for admins */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setSelectedCustomer(null);
        }}
        title={`Delete customer record for ${selectedCustomer?.name}?`}
        description="Warning: This action is permanent and will delete the customer sync case. This action cannot be undone."
        onConfirm={handleDelete}
      />
    </motion.div>
  );
}
