import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "./StatusBadge";
import { transitionTicket, updateTicket } from "@/api/tickets";
import { toast } from "@/components/ui/use-toast";
import { extractApiError } from "@/api/client";
import { useAuthStore } from "@/store/authStore";
import { ArrowRight, Loader2, UploadCloud, Eye, FileText } from "lucide-react";
import type { AvailableTransition, TicketStatus } from "@/types";

interface TransitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: number;
  transition: AvailableTransition;
  csoImage?: string | null;
  partRequestImage?: string | null;
  onSuccess: () => void;
}

export function TransitionDialog({
  open,
  onOpenChange,
  ticketId,
  transition,
  csoImage,
  partRequestImage,
  onSuccess,
}: TransitionDialogProps) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [partRequestFiles, setPartRequestFiles] = useState<File[]>([]);

  const userRole = useAuthStore((s) => s.user?.role);

  const handleSubmit = async () => {
    if (transition.requires_comment && !comment.trim()) {
      toast({ title: "Comment is required for this transition", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // 1. If we are requesting parts, upload the part_request_images first if chosen
      if (transition.to_status === "part_requested" && partRequestFiles.length > 0) {
        try {
          await updateTicket(ticketId, {
            part_request_images: partRequestFiles,
          });
        } catch (err) {
          toast({ title: "Failed to upload part request scan: " + extractApiError(err), variant: "destructive" });
          setLoading(false);
          return;
        }
      }

      // 2. Perform the status transition
      await transitionTicket(ticketId, {
        to_status: transition.to_status,
        comment: comment || undefined,
      });

      toast({ title: `Ticket moved to ${transition.label}` });
      setComment("");
      setPartRequestFiles([]);
      onSuccess();
    } catch (err) {
      toast({ title: extractApiError(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Transition Ticket
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-sm text-slate-500 dark:text-slate-400">Moving to</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <StatusBadge status={transition.to_status as TicketStatus} size="md" />
          </div>

          {/* CSO Entry Scan for managers/admins referencing a part request review */}
          {(userRole === "manager" || userRole === "super_admin" || userRole === "admin") && csoImage && transition.to_status === "part_requested" && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-500" /> Reference: Original CSO Scan
              </Label>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 max-h-[160px] flex items-center justify-center p-2 relative group">
                {csoImage.toLowerCase().endsWith(".pdf") ? (
                  <iframe src={csoImage} className="w-full h-[140px]" title="CSO Reference Preview" />
                ) : (
                  <img
                    src={csoImage}
                    alt="Original CSO Entry Scan"
                    className="max-h-[140px] object-contain rounded-lg"
                  />
                )}
                <a
                  href={csoImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm"
                >
                  View Full Screen
                </a>
              </div>
            </div>
          )}

          {/* Part Request Scan/Image Uploader */}
          {transition.to_status === "part_requested" && (
            <div className="space-y-2">
              <Label htmlFor="part_request_image" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Part Request Image / Document Scan
              </Label>
              <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-colors group cursor-pointer">
                <input
                  id="part_request_image"
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      setPartRequestFiles((prev) => [...prev, ...files]);
                    }
                    e.target.value = ""; // Reset file picker so the same file can be picked again if removed
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors mb-2 animate-pulse" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Click or drag to upload part scans
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Supports Images & PDFs (Upload as many as needed)
                </span>
              </div>

              {partRequestFiles.length > 0 && (
                <div className="space-y-2 mt-2 max-h-[220px] overflow-y-auto pr-1">
                  {partRequestFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30">
                      <div className="flex items-center gap-2 overflow-hidden mr-2">
                        <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="text-xs text-indigo-900 dark:text-indigo-300 font-medium truncate">
                          {file.name}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPartRequestFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="h-7 w-7 p-0 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-500 shrink-0 text-slate-400"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="comment">
              Comment {transition.requires_comment ? "(required)" : "(optional)"}
            </Label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a note about this transition..."
              rows={3}
              className="flex w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirm Transition
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
