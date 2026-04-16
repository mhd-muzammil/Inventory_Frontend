import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, Pencil, Trash2, Shield, MapPin, AlertCircle, Loader2 } from "lucide-react";
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
import { getSubAdmins, createSubAdmin, updateSubAdmin, deleteSubAdmin } from "@/api/subadmins";
import type { SubAdmin } from "@/api/subadmins";

const subAdminSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").or(z.literal("")),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  first_name: z.string().optional().default(""),
  last_name: z.string().optional().default(""),
  region: z.enum(["vellore", "salem", "chennai", "kanchipuram", "hosur"], { message: "Select a region" }),
});

type SubAdminFormData = z.infer<typeof subAdminSchema>;

export default function UserManagement() {
  const [admins, setAdmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubAdmin | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SubAdmin | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubAdminFormData>({
    resolver: zodResolver(subAdminSchema),
  });

  const fetchAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSubAdmins();
      setAdmins(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load sub-admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ username: "", password: "", email: "", first_name: "", last_name: "", region: undefined as any });
    setDialogOpen(true);
  };

  const openEdit = (admin: SubAdmin) => {
    setEditing(admin);
    reset({
      username: admin.username,
      password: "",
      email: admin.email || "",
      first_name: admin.first_name || "",
      last_name: admin.last_name || "",
      region: admin.region as Region,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: SubAdminFormData) => {
    setSaving(true);
    try {
      if (editing) {
        const payload: any = { ...data };
        if (!payload.password) delete payload.password;
        await updateSubAdmin(editing.id, payload);
        toast({ title: "Sub-admin updated successfully" });
      } else {
        if (!data.password) {
          toast({ title: "Password is required", variant: "destructive" });
          setSaving(false);
          return;
        }
        await createSubAdmin(data as any);
        toast({ title: "Sub-admin created successfully" });
      }
      setDialogOpen(false);
      fetchAdmins();
    } catch (err: any) {
      const msg = err.response?.data;
      const detail = typeof msg === "string" ? msg : msg?.detail || msg?.username?.[0] || msg?.region?.[0] || "Failed to save";
      toast({ title: detail, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSubAdmin(deleteTarget.id);
      toast({ title: "Sub-admin deleted successfully" });
      setDeleteTarget(null);
      fetchAdmins();
    } catch {
      toast({ title: "Failed to delete sub-admin", variant: "destructive" });
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-800 dark:text-slate-100 font-medium mb-2">Failed to load users</p>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <Button onClick={fetchAdmins}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage regional sub-admins</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <UserPlus className="w-4 h-4" /> Add Sub Admin
        </Button>
      </div>

      {/* Region summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {(Object.entries(REGION_LABELS) as [Region, string][]).map(([key, label]) => {
          const count = admins.filter((a) => a.region === key && a.is_active).length;
          return (
            <Card key={key} className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</span>
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{count}</p>
              <p className="text-xs text-slate-500">active admin{count !== 1 ? "s" : ""}</p>
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
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((a) => (
                <TableRow key={a.id} className="border-b border-slate-200 dark:border-slate-700">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-indigo-500" />
                      {a.username}
                    </div>
                  </TableCell>
                  <TableCell>{[a.first_name, a.last_name].filter(Boolean).join(" ") || "-"}</TableCell>
                  <TableCell>{a.email || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{a.region_display}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.is_active ? "success" : "destructive"}>
                      {a.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(a)} className="h-8 w-8">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(a)} className="h-8 w-8 text-red-500 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {admins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                    No sub-admins yet. Click "Add Sub Admin" to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Sub Admin" : "Create Sub Admin"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Username *</Label>
              <Input {...register("username")} placeholder="e.g. salem_admin" disabled={!!editing} />
              {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>{editing ? "New Password (leave blank to keep)" : "Password *"}</Label>
              <Input type="password" {...register("password")} placeholder="••••••••" />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input {...register("first_name")} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input {...register("last_name")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...register("email")} placeholder="admin@example.com" />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Region *</Label>
              <select
                {...register("region")}
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">Select region...</option>
                {Object.entries(REGION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.region && <p className="text-xs text-red-500">{errors.region.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="gap-2">
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
            This will permanently delete the sub-admin account. This action cannot be undone.
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
