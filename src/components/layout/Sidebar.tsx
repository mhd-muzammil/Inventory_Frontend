import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  FileQuestion,
  Wrench,
  Receipt,
  Warehouse,
  Layers,
  ShoppingCart,
  BarChart3,
  Settings,
  ShieldCheck,
  ShieldAlert,
  HardHat,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const navLinks = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/cso-entry", label: "CSO Entry", icon: FileText },
  { to: "/engineers", label: "Engineers", icon: HardHat },
  { to: "/quotation", label: "Quotation", icon: FileQuestion },
  { to: "/part-request", label: "Part Request", icon: Wrench },
  { to: "/invoice", label: "Invoice", icon: Receipt },
  { to: "/stock", label: "Stock", icon: Warehouse },
  { to: "/buffer", label: "Buffer", icon: Layers },
  // { to: "/buffer-stock", label: "Buffer Stock Mgmt", icon: Layers },
  { to: "/purchase-order", label: "Purchase Order", icon: ShoppingCart },
  { to: "/reports", label: "Report", icon: BarChart3 },
  { to: "/activity-charges", label: "Activity Charges", icon: Coins },
  { to: "/settings", label: "Settings", icon: Settings },
];

const superAdminLinks = [
  { to: "/users", label: "User Management", icon: ShieldCheck },
  { to: "/managers", label: "Managers", icon: ShieldAlert },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === "super_admin";

  const links = isSuperAdmin ? [...navLinks, ...superAdminLinks] : navLinks;

  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-700"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 text-white flex-shrink-0">
          <Package className="w-5 h-5" />
        </div>
        <span
          className="text-lg font-bold text-slate-800 dark:text-white whitespace-nowrap"
        >
          RenderWays
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />
                )}
                <link.icon className="w-5 h-5 flex-shrink-0" />
                <span>{link.label}</span>
                {isActive && link.to === "/" && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
