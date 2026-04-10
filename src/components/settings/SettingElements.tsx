import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SettingSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const SettingSection = ({ title, description, children, className }: SettingSectionProps) => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("space-y-4", className)}
  >
    <div className="px-1">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
      {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
    </div>
    <div className="rounded-2xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl bg-white/50 dark:bg-slate-900/50 overflow-hidden shadow-sm">
      {children}
    </div>
  </motion.section>
);

interface SettingItemProps {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const SettingItem = ({ icon, label, description, children, className }: SettingItemProps) => (
  <div className={cn("flex items-center justify-between p-4 sm:p-6 border-b border-slate-200/50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors", className)}>
    <div className="flex items-center gap-4">
      {icon && (
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          {icon}
        </div>
      )}
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">{description}</p>}
      </div>
    </div>
    <div className="flex-shrink-0">
      {children}
    </div>
  </div>
);
