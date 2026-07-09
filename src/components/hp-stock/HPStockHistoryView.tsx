import { motion } from "framer-motion";
import { ArrowLeft, Clock, Calendar, MapPin, User, Package, ClipboardCheck, Camera, Activity, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { HPStockItem } from "@/api/hpStock";
import type { Region } from "@/types";
import { REGION_LABELS } from "@/types";
import { STATUS_LABELS, STATUS_STYLE_MAP, getStatusIcon } from "./HPStockTable";

interface HPStockHistoryViewProps {
  item: HPStockItem;
  onBack: () => void;
}

export function HPStockHistoryView({ item, onBack }: HPStockHistoryViewProps) {
  const hasUnused = item.status === "UNUSED_RETURN" ||
    (item.transition_history || []).some(h => h.to_status === "UNUSED_RETURN" || h.from_status === "UNUSED_RETURN");
  const hasDefective = item.status === "DEFECTIVE_RETURN" ||
    (item.transition_history || []).some(h => h.to_status === "DEFECTIVE_RETURN" || h.from_status === "DEFECTIVE_RETURN");
  const hasDOA = item.status === "DOA" ||
    (item.transition_history || []).some(h => h.to_status === "DOA" || h.from_status === "DOA");

  const steps = ["PENDING", "STOCK_CHECK", "GOOD_PART_PHOTO", "ISSUED", "WORK_STATUS"];
  if (hasUnused) {
    steps.push("UNUSED_RETURN");
  } else if (hasDefective) {
    steps.push("DEFECTIVE_RETURN");
  } else if (hasDOA) {
    steps.push("DOA");
  } else {
    steps.push("UNUSED_RETURN");
  }
  steps.push("HANDOVER", "RETURN_PART_PHOTO", "DC_CUT_REQUEST", "CLOSED");

  const milestones = [
    {
      status: "PENDING",
      label: STATUS_LABELS["PENDING"] || "Stock Entry",
      timestamp: item.created_at,
      updated_by: item.created_by_name || "System",
      comment: "Stock entry registered successfully.",
      engineer_name: "",
      engineer_phone: "",
      image: "",
      image_back: "",
    }
  ];

  if (item.transition_history && Array.isArray(item.transition_history)) {
    item.transition_history.forEach((h) => {
      milestones.push({
        status: h.to_status,
        label: STATUS_LABELS[h.to_status] || h.to_status,
        timestamp: h.timestamp,
        updated_by: h.updated_by || "System",
        comment: h.comment || "",
        engineer_name: h.engineer_name || "",
        engineer_phone: h.engineer_phone || "",
        image: h.image || "",
        image_back: h.image_back || "",
      });
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header section with back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <span>HP Stock History & Logistics</span>
              <Badge variant="outline" className="border-indigo-200 bg-indigo-50/50 text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-400 font-mono font-semibold">
                {item.case_id || "N/A"}
              </Badge>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Detailed tracking logs and workflow status updates
            </p>
          </div>
        </div>
        
        {(() => {
          const s = item.status || "PENDING";
          const st = STATUS_STYLE_MAP[s] || STATUS_STYLE_MAP.PENDING;
          return (
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold w-fit border ${st.bg} ${st.text} border-indigo-100/10`}>
              <span className={`w-2 h-2 rounded-full ${st.dot}`} />
              Current Status: {STATUS_LABELS[s] || s}
            </span>
          );
        })()}
      </div>

      {/* Case Details Quick Info */}
      <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">
          Case Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Case / Work Order</span>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.case_id || "—"}</div>
            <div className="text-xs text-slate-500 font-mono">{item.work_order_id || "No Work Order ID"}</div>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Customer & Part</span>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate" title={item.customer_name || ""}>{item.customer_name || "—"}</div>
            <div className="text-xs text-slate-500 truncate" title={item.part_description || ""}>{item.part_description || "—"}</div>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">GVRMA & Logistics</span>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">GVRMA: {item.gvrma_no || "—"}</div>
            <div className="text-xs text-slate-500 truncate">
              {item.delivery_no ? `Deliv: ${item.delivery_no}` : "No Delivery No"} 
              {item.service_event_no ? ` • Event: ${item.service_event_no}` : ""}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Region & Assigned Engineer</span>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {REGION_LABELS[item.region as Region] || item.region || "No Region"}
            </div>
            <div className="text-xs text-slate-500">
              {item.engineer_name || "Unassigned"}
              {item.engineer_phone ? ` (${item.engineer_phone})` : ""}
            </div>
          </div>
        </div>
      </Card>

      {/* Stepper Progress */}
      <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-x-auto">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">
          Workflow Progress
        </h3>
        <div className="flex min-w-[800px] justify-between items-center gap-1.5 py-2">
          {steps.map((step, idx) => {
            const normalizeStatusForStepper = (status: string) => {
              if (status === "RECEIVED") return "STOCK_CHECK";
              return status;
            };
            const normalizedCurrentStatus = normalizeStatusForStepper(item.status || "PENDING");
            const currentIndex = steps.indexOf(normalizedCurrentStatus);
            const completed = idx < currentIndex;
            const current = idx === currentIndex;
            const formattedStep = STATUS_LABELS[step] || step;

            return (
              <div key={step} className="flex-1 flex flex-col items-center relative">
                {/* Horizontal progress connectors */}
                {idx > 0 && (
                  <div 
                    className={`absolute right-1/2 left-0 top-[18px] -translate-y-1/2 h-[3px] -z-10 transition-colors duration-300 ${
                      completed ? "bg-emerald-500 dark:bg-emerald-600" : "bg-slate-200 dark:bg-slate-800"
                    }`}
                  />
                )}
                {idx < steps.length - 1 && (
                  <div 
                    className={`absolute left-1/2 right-0 top-[18px] -translate-y-1/2 h-[3px] -z-10 transition-colors duration-300 ${
                      idx < currentIndex ? "bg-emerald-500 dark:bg-emerald-600" : "bg-slate-200 dark:bg-slate-800"
                    }`}
                  />
                )}

                <div 
                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 shadow-sm font-semibold text-xs z-10 transition-all duration-300 ${
                    completed 
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400" 
                      : current 
                        ? "border-indigo-600 bg-indigo-600 text-white scale-110 shadow-indigo-600/30" 
                        : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 text-slate-400 dark:text-slate-600"
                  }`}
                >
                  {completed ? "✓" : idx + 1}
                </div>
                
                <span className={`text-[11px] font-semibold mt-2 text-center max-w-[90px] truncate ${
                  current ? "text-indigo-600 dark:text-indigo-400 font-bold" : completed ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"
                }`}>
                  {formattedStep}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Timeline Section */}
      <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-6 uppercase tracking-wider">
          Logistics Audit Trail
        </h3>
        
        <div className="relative pl-8 sm:pl-12 space-y-8">
          {/* Vertical line */}
          <div className="absolute left-[15px] sm:left-[23px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800" />
          
          {milestones.map((m, idx) => {
            const st = STATUS_STYLE_MAP[m.status] || STATUS_STYLE_MAP.PENDING;
            const d = new Date(m.timestamp);
            const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric", hour12: true });
            const formattedDate = `${dateStr} • ${timeStr}`;

            return (
              <div key={`${m.timestamp}-${idx}`} className="relative group flex flex-col gap-2">
                {/* Timeline status indicator icon */}
                <div 
                  className={`absolute -left-[30px] sm:-left-[39px] top-1.5 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white dark:border-slate-900 ${st.bg} ${st.text} shadow-sm z-10 transition-transform duration-200 group-hover:scale-110`}
                >
                  {getStatusIcon(m.status)}
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 p-5 space-y-3 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-900/50">
                    <h4 className="font-bold text-slate-800 dark:text-slate-50 text-sm sm:text-base">
                      {m.label}
                    </h4>
                    <Badge className={`font-semibold tracking-wide uppercase px-2.5 py-0.5 text-[9px] sm:text-[10px] ${st.bg} ${st.text} border-transparent`}>
                      {m.status === "PENDING" ? "Initiated" : "Completed"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs text-slate-600 dark:text-slate-400">
                    {m.updated_by && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 dark:text-slate-500 w-24 flex-shrink-0">Updated By:</span>
                        <span className="font-semibold text-slate-850 dark:text-slate-200">{m.updated_by}</span>
                      </div>
                    )}
                    {m.engineer_name && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 dark:text-slate-500 w-24 flex-shrink-0">Engineer:</span>
                        <span className="font-semibold text-slate-850 dark:text-slate-200">
                          {m.engineer_name} {m.engineer_phone && `(${m.engineer_phone})`}
                        </span>
                      </div>
                    )}
                  </div>

                  {m.comment && (
                    <div className="bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-150 dark:border-slate-800/40 text-xs">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold block mb-1">Remarks:</span>
                      <span className="text-slate-700 dark:text-slate-300 italic">"{m.comment}"</span>
                    </div>
                  )}

                  {(m.image || m.image_back) && (
                    <div className="bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-150 dark:border-slate-800/40 text-xs space-y-3">
                      <span className="text-slate-400 dark:text-slate-500 font-semibold block">Attachments:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {m.image && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Front Box</span>
                            <div 
                              className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 aspect-video max-h-48 w-full flex items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform duration-200" 
                              onClick={() => window.open(m.image, "_blank")}
                            >
                              <img src={m.image} alt="Front Attachment" className="object-contain w-full h-full" />
                            </div>
                          </div>
                        )}
                        {m.image_back && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Back Box</span>
                            <div 
                              className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 aspect-video max-h-48 w-full flex items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform duration-200" 
                              onClick={() => window.open(m.image_back, "_blank")}
                            >
                              <img src={m.image_back} alt="Back Attachment" className="object-contain w-full h-full" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-semibold pt-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formattedDate}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}
