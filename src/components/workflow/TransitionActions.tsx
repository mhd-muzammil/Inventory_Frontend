import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TransitionDialog } from "./TransitionDialog";
import { STATUS_CONFIG } from "@/lib/workflow";
import { ArrowRight } from "lucide-react";
import type { AvailableTransition, TicketStatus } from "@/types";

interface TransitionActionsProps {
  ticketId: number;
  transitions: AvailableTransition[];
  onTransitioned: () => void;
  className?: string;
  csoImage?: string | null;
  partRequestImage?: string | null;
}

export function TransitionActions({
  ticketId,
  transitions,
  onTransitioned,
  className,
  csoImage,
  partRequestImage,
}: TransitionActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTransition, setSelectedTransition] = useState<AvailableTransition | null>(null);

  if (transitions.length === 0) return null;

  const handleClick = (t: AvailableTransition) => {
    setSelectedTransition(t);
    setDialogOpen(true);
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {transitions.map((t) => {
          const config = STATUS_CONFIG[t.to_status as TicketStatus];
          return (
            <Button
              key={t.to_status}
              variant="outline"
              size="sm"
              onClick={() => handleClick(t)}
              className="gap-2"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              {t.label}
              {config && (
                <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
              )}
            </Button>
          );
        })}
      </div>

      {selectedTransition && (
        <TransitionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          ticketId={ticketId}
          transition={selectedTransition}
          csoImage={csoImage}
          partRequestImage={partRequestImage}
          onSuccess={() => {
            setDialogOpen(false);
            setSelectedTransition(null);
            onTransitioned();
          }}
        />
      )}
    </div>
  );
}
