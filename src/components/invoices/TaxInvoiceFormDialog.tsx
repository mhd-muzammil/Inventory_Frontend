import type { ComponentProps } from "react";
import { InvoiceFormDialog } from "./InvoiceFormDialog";

type TaxInvoiceFormDialogProps = Omit<
  ComponentProps<typeof InvoiceFormDialog>,
  "initialStyle" | "allowStyleChange"
>;

export function TaxInvoiceFormDialog(props: TaxInvoiceFormDialogProps) {
  return (
    <InvoiceFormDialog
      {...props}
      initialStyle="orange"
      allowStyleChange={false}
    />
  );
}
