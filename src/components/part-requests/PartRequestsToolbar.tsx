import { Plus, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PART_REQUEST_STATUS_LABELS, REGION_LABELS } from "@/types";
import type { UserRole } from "@/types";

interface PartRequestsToolbarProps {
  status: string;
  onStatusChange: (val: string) => void;
  urgency: string;
  onUrgencyChange: (val: string) => void;
  region: string;
  onRegionChange: (val: string) => void;
  userRole: UserRole;
  onAdd: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const URGENCY_OPTIONS: Record<string, string> = {
  normal: "Normal",
  urgent: "Urgent",
  critical: "Critical",
};

export function PartRequestsToolbar({
  status,
  onStatusChange,
  urgency,
  onUrgencyChange,
  region,
  onRegionChange,
  userRole,
  onAdd,
  onClearFilters,
  hasActiveFilters,
}: PartRequestsToolbarProps) {
  const canSeeAllRegions = userRole === "admin" || userRole === "super_admin";
  return (
    <div className="space-y-3 mb-6">
      {/* Row 1: Action buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1" />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-1 text-slate-500">
              <X className="w-4 h-4" /> Clear
            </Button>
          )}
          <Button onClick={onAdd} className="w-full sm:w-auto gap-2">
            <Plus className="w-4 h-4" />
            New Part Request
          </Button>
        </div>
      </div>

      {/* Row 2: Filter dropdowns */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters:</span>
        </div>

        {/* Status */}
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(PART_REQUEST_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Urgency */}
        <Select value={urgency} onValueChange={onUrgencyChange}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Urgencies</SelectItem>
            {Object.entries(URGENCY_OPTIONS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Region (Admins only) */}
        {canSeeAllRegions && (
          <Select value={region} onValueChange={onRegionChange}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {Object.entries(REGION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
