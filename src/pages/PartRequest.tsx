import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Wrench, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PartRequestsToolbar } from "@/components/part-requests/PartRequestsToolbar";
import { PartRequestsTable } from "@/components/part-requests/PartRequestsTable";
import { usePartRequests } from "@/hooks/usePartRequests";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/components/ui/use-toast";
import { approvePartRequest, rejectPartRequest } from "@/api/partRequests";
import { extractApiError } from "@/api/client";
import type { PartRequestStatus, PartUrgency, Region } from "@/types";

export default function PartRequest() {
  const [status, setStatus] = useState("all");
  const [urgency, setUrgency] = useState("all");
  const [region, setRegion] = useState("all");
  const [page, setPage] = useState(1);

  const user = useAuthStore((s) => s.user);
  const userRole = user?.role ?? "engineer";

  const filters = useMemo(
    () => ({
      status: status !== "all" ? (status as PartRequestStatus) : undefined,
      urgency: urgency !== "all" ? (urgency as PartUrgency) : undefined,
      region: region !== "all" ? (region as Region) : undefined,
      page,
      per_page: 20,
    }),
    [status, urgency, region, page],
  );

  const { data, loading, error, pagination, refetch } = usePartRequests(filters);

  const hasActiveFilters = status !== "all" || urgency !== "all" || region !== "all";

  const handleClearFilters = () => {
    setStatus("all");
    setUrgency("all");
    setRegion("all");
    setPage(1);
  };

  const handleApprove = async (id: number | string, comment?: string) => {
    try {
      await approvePartRequest(id, comment);
      toast({ title: "Part request approved successfully" });
      refetch();
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    }
  };

  const handleReject = async (id: number | string, reason: string) => {
    try {
      await rejectPartRequest(id, reason);
      toast({ title: "Part request rejected" });
      refetch();
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-800 dark:text-slate-100 font-medium mb-2">
            Failed to load part requests
          </p>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Part Requests
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage part requests and approvals.
        </p>
      </div>

      <PartRequestsToolbar
        status={status}
        onStatusChange={(v) => { setStatus(v); setPage(1); }}
        urgency={urgency}
        onUrgencyChange={(v) => { setUrgency(v); setPage(1); }}
        region={region}
        onRegionChange={(v) => { setRegion(v); setPage(1); }}
        userRole={userRole}
        onAdd={() => {}}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {!loading && data.length === 0 ? (
        <Card className="p-12 text-center">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-800 dark:text-slate-100 font-medium mb-1">
            No part requests found
          </p>
          <p className="text-sm text-slate-500 mb-4">
            Part requests from engineers will appear here when tickets enter the
            parts workflow.
          </p>
        </Card>
      ) : (
        <PartRequestsTable
          data={data}
          loading={loading}
          pagination={pagination}
          onPageChange={setPage}
          userRole={userRole}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </motion.div>
  );
}
