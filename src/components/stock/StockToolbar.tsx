import { Search, Plus, SlidersHorizontal, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface StockToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  categories: string[];
  lowStockOnly: boolean;
  onLowStockToggle: () => void;
  onAdd: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  isAdmin?: boolean;
  region?: string;
  onRegionChange?: (val: string) => void;
}

export function StockToolbar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  lowStockOnly,
  onLowStockToggle,
  onAdd,
  onClearFilters,
  hasActiveFilters,
  isAdmin,
  region,
  onRegionChange,
}: StockToolbarProps) {
  return (
    <div className="space-y-3 mb-6">
      {/* Row 1: Search + Add button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by part number, name..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-1 text-slate-500">
              <X className="w-4 h-4" /> Clear
            </Button>
          )}
          <Button onClick={onAdd} className="w-full sm:w-auto gap-2">
            <Plus className="w-4 h-4" />
            Add Stock Item
          </Button>
        </div>
      </div>

      {/* Row 2: Filter dropdowns + low stock toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters:</span>
        </div>

        {/* Category */}
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Region (Admin Only) */}
        {isAdmin && region !== undefined && onRegionChange && (
          <Select value={region} onValueChange={onRegionChange}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="chennai">Chennai</SelectItem>
              <SelectItem value="vellore">Vellore</SelectItem>
              <SelectItem value="salem">Salem</SelectItem>
              <SelectItem value="hosur">Hosur</SelectItem>
              <SelectItem value="kanchipuram">Kanchipuram</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Low Stock Toggle */}
        <Button
          variant={lowStockOnly ? "default" : "outline"}
          size="sm"
          onClick={onLowStockToggle}
          className={cn(
            "gap-2",
            lowStockOnly && "bg-amber-600 hover:bg-amber-700 text-white"
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          Low Stock Only
        </Button>
      </div>
    </div>
  );
}
