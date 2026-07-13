import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, Pencil, Trash2, ShieldAlert, MapPin, AlertCircle, Loader2, UserCheck, UserX } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { REGION_LABELS } from "@/types";
import type { Region } from "@/types";
import { getManagers, createManager, updateManager, deleteManager } from "@/api/managers";
import type { Manager } from "@/api/managers";

import { SECTIONS } from "@/lib/sections";

const managerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").or(z.literal("")),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  first_name: z.string().optional().default(""),
  last_name: z.string().optional().default(""),
  region: z.string().optional().default(""),
  allowed_sections: z.array(z.string()).optional().default([]),
});

type ManagerFormData = z.infer<typeof managerSchema>;

export default function ManagerManagement() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Manager | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Manager | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ManagerFormData>({
    resolver: zodResolver(managerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      first_name: "",
      last_name: "",
      region: "",
      allowed_sections: [],
    }
  });

  const watchedSections = watch("allowed_sections") || [];

  const fetchManagers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getManagers();
      setManagers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load managers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const openCreate = () => {
    setEditing(null);
    reset({
      username: "",
      password: "",
      email: "",
      first_name: "",
      last_name: "",
      region: "",
      allowed_sections: [],
    });
    setDialogOpen(true);
  };

  const openEdit = (mgr: Manager) => {
    setEditing(mgr);
    reset({
      username: mgr.username,
      password: "",
      email: mgr.email || "",
      first_name: mgr.first_name || "",
      last_name: mgr.last_name || "",
      region: mgr.region || "",
      allowed_sections: mgr.allowed_sections || [],
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: ManagerFormData) => {
    setSaving(true);
    try {
      if (editing) {
        const payload: any = { ...data };
        if (!payload.password) delete payload.password;
        await updateManager(editing.id, payload);
        toast({ title: "Manager updated successfully" });
      } else {
        if (!data.password) {
          toast({ title: "Password is required", variant: "destructive" });
          setSaving(false);
          return;
        }
        await createManager(data as any);
        toast({ title: "Manager created successfully" });
      }
      setDialogOpen(false);
      fetchManagers();
    } catch (err: any) {
      const msg = err.response?.data;
      const detail = typeof msg === "string" ? msg : msg?.detail || msg?.username?.[0] || "Failed to save";
      toast({ title: detail, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (mgr: Manager, newStatus: boolean) => {
    try {
      await updateManager(mgr.id, { is_active: newStatus });
      toast({ title: `Manager ${newStatus ? "activated" : "deactivated"} successfully` });
      fetchManagers();
    } catch {
      toast({ title: `Failed to ${newStatus ? "activate" : "deactivate"} manager`, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteManager(deleteTarget.id);
      toast({ title: "Manager deleted permanently" });
      setDeleteTarget(null);
      fetchManagers();
    } catch {
      toast({ title: "Failed to delete manager", variant: "destructive" });
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-800 dark:text-slate-100 font-medium mb-2">Failed to load managers</p>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <Button onClick={fetchManagers}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Manager Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage part-approval managers</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <UserPlus className="w-4 h-4" /> Add Manager
        </Button>
      </div>

      {/* Region summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {(Object.entries(REGION_LABELS) as [Region, string][]).map(([key, label]) => {
          const count = managers.filter((m) => m.region === key && m.is_active).length;
          return (
            <Card key={key} className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{count}</p>
              <p className="text-xs text-slate-500">active manager{count !== 1 ? "s" : ""}</p>
            </Card>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                <TableHead>Username</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {managers.map((m) => (
                <TableRow key={m.id} className="border-b border-slate-200 dark:border-slate-700">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                      {m.username}
                    </div>
                  </TableCell>
                  <TableCell>{[m.first_name, m.last_name].filter(Boolean).join(" ") || "-"}</TableCell>
                  <TableCell>{m.email || "-"}</TableCell>
                  <TableCell>
                    {m.region_display ? (
                      <Badge variant="outline" className="capitalize">{m.region_display}</Badge>
                    ) : (
                      <span className="text-xs text-slate-400">All regions</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 max-w-[200px]">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {m.allowed_sections?.length || 0} of 14 sections
                      </span>
                      {m.allowed_sections && m.allowed_sections.length > 0 ? (
                        <span className="text-[10px] text-slate-400 truncate block hover:text-slate-500 transition-colors" title={m.allowed_sections.map(x => x === "/" ? "Dashboard" : x.substring(1)).join(", ")}>
                          {m.allowed_sections.map(x => x === "/" ? "Dashboard" : x.substring(1)).join(", ")}
                        </span>
                      ) : (
                        <span className="text-[10px] text-red-400">No access granted</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.is_active ? "success" : "destructive"}>
                      {m.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(m)} className="h-8 w-8" title="Edit Manager">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {m.is_active ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(m, false)}
                          className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                          title="Deactivate Manager"
                        >
                          <UserX className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(m, true)}
                          className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
                          title="Activate Manager"
                        >
                          <UserCheck className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(m)}
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        title="Delete Manager"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {managers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                    No managers yet. Click "Add Manager" to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Manager" : "Create Manager"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Username *</Label>
                <Input {...register("username")} placeholder="e.g. manager_parts" disabled={!!editing} className="h-9 rounded-lg" />
                {errors.username && <p className="text-[11px] text-red-500 font-medium">{errors.username.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{editing ? "New Password" : "Password *"}</Label>
                <Input type="password" {...register("password")} placeholder="••••••••" className="h-9 rounded-lg" />
                {errors.password && <p className="text-[11px] text-red-500 font-medium">{errors.password.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">First Name</Label>
                <Input {...register("first_name")} placeholder="John" className="h-9 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Last Name</Label>
                <Input {...register("last_name")} placeholder="Doe" className="h-9 rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Email</Label>
                <Input type="email" {...register("email")} placeholder="manager@example.com" className="h-9 rounded-lg" />
                {errors.email && <p className="text-[11px] text-red-500 font-medium">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Region (optional)</Label>
                <select
                  {...register("region")}
                  className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="">All regions</option>
                  {Object.entries(REGION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Access Permissions</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setValue("allowed_sections", SECTIONS.map(s => s.path))}
                    className="text-[10px] text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("allowed_sections", [])}
                    className="text-[10px] text-slate-500 hover:text-slate-600 font-semibold"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-1 border border-slate-200 dark:border-slate-700 rounded-xl p-3 max-h-[140px] overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
                {SECTIONS.map((sec) => (
                  <label
                    key={sec.path}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors text-[11px] font-medium text-slate-700 dark:text-slate-300"
                  >
                    <input
                      type="checkbox"
                      value={sec.path}
                      checked={watchedSections.includes(sec.path)}
                      onChange={(e) => {
                        const current = [...watchedSections];
                        if (e.target.checked) {
                          setValue("allowed_sections", [...current, sec.path]);
                        } else {
                          setValue("allowed_sections", current.filter((x) => x !== sec.path));
                        }
                      }}
                      className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="truncate" title={sec.label}>{sec.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={saving} className="gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.username}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            This will permanently delete the manager account. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
