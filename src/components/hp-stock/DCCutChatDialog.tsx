import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { useAuthStore } from "@/store/authStore";
import { sendHPStockDCCutChatMessage } from "@/api/hpStock";
import type { HPStockItem } from "@/api/hpStock";

interface DCCutChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: HPStockItem | null;
  onMessageSent: (updatedItem: HPStockItem) => void;
}

export function DCCutChatDialog({ open, onOpenChange, item, onMessageSent }: DCCutChatDialogProps) {
  const currentUser = useAuthStore((s) => s.user);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentActorName = currentUser
    ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() || currentUser.username
    : "";

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [open, item?.dc_cut_chat]);

  if (!item) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      const updated = await sendHPStockDCCutChatMessage(item.id, message.trim());
      setMessage("");
      onMessageSent(updated);
    } catch (err: any) {
      toast({
        title: "Failed to send message",
        description: err.response?.data?.detail || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const chatMessages = item.dc_cut_chat || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] h-[600px] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>DC Cut Discussion Chat</span>
                <Badge variant="outline" className="text-[10px] font-mono border-indigo-100/30 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400">
                  {item.case_id || "N/A"}
                </Badge>
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                WO: {item.work_order_id || "N/A"} • Customer: {item.customer_name || "—"}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50 dark:bg-slate-950/20 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-600 py-10">
              <MessageSquare className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs max-w-[280px] mt-1">
                Start the discussion about the DC Cut request for this case.
              </p>
            </div>
          ) : (
            chatMessages.map((msg, idx) => {
              const isMe = msg.sender === currentActorName;
              const timestampStr = msg.timestamp
                ? format(new Date(msg.timestamp), "dd/MM/yyyy • hh:mm a")
                : "";

              return (
                <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      {msg.sender}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">
                      {timestampStr}
                    </span>
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      isMe
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message about this DC Cut..."
            disabled={sending}
            className="flex-1 bg-slate-50 dark:bg-slate-950 border-slate-200 focus-visible:ring-indigo-600"
          />
          <Button
            type="submit"
            disabled={!message.trim() || sending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5 shrink-0 px-4"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
