// The single list of sections a user can be granted access to. Mirrors the
// sidebar nav, and is the source for the permission checkboxes in user/manager
// management, the sidebar filter, and the route guard — so a new section only
// has to be added here (and to the backend's backfill list) once.
export const SECTIONS: { path: string; label: string }[] = [
  { path: "/", label: "Dashboard" },
  { path: "/customers", label: "Customers" },
  { path: "/cso-entry", label: "CSO Entry" },
  { path: "/engineers", label: "Engineers" },
  { path: "/quotation", label: "Quotation" },
  { path: "/part-request", label: "Part Request" },
  { path: "/invoice", label: "Invoice" },
  { path: "/stock", label: "RTPL Stock" },
  { path: "/hp-stock", label: "HP Stock" },
  { path: "/hp-stock-rma", label: "HP Stock RMA" },
  { path: "/buffer", label: "Buffer" },
  { path: "/purchase-order", label: "Purchase Order" },
  { path: "/reports", label: "Report" },
  { path: "/activity-charges", label: "Activity Charges" },
  { path: "/settings", label: "Settings" },
];

export const SECTION_PATHS = SECTIONS.map((s) => s.path);

/** Roles that see everything — they are never section-gated and cannot lock themselves out. */
export const BYPASS_ROLES = ["super_admin", "admin"];

export const bypassesSectionCheck = (role?: string | null) =>
  !!role && BYPASS_ROLES.includes(role);

/**
 * Can `user` open `path`?
 *
 * Admins bypass. Everyone else needs the section in `allowed_sections`. Paths that
 * are not sections of their own (ticket details, quotation sub-pages, …) inherit
 * access from the section they belong to.
 */
export const canAccessSection = (
  user: { role?: string | null; allowed_sections?: string[] } | null | undefined,
  path: string,
): boolean => {
  if (!user) return false;
  if (bypassesSectionCheck(user.role)) return true;

  const allowed = user.allowed_sections || [];

  // Sub-pages inherit from their parent section (longest matching prefix wins,
  // so "/quotation/hp" is covered by "/quotation").
  const owner = SECTION_PATHS
    .filter((p) => p !== "/" && (path === p || path.startsWith(`${p}/`)))
    .sort((a, b) => b.length - a.length)[0];

  if (owner) return allowed.includes(owner);
  if (path === "/") return allowed.includes("/");

  // Ticket details belong to whichever of these the user can reach.
  if (path.startsWith("/tickets/")) {
    return allowed.includes("/cso-entry") || allowed.includes("/part-request");
  }

  // Not a gated section (e.g. /buffer-stock) — leave it alone.
  return true;
};

/** Where to send someone who lands on a section they cannot open. */
export const fallbackPath = (allowed: string[] | undefined): string => {
  const list = allowed || [];
  if (list.includes("/")) return "/";
  return list[0] || "/settings";
};
