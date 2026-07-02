import { useState, useEffect, useCallback } from "react";
import type { CategoryBreakdown } from "@/types";
import { getSummary, getByCategory, getRecentMovements, type ReportSummary, type UnifiedRecentMovements } from "@/api/reports";

export function useReports() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [movements, setMovements] = useState<UnifiedRecentMovements | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, categoriesData, movementsData] = await Promise.all([
        getSummary(),
        getByCategory(),
        getRecentMovements(),
      ]);
      setSummary(summaryData);
      setCategories(categoriesData);
      setMovements(movementsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { summary, categories, movements, loading, error, refetch: fetch };
}
