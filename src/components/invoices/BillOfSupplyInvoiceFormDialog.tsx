import type { ComponentProps } from "react";
import { InvoiceFormDialog } from "./InvoiceFormDialog";

type BillOfSupplyInvoiceFormDialogProps = Omit<
  ComponentProps<typeof InvoiceFormDialog>,
  "initialStyle" | "allowStyleChange"
>;

export function BillOfSupplyInvoiceFormDialog(props: BillOfSupplyInvoiceFormDialogProps) {
  return (
    <InvoiceFormDialog
      {...props}
      initialStyle="classic"
      allowStyleChange={false}
    />
  );
}
