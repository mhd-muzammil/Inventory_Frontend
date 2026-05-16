import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Sun,
  Moon,
  Bell,
  Lock,
  Info,
  ChevronRight,
  Monitor,
  CheckCircle2,
  Mail,
  ShieldCheck,
  Globe,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { SettingSection, SettingItem } from "@/components/settings/SettingElements";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Sun },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Lock },
  { id: "about", label: "About", icon: Info },
];

export default function Settings() {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState("profile");

  // Mock states for settings toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [browserAlerts, setBrowserAlerts] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(true);

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-4 md:px-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Personalize your workspace and manage your account preferences.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 min-h-[600px]">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 relative whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-indigo-400/50"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <tab.icon className={cn("w-5 h-5", activeTab === tab.id ? "text-white" : "text-slate-400")} />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-indigo-600 rounded-2xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <SettingSection title="Your Profile" description="Overview of your account information.">
                    <div className="p-8 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative group">
                          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-500 blur-xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-2xl border-2 border-white dark:border-slate-800">
                            <User className="w-12 h-12" />
                          </div>
                          <button className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:scale-110 transition-transform">
                            <ChevronRight className="w-4 h-4 rotate-90" />
                          </button>
                        </div>
                        <div className="text-center sm:text-left">
                          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                            {user?.full_name || user?.username || "Guest User"}
                          </h3>
                          <p className="text-slate-500 dark:text-slate-400 font-medium">
                            {user?.email || "No email provided"}
                          </p>
                          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                            <Badge className="bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-0 px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[10px]">
                              {user?.role || "Staff"}
                            </Badge>
                            <Badge className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-0 px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[10px]">
                              Active
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <SettingItem 
                      label="Username" 
                      description="Unique identifier used for logging in."
                    >
                      <span className="text-sm font-mono font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                        @{user?.username || "user"}
                      </span>
                    </SettingItem>
                    
                    <SettingItem 
                      label="Primary Region" 
                      description="Your default operational facility."
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                        <Globe className="w-4 h-4 text-indigo-500" />
                        {user?.region || "Vellore"}
                      </div>
                    </SettingItem>
                  </SettingSection>
                </div>
              )}

              {activeTab === "appearance" && (
                <div className="space-y-6">
                  <SettingSection title="Appearance" description="Customize how the system looks and feels.">
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Light Theme Card */}
                      <button 
                        onClick={() => theme === 'dark' && toggleTheme()}
                        className={cn(
                          "group relative p-4 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden",
                          theme === 'light' 
                            ? "border-indigo-600 bg-white ring-4 ring-indigo-50 dark:ring-indigo-950/20" 
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-900"
                        )}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className={cn(
                            "p-2 rounded-xl",
                            theme === 'light' ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                          )}>
                            <Sun className="w-5 h-5" />
                          </div>
                          {theme === 'light' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                        </div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">Light Mode</p>
                        <p className="text-xs text-slate-500 mt-1">Clean and sharp Interface</p>
                        
                        {/* Preview UI */}
                        <div className="mt-4 space-y-1.5 opacity-40">
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
                          <div className="h-2 w-2/3 bg-slate-200 dark:bg-slate-700 rounded-full" />
                        </div>
                      </button>

                      {/* Dark Theme Card */}
                      <button 
                        onClick={() => theme === 'light' && toggleTheme()}
                        className={cn(
                          "group relative p-4 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden",
                          theme === 'dark' 
                            ? "border-indigo-600 bg-slate-900 ring-4 ring-indigo-50 dark:ring-indigo-950/20" 
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-900"
                        )}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className={cn(
                            "p-2 rounded-xl",
                            theme === 'dark' ? "bg-indigo-950/50 text-indigo-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                          )}>
                            <Moon className="w-5 h-5" />
                          </div>
                          {theme === 'dark' && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
                        </div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">Dark Mode</p>
                        <p className="text-xs text-slate-500 mt-1">Easier on the eyes tonight</p>
                        
                        {/* Preview UI */}
                        <div className="mt-4 space-y-1.5 opacity-40">
                          <div className="h-2 w-full bg-slate-300 dark:bg-slate-600 rounded-full" />
                          <div className="h-2 w-2/3 bg-slate-300 dark:bg-slate-600 rounded-full" />
                        </div>
                      </button>
                    </div>
                  </SettingSection>

                  <SettingSection title="Preferences" description="System-level behavior and style.">
                    <SettingItem 
                      icon={<Monitor className="w-5 h-5" />} 
                      label="Compact Mode" 
                      description="Reduce spacing and text size across the app."
                    >
                      <Switch checked={false} onCheckedChange={() => {}} />
                    </SettingItem>
                    <SettingItem 
                      icon={<Globe className="w-5 h-5" />} 
                      label="Language" 
                      description="Default system language."
                    >
                      <Button variant="outline" size="sm" className="rounded-xl font-bold">English (US)</Button>
                    </SettingItem>
                  </SettingSection>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <SettingSection title="Notifications" description="Manage how and when you receive alerts.">
                    <SettingItem 
                      icon={<Mail className="w-5 h-5" />} 
                      label="Email Notifications" 
                      description="Receive daily summaries and critical alerts via email."
                    >
                      <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
                    </SettingItem>
                    <SettingItem 
                      icon={<Bell className="w-5 h-5" />} 
                      label="Browser Notifications" 
                      description="Real-time push alerts for status changes."
                    >
                      <Switch checked={browserAlerts} onCheckedChange={setBrowserAlerts} />
                    </SettingItem>
                    <SettingItem 
                      icon={<Info className="w-5 h-5" />} 
                      label="Marketing & Updates" 
                      description="Keep up to date with new features and system updates."
                    >
                      <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
                    </SettingItem>
                  </SettingSection>

                  <SettingSection title="Event Subscriptions" description="Specific events to track.">
                    <SettingItem label="SLA Breaches" description="Alert when a ticket exceeds its SLA limit.">
                      <Badge className="bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-0">High Priority</Badge>
                    </SettingItem>
                    <SettingItem label="Part Requests" description="Notify for new part approval requests.">
                      <Badge className="bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-0">Medium Priority</Badge>
                    </SettingItem>
                  </SettingSection>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-6">
                  <SettingSection title="Security & Authentication" description="Keep your account safe and secure.">
                    <SettingItem 
                      icon={<Lock className="w-5 h-5" />} 
                      label="Password" 
                      description="Last changed 3 months ago."
                    >
                      <Button variant="default" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md">
                        Update Password
                      </Button>
                    </SettingItem>
                    <SettingItem 
                      icon={<ShieldCheck className="w-5 h-5" />} 
                      label="Two-Factor Authentication" 
                      description="Add an extra layer of security to your account."
                    >
                      <Button variant="outline" className="rounded-xl font-bold border-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                        Enable 2FA
                      </Button>
                    </SettingItem>
                  </SettingSection>

                  <SettingSection title="Active Sessions" description="Devices currently logged into your account.">
                    <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                          <Monitor className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Windows Desktop • Chrome</p>
                          <p className="text-xs text-slate-500">Current Session • 192.168.1.1</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-0">Active</Badge>
                    </div>
                  </SettingSection>
                </div>
              )}

              {activeTab === "about" && (
                <div className="space-y-6">
                  <SettingSection title="System Information" description="About the Inventory SaaS platform.">
                    <div className="p-8 text-center sm:text-left">
                      <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-600 text-white mb-6 shadow-xl shadow-indigo-500/20">
                        <Monitor className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Inventory SaaS</h3>
                      <p className="text-indigo-600 dark:text-indigo-400 font-bold tracking-tighter">VERSION 1.0.0-PRO</p>
                      
                      <p className="mt-6 text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                        A state-of-the-art inventory management platform designed for scale.
                        Our system provides real-time tracking, advanced SLA monitoring, 
                        and streamlined operational workflows for modern enterprises.
                      </p>
                      
                      <div className="mt-8 flex flex-wrap gap-4">
                        <Button variant="outline" className="rounded-xl border-2 font-bold transition-all hover:shadow-lg">
                          Check for Updates
                        </Button>
                        <Button variant="outline" className="rounded-xl border-2 font-bold transition-all hover:shadow-lg">
                          Release Notes
                        </Button>
                      </div>
                    </div>
                  </SettingSection>

                  <div className="p-6 text-center">
                    <p className="text-xs text-slate-400 dark:text-slate-600 font-medium">
                      &copy; 2024 RenderWays Tech Solutions. All rights reserved.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}