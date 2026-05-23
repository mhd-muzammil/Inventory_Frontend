import type { ComponentProps } from "react";
import { QuotationFormDialog } from "./QuotationFormDialog";

type RTPLQuotationFormDialogProps = Omit<
  ComponentProps<typeof QuotationFormDialog>,
  "initialStyle" | "allowStyleChange"
>;

export function RTPLQuotationFormDialog(props: RTPLQuotationFormDialogProps) {
  return (
    <QuotationFormDialog
      {...props}
      initialStyle="orange"
      allowStyleChange={false}
    />
  );
}
