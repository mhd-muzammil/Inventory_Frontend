import type { ComponentProps } from "react";
import { QuotationFormDialog } from "./QuotationFormDialog";

type HPQuotationFormDialogProps = Omit<
  ComponentProps<typeof QuotationFormDialog>,
  "initialStyle" | "allowStyleChange"
>;

export function HPQuotationFormDialog(props: HPQuotationFormDialogProps) {
  return (
    <QuotationFormDialog
      {...props}
      initialStyle="classic"
      allowStyleChange={false}
    />
  );
}
