import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, FileText, Warehouse, ShieldCheck, ShieldAlert, HardHat } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const tabs = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/cso-entry", label: "CSO", icon: FileText },
  { to: "/engineers", label: "Engineers", icon: HardHat },
  { to: "/stock", label: "Stock", icon: Warehouse },
];

const superAdminTabs = [
  { to: "/users", label: "Users", icon: ShieldCheck },
  { to: "/managers", label: "Managers", icon: ShieldAlert },
];

export function MobileNav() {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === "super_admin";
  const isManager = user?.role === "manager";

  const filteredTabs = tabs.filter((tab) => {
    if (isManager) {
      return user?.allowed_sections?.includes(tab.to);
    }
    return true;
  });

  const allTabs = isSuperAdmin ? [...filteredTabs, ...superAdminTabs] : filteredTabs;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700 safe-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {allTabs.map((tab) => (
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
      </div>
    </nav>
  );
}
