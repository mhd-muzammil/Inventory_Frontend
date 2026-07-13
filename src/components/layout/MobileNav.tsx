import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Warehouse,
  ShieldCheck,
  ShieldAlert,
  HardHat,
  Menu,
  Wrench,
  FileQuestion,
  Receipt,
  Layers,
  ShoppingCart,
  BarChart3,
  Settings,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { canAccessSection } from "@/lib/sections";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const mainTabs = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/cso-entry", label: "CSO", icon: FileText },
  { to: "/stock", label: "Stock", icon: Warehouse },
];

const allLinksList = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/cso-entry", label: "CSO Entry", icon: FileText },
  { to: "/engineers", label: "Engineers", icon: HardHat },
  { to: "/quotation", label: "Quotation", icon: FileQuestion },
  { to: "/part-request", label: "Part Request", icon: Wrench },
  { to: "/invoice", label: "Invoice", icon: Receipt },
  { to: "/stock", label: "RTPL Stock", icon: Warehouse },
  { to: "/hp-stock", label: "HP Stock", icon: Warehouse },
  { to: "/hp-stock-rma", label: "HP Stock RMA", icon: FileText },
  { to: "/buffer", label: "Buffer", icon: Layers },
  { to: "/purchase-order", label: "Purchase Order", icon: ShoppingCart },
  { to: "/reports", label: "Report", icon: BarChart3 },
  { to: "/activity-charges", label: "Activity Charges", icon: Coins },
  { to: "/settings", label: "Settings", icon: Settings },
];

const superAdminLinks = [
  { to: "/users", label: "User Management", icon: ShieldCheck },
  { to: "/managers", label: "Managers", icon: ShieldAlert },
];

export function MobileNav() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isSuperAdmin = user?.role === "super_admin";

  // Section permissions now apply to every role; admins bypass them.
  const filteredNavLinks = allLinksList.filter((link) => canAccessSection(user, link.to));

  const links = isSuperAdmin ? [...filteredNavLinks, ...superAdminLinks] : filteredNavLinks;

  // The bottom bar was previously unfiltered — it could link into blocked sections.
  const visibleMainTabs = mainTabs.filter((tab) => canAccessSection(user, tab.to));

  const isMainTabActive = visibleMainTabs.some((tab) =>
    tab.to === "/" ? location.pathname === "/" : location.pathname.startsWith(tab.to)
  );
  const isMoreActive = !isMainTabActive;

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700 safe-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-around h-16 px-1">
          {visibleMainTabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-2 text-[10px] font-medium transition-colors",
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400 dark:text-slate-500"
                )
              }
            >
              <tab.icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{tab.label}</span>
            </NavLink>
          ))}

          {/* More Menu Trigger */}
          <button
            onClick={() => setOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-2 text-[10px] font-medium transition-colors",
              isMoreActive
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-400 dark:text-slate-500"
            )}
          >
            <Menu className="w-5 h-5 flex-shrink-0" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* Grid Launcher Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto p-5 gap-4">
          <DialogHeader className="border-b pb-2">
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Menu className="w-4 h-4 text-indigo-600" />
              All Sections
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {links.map((link) => {
              const isActive =
                link.to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(link.to);
              return (
                <button
                  key={link.to}
                  onClick={() => {
                    navigate(link.to);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-200 gap-1.5 min-h-[84px] shadow-sm",
                    isActive
                      ? "bg-indigo-50/80 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 font-semibold"
                      : "bg-slate-50/50 border-slate-100 dark:bg-slate-900/30 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100/50"
                  )}
                >
                  <link.icon className="w-5.5 h-5.5 shrink-0" />
                  <span className="text-[10px] leading-tight font-medium max-w-full break-words line-clamp-2">
                    {link.label}
                  </span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
