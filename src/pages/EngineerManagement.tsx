import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, Pencil, Trash2, HardHat, MapPin, AlertCircle, Loader2, Phone, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import type { Region, Engineer } from "@/types";
import { engineerSchema, type EngineerFormData } from "@/lib/validations";
import { getEngineers, createEngineer, updateEngineer, deleteEngineer } from "@/api/engineers";
import { extractApiError } from "@/api/client";
import { useAuthStore } from "@/store/authStore";

export default function EngineerManagement() {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Engineer | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Engineer | null>(null);

  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === "super_admin" || user?.role === "admin";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EngineerFormData>({
    resolver: zodResolver(engineerSchema),
  });

  const fetchEngineers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEngineers();
      setEngineers(data);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEngineers();
  }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", email: "", phone: "", region: undefined as unknown as Region, status: "active" });
    setDialogOpen(true);
  };

  const openEdit = (engineer: Engineer) => {
    setEditing(engineer);
    reset({
      name: engineer.name,
      email: engineer.email || "",
      phone: engineer.phone || "",
      region: engineer.region,
      status: engineer.status,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: EngineerFormData) => {
    setSaving(true);
    try {
      if (editing) {
        await updateEngineer(editing.id, data);
        toast({ title: "Engineer updated successfully" });
      } else {
        await createEngineer(data);
        toast({ title: "Engineer created successfully" });
      }
      setDialogOpen(false);
      fetchEngineers();
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEngineer(deleteTarget.id);
      toast({ title: "Engineer deleted successfully" });
      setDeleteTarget(null);
      fetchEngineers();
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    }
  };

  // Count active engineers per region
  const activeByRegion = (region: string) =>
    engineers.filter((e) => e.region === region && e.status === "active").length;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-800 dark:text-slate-100 font-medium mb-2">Failed to load engineers</p>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <Button onClick={fetchEngineers}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Engineer Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isSuperAdmin ? "Manage engineers across all regions" : "Manage engineers in your region"}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <UserPlus className="w-4 h-4" /> Add Engineer
        </Button>
      </div>

      {/* Region summary cards — super_admin sees all regions, sub_admin sees only theirs */}
      {isSuperAdmin ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {(Object.entries(REGION_LABELS) as [Region, string][]).map(([key, label]) => {
            const count = activeByRegion(key);
            return (
              <Card key={key} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</span>
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{count}</p>
                <p className="text-xs text-slate-500">active engineer{count !== 1 ? "s" : ""}</p>
              </Card>
            );
          })}
        </div>
      ) : user?.region ? (
        <div className="grid grid-cols-1 max-w-xs mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{REGION_LABELS[user.region] || user.region}</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{activeByRegion(user.region)}</p>
            <p className="text-xs text-slate-500">active engineer{activeByRegion(user.region) !== 1 ? "s" : ""}</p>
          </Card>
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                {isSuperAdmin && <TableHead>Region</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {engineers.map((eng) => (
                <TableRow key={eng.id} className="border-b border-slate-200 dark:border-slate-700">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <HardHat className="w-4 h-4 text-indigo-500" />
                      {eng.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {eng.phone ? (
                      <span className="flex items-center gap-1 text-sm">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {eng.phone}
                      </span>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    {eng.email ? (
                      <span className="flex items-center gap-1 text-sm">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {eng.email}
                      </span>
                    ) : "-"}
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{eng.region_display}</Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant={eng.status === "active" ? "success" : "destructive"}>
                      {eng.status_display}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(eng)} className="h-8 w-8">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {eng.status === "active" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(eng)}
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {engineers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 6 : 5} className="text-center py-12 text-slate-400">
                    No engineers yet. Click "Add Engineer" to create one.
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
            <DialogTitle>{editing ? "Edit Engineer" : "Add Engineer"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input {...register("name")} placeholder="e.g. Rajesh Kumar" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input {...register("phone")} placeholder="e.g. 9876543210" />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" {...register("email")} placeholder="engineer@example.com" />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>
            </div>
            {isSuperAdmin && (
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
            )}
            {editing && (
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  {...register("status")}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
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
            <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            This will permanently delete the engineer. This action cannot be undone.
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
