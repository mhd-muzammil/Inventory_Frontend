import { Plus, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { QUOTATION_STATUS_LABELS } from "@/types";

interface QuotationsToolbarProps {
  status: string;
  onStatusChange: (val: string) => void;
  onAddClassic: () => void;
  onAddOrange: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function QuotationsToolbar({
  status,
  onStatusChange,
  onAddClassic,
  onAddOrange,
  onClearFilters,
  hasActiveFilters,
}: QuotationsToolbarProps) {
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
          <Button onClick={onAddClassic} variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 w-full sm:w-auto gap-2 font-semibold shadow-sm">
            <Plus className="w-4 h-4" />
            HP (Quatation)
          </Button>
          <Button onClick={onAddOrange} className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto gap-2 font-semibold shadow-sm">
            <Plus className="w-4 h-4" />
            RTPL (Quatation)
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
            {Object.entries(QUOTATION_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
