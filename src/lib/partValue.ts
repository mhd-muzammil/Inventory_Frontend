// Price bands that flag how much value a part carries. Shared by the HP Stock
// table and the DC Cut approval table so both read the same way.
export const PART_VALUE_BANDS = [
  { max: 5000, label: "Low Value Part", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" },
  { max: 10000, label: "Mid Value Part", className: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
  { max: 15000, label: "High Value Part", className: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400" },
  { max: Infinity, label: "Critical Value Part", className: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" },
];

export type PartValueBand = (typeof PART_VALUE_BANDS)[number];

/** Band for a price, or null when there is no price to classify. */
export const getPartValueBand = (price: number | null | undefined): PartValueBand | null => {
  if (price == null) return null;
  return PART_VALUE_BANDS.find((b) => price <= b.max) ?? null;
};
