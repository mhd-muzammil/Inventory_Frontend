import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Printer, Receipt, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import renderlogo from "@/assets/renderlogo.png";
import stampImg from "@/assets/stamp.png";

type DocumentStyle = "classic" | "orange";
type LineItemId = number | string;
type LineItemValue = string | number;

interface InvoiceLineItem {
  id: LineItemId;
  description: string;
  hsn: string;
  qty: number;
  uom: string;
  price: number;
  cgstPercent: number;
  sgstPercent: number;
}

type CalculatedInvoiceLineItem = InvoiceLineItem & {
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
};

export interface InvoiceDraftData {
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  placeOfSupply?: string;
  senderCompany?: string;
  senderAddress?: string;
  senderPhone?: string;
  senderEmail?: string;
  senderGSTIN?: string;
  senderWebsite?: string;
  senderContactName?: string;
  billToName?: string;
  billToPhone?: string;
  billToAddress?: string;
  billToGSTIN?: string;
  shipToName?: string;
  shipToPhone?: string;
  shipToAddress?: string;
  items?: InvoiceLineItem[];
  terms?: string;
  style?: DocumentStyle;
  totalTaxableValue?: number;
  totalCGST?: number;
  totalSGST?: number;
  overallTotal?: number;
}

interface InvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitInvoice?: (invoiceData: InvoiceDraftData) => Promise<void>;
  initialStyle?: DocumentStyle;
  initialData?: InvoiceDraftData | null;
  allowStyleChange?: boolean;
}

export function InvoiceFormDialog({
  open,
  onOpenChange,
  onSubmitInvoice,
  initialStyle = "classic",
  initialData = null,
  allowStyleChange = true,
}: InvoiceFormDialogProps) {
  const [invoiceStyle, setInvoiceStyle] = useState<DocumentStyle>(initialStyle);
  const [invoiceNumber, setInvoiceNumber] = useState("RT/20-21-SAL-1254");
  const [issueDate, setIssueDate] = useState("2021-02-06");
  const [dueDate, setDueDate] = useState("2021-02-06");
  const [placeOfSupply, setPlaceOfSupply] = useState("TN (33)");

  // Sender Details
  const [senderCompany, setSenderCompany] = useState("RENDERWAYS TECHNOLOGY");
  const [senderAddress, setSenderAddress] = useState(
    "NO 19,1St Floor, Poonamallee High Road, Maduravoyal, Chennai - 600095, Chennai, TN (33) 600095, IN"
  );
  const [senderPhone, setSenderPhone] = useState("+917358189215");
  const [senderEmail, setSenderEmail] = useState("renderwaysgroup@gmail.com");
  const [senderGSTIN, setSenderGSTIN] = useState("33CDVPR7491G1ZR");
  const [senderWebsite, setSenderWebsite] = useState("www.renderways.in");
  const [senderContactName, setSenderContactName] = useState("DINESH KUMAR");

  // Bill To Details
  const [billToName, setBillToName] = useState("LEGACY PETROCHEMICALS");
  const [billToPhone, setBillToPhone] = useState("9884100841");
  const [billToAddress, setBillToAddress] = useState(
    "NO.31, 8TH FLOOR, SAMSON TOWERS, PANTHEON ROAD, EGMORE., Chennai, TN (33) 600008, IN"
  );
  const [billToGSTIN, setBillToGSTIN] = useState("33AAGFL9201Q1Z0");

  // Ship To Details
  const [shipToName, setShipToName] = useState("LEGACY PETROCHEMICALS");
  const [shipToPhone, setShipToPhone] = useState("9884100841");
  const [shipToAddress, setShipToAddress] = useState(
    "NO.31, 8TH FLOOR, SAMSON TOWERS, PANTHEON ROAD, EGMORE., Chennai, TN (33) 600008, IN"
  );

  // Items
  const [items, setItems] = useState<InvoiceLineItem[]>([
    {
      id: 1,
      description: "Windows Installation\n* Desktop OS Reinstallation.",
      hsn: "",
      qty: 3,
      uom: "",
      price: 650.0,
      cgstPercent: 9,
      sgstPercent: 9,
    },
    {
      id: 2,
      description: "Cat6 Cable\n* Network Cable for camera laying.",
      hsn: "",
      qty: 80,
      uom: "MTR",
      price: 16.1,
      cgstPercent: 9,
      sgstPercent: 9,
    },
    {
      id: 3,
      description: "CAT6 RJ45 JACK",
      hsn: "",
      qty: 4,
      uom: "",
      price: 59.0,
      cgstPercent: 9,
      sgstPercent: 9,
    },
    {
      id: 4,
      description: "Desktop HDD 500gb\n* 1Year Warranty.",
      hsn: "",
      qty: 1,
      uom: "",
      price: 1610.16,
      cgstPercent: 9,
      sgstPercent: 9,
    },
    {
      id: 5,
      description: "Desktop Cabinet\n* Used.",
      hsn: "",
      qty: 2,
      uom: "",
      price: 205.86,
      cgstPercent: 9,
      sgstPercent: 9,
    },
    {
      id: 6,
      description: "General Service Charge\n* 2days Labor Charge.\n* General Checking for all cctv camera and Desktop DVR Configuration.",
      hsn: "",
      qty: 1,
      uom: "",
      price: 4500.0,
      cgstPercent: 9,
      sgstPercent: 9,
    },
  ]);

  const [terms, setTerms] = useState("Thanks for your support");
  const [saving, setSaving] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData && open) {
      if (initialData.style) setInvoiceStyle(initialData.style);
      setInvoiceNumber(initialData.invoiceNumber || "");
      setIssueDate(initialData.issueDate || "");
      setDueDate(initialData.dueDate || "");
      setPlaceOfSupply(initialData.placeOfSupply || "");
      setSenderCompany(initialData.senderCompany || "");
      setSenderAddress(initialData.senderAddress || "");
      setSenderPhone(initialData.senderPhone || "");
      setSenderEmail(initialData.senderEmail || "");
      setSenderGSTIN(initialData.senderGSTIN || "");
      if (initialData.senderWebsite) setSenderWebsite(initialData.senderWebsite);
      if (initialData.senderContactName) setSenderContactName(initialData.senderContactName);
      setBillToName(initialData.billToName || "");
      setBillToPhone(initialData.billToPhone || "");
      setBillToAddress(initialData.billToAddress || "");
      setBillToGSTIN(initialData.billToGSTIN || "");
      setShipToName(initialData.shipToName || "");
      setShipToPhone(initialData.shipToPhone || "");
      setShipToAddress(initialData.shipToAddress || "");
      setItems(initialData.items || []);
      if (initialData.terms) setTerms(initialData.terms);
    }
  }, [initialData, open]);

  // Calculations
  const calculatedItems: CalculatedInvoiceLineItem[] = items.map((item) => {
    const qty = Number(item.qty) || 0;
    const price = Number(item.price) || 0;
    const cgstPercent = Number(item.cgstPercent) || 0;
    const sgstPercent = Number(item.sgstPercent) || 0;

    const taxableValue = qty * price;
    const cgstAmount = taxableValue * (cgstPercent / 100);
    const sgstAmount = taxableValue * (sgstPercent / 100);
    const totalAmount = taxableValue + cgstAmount + sgstAmount;

    return {
      ...item,
      taxableValue,
      cgstAmount,
      sgstAmount,
      totalAmount,
    };
  });

  const totalTaxableValue = calculatedItems.reduce(
    (sum, item) => sum + item.taxableValue,
    0
  );
  const totalCGST = calculatedItems.reduce((sum, item) => sum + item.cgstAmount, 0);
  const totalSGST = calculatedItems.reduce((sum, item) => sum + item.sgstAmount, 0);
  const overallTotal = totalTaxableValue + totalCGST + totalSGST;

  const totalRounded = Math.round(overallTotal);
  const roundedOffValue = totalRounded - overallTotal;

  // Number to words helper
  function numberToWords(num: number): string {
    if (num === 0) return "Zero Only";
    const a = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const b = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    function toWords(n: number): string {
      if (n < 20) return a[n];
      if (n < 100)
        return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
      if (n < 1000)
        return (
          a[Math.floor(n / 100)] +
          " Hundred" +
          (n % 100 ? " and " + toWords(n % 100) : "")
        );
      return "";
    }

    const parts: string[] = [];
    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const hundred = num;

    if (crore) parts.push(toWords(crore) + " Crore");
    if (lakh) parts.push(toWords(lakh) + " Lakh");
    if (thousand) parts.push(toWords(thousand) + " Thousand");
    if (hundred) parts.push(toWords(hundred));

    return parts.filter(Boolean).join(" ") + " Only";
  }

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        description: "",
        hsn: "",
        qty: 1,
        uom: "",
        price: 0,
        cgstPercent: 9,
        sgstPercent: 9,
      },
    ]);
  };

  const handleRemoveItem = (id: LineItemId) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItemField = (
    id: LineItemId,
    field: keyof InvoiceLineItem,
    val: LineItemValue,
  ) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleSaveInvoice = async () => {
    if (!onSubmitInvoice) return;
    setSaving(true);
    try {
      await onSubmitInvoice({
        invoiceNumber,
        issueDate,
        dueDate,
        placeOfSupply,
        senderCompany,
        senderAddress,
        senderPhone,
        senderEmail,
        senderGSTIN,
        senderWebsite,
        senderContactName,
        billToName,
        billToPhone,
        billToAddress,
        billToGSTIN,
        shipToName,
        shipToPhone,
        shipToAddress,
        items: calculatedItems,
        terms,
        totalTaxableValue,
        totalCGST,
        totalSGST,
        overallTotal,
        style: invoiceStyle,
      });
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const previewEl = printRef.current;
    if (!previewEl) return;

    const printWindow = window.open("", "_blank", "width=800,height=1100");
    if (!printWindow) return;

    const styles = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]')
    )
      .map((node) => node.outerHTML)
      .join("\n");

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Invoice - ${invoiceNumber || "New"}</title>
      ${styles}
      <style>
        @page{size:A4;margin:0}
        *{box-sizing:border-box}
        body{margin:0;background:#fff;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
        .print-root{width:210mm;margin:0 auto;background:#fff}
        .print-root .shadow-xl{box-shadow:none!important}
      </style></head><body>
      <div class="print-root">${previewEl.outerHTML}</div>
      <script>window.onload=function(){window.focus();window.onafterprint=function(){window.close()};window.print();}</script>
    </body></html>`);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] w-full max-h-[92vh] overflow-y-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0 overflow-x-hidden">
        <DialogHeader className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between flex-wrap gap-2">
          <DialogTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" /> Invoice Creator & Editor
          </DialogTitle>
          <div className="flex items-center gap-3">
            {allowStyleChange && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Template:</span>
                <Select value={invoiceStyle} onValueChange={(val) => setInvoiceStyle(val as DocumentStyle)}>
                  <SelectTrigger className="h-8 w-36 text-xs bg-white dark:bg-slate-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">100% Classic (B&W)</SelectItem>
                    <SelectItem value="orange">Modern Orange</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              onClick={handlePrint}
              variant="default"
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-8"
            >
              <Printer className="w-4 h-4" /> Print
            </Button>
            {onSubmitInvoice && (
              <Button onClick={handleSaveInvoice} disabled={saving} className="h-8">
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {saving ? "Saving..." : "Save Invoice"}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left Panel: Form Section */}
          <div className="lg:col-span-12 p-4 max-h-[calc(92vh-100px)] overflow-y-auto space-y-5 bg-white dark:bg-slate-900/40">
            {/* INVOICE DETAILS */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm border-b pb-1">
                Invoice Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Invoice Number</Label>
                  <Input
                    className="h-8 text-xs"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Place of Supply</Label>
                  <Input
                    className="h-8 text-xs"
                    value={placeOfSupply}
                    onChange={(e) => setPlaceOfSupply(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Issue Date</Label>
                  <Input
                    className="h-8 text-xs"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Due Date</Label>
                  <Input
                    className="h-8 text-xs"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* SENDER DETAILS */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm border-b pb-1">
                Sender / Company Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Sender Company Name</Label>
                  <Input
                    className="h-8 text-xs"
                    value={senderCompany}
                    onChange={(e) => setSenderCompany(e.target.value)}
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Sender Address</Label>
                  <Input
                    className="h-8 text-xs"
                    value={senderAddress}
                    onChange={(e) => setSenderAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sender GSTIN</Label>
                  <Input
                    className="h-8 text-xs"
                    value={senderGSTIN}
                    onChange={(e) => setSenderGSTIN(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Contact Name</Label>
                  <Input
                    className="h-8 text-xs"
                    value={senderContactName}
                    onChange={(e) => setSenderContactName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sender Email</Label>
                  <Input
                    className="h-8 text-xs"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sender Phone</Label>
                  <Input
                    className="h-8 text-xs"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Sender Website</Label>
                  <Input
                    className="h-8 text-xs"
                    value={senderWebsite}
                    onChange={(e) => setSenderWebsite(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* BILL TO DETAILS */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm border-b pb-1">
                Bill To Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Client Name</Label>
                  <Input
                    className="h-8 text-xs"
                    value={billToName}
                    onChange={(e) => setBillToName(e.target.value)}
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Client Address</Label>
                  <Input
                    className="h-8 text-xs"
                    value={billToAddress}
                    onChange={(e) => setBillToAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Client GSTIN</Label>
                  <Input
                    className="h-8 text-xs"
                    value={billToGSTIN}
                    onChange={(e) => setBillToGSTIN(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Client Phone</Label>
                  <Input
                    className="h-8 text-xs"
                    value={billToPhone}
                    onChange={(e) => setBillToPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* SHIP TO DETAILS */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm border-b pb-1">
                Ship To Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Recipient Name</Label>
                  <Input
                    className="h-8 text-xs"
                    value={shipToName}
                    onChange={(e) => setShipToName(e.target.value)}
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Delivery Address</Label>
                  <Input
                    className="h-8 text-xs"
                    value={shipToAddress}
                    onChange={(e) => setShipToAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Recipient Phone</Label>
                  <Input
                    className="h-8 text-xs"
                    value={shipToPhone}
                    onChange={(e) => setShipToPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ITEMS SECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-1">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                  Invoice Items
                </h3>
                <Button
                  onClick={handleAddItem}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 border-indigo-600 hover:bg-indigo-50"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">
                        Item {idx + 1}
                      </span>
                      {items.length > 1 && (
                        <Button
                          onClick={() => handleRemoveItem(item.id)}
                          size="sm"
                          variant="ghost"
                          className="h-6 px-1 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-12">
                        <Label className="text-[10px]">Description</Label>
                        <textarea
                          rows={2}
                          className="w-full text-xs p-1.5 border rounded-md dark:bg-slate-900 border-slate-200"
                          value={item.description}
                          onChange={(e) =>
                            updateItemField(item.id, "description", e.target.value)
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-[10px]">HSN</Label>
                        <Input
                          className="h-7 text-xs px-1.5"
                          value={item.hsn}
                          onChange={(e) =>
                            updateItemField(item.id, "hsn", e.target.value)
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-[10px]">Qty</Label>
                        <Input
                          className="h-7 text-xs px-1.5"
                          type="number"
                          value={item.qty}
                          onChange={(e) =>
                            updateItemField(item.id, "qty", Number(e.target.value))
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-[10px]">UoM</Label>
                        <Input
                          className="h-7 text-xs px-1.5"
                          value={item.uom}
                          onChange={(e) =>
                            updateItemField(item.id, "uom", e.target.value)
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-[10px]">Price (₹)</Label>
                        <Input
                          className="h-7 text-xs px-1.5"
                          type="number"
                          value={item.price}
                          onChange={(e) =>
                            updateItemField(
                              item.id,
                              "price",
                              Number(e.target.value)
                            )
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-[10px]">CGST %</Label>
                        <Input
                          className="h-7 text-xs px-1.5"
                          type="number"
                          value={item.cgstPercent}
                          onChange={(e) =>
                            updateItemField(
                              item.id,
                              "cgstPercent",
                              Number(e.target.value)
                            )
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-[10px]">SGST %</Label>
                        <Input
                          className="h-7 text-xs px-1.5"
                          type="number"
                          value={item.sgstPercent}
                          onChange={(e) =>
                            updateItemField(
                              item.id,
                              "sgstPercent",
                              Number(e.target.value)
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TERMS (Tax Invoice / orange template) */}
            {invoiceStyle === "orange" && (
              <div className="space-y-3">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm border-b pb-1">
                  Terms &amp; Conditions
                </h3>
                <textarea
                  rows={2}
                  className="w-full text-xs p-1.5 border rounded-md dark:bg-slate-900 border-slate-200"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Hidden print source */}
          <div className="hidden">
            <div ref={printRef} id="invoice-preview-container" className="flex flex-col gap-0 select-none pointer-events-none bg-white" style={{ width: "210mm", background: "#fff" }}>
              
              {invoiceStyle === "classic" ? (
                <div
                  className="bg-white text-black p-8 shadow-xl text-[12px] leading-relaxed relative flex flex-col justify-between"
                  style={{
                    fontFamily: "system-ui, -apple-system, Arial, sans-serif",
                    color: "#1a1a1a",
                    boxSizing: "border-box",
                    width: "210mm",
                    minHeight: "297mm",
                  }}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={renderlogo}
                          alt="Logo"
                          className="h-10 w-auto object-contain select-none pointer-events-none"
                        />
                        <div>
                          <div className="text-sm font-extrabold text-indigo-950 tracking-wide leading-none">
                            RENDERWAYS TECHNOLOGY
                          </div>
                          <div className="text-[9px] font-bold text-pink-600 tracking-wider mt-0.5">
                            PVT LTD
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <h1 className="text-base font-bold text-slate-800 leading-none">
                          TAX INVOICE
                        </h1>
                        <p className="text-[9px] font-medium text-slate-500 mt-1">
                          Original Copy
                        </p>
                        <p className="text-xs font-extrabold text-indigo-900 mt-1">
                          {invoiceNumber}
                        </p>
                      </div>
                    </div>

                    {/* 2. Sender and Amount Due row */}
                    <div className="grid grid-cols-12 gap-3 mb-4">
                      {/* Company contact info left */}
                      <div className="col-span-6 text-[8px] leading-[13px] text-slate-700">
                        <p className="font-extrabold text-[10px] text-indigo-950">
                          {senderCompany}
                        </p>
                        <p>{senderAddress}</p>
                        <p>Phone: {senderPhone}</p>
                        <p>Email: {senderEmail}</p>
                        <p className="font-bold">GSTIN: {senderGSTIN}</p>
                        <p>Website: {senderWebsite}</p>
                        <p>Contact Name: {senderContactName}</p>
                      </div>

                      {/* Date, place of supply, and bold Amount Due box right */}
                      <div className="col-span-6 flex flex-col justify-between items-end text-[9px]">
                        <div className="w-full bg-[#e46a25] text-white p-2 rounded-sm text-right flex justify-between items-center mb-2">
                          <span className="text-[9px] font-bold">Amount Due:</span>
                          <span className="text-xs font-black">
                            ₹{overallTotal.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="w-full space-y-1 text-right text-slate-800">
                          <p>
                            <span className="font-bold text-slate-600">
                              Issue Date:
                            </span>{" "}
                            {issueDate}
                          </p>
                          <p>
                            <span className="font-bold text-slate-600">
                              Due Date:
                            </span>{" "}
                            {dueDate}
                          </p>
                          <p>
                            <span className="font-bold text-slate-600">
                              Place of Supply:
                            </span>{" "}
                            {placeOfSupply}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 3. Bill To & Ship To grids */}
                    <div className="grid grid-cols-2 gap-4 mb-4 border-t border-b py-2 border-slate-200">
                      <div>
                        <h4 className="font-extrabold text-[10px] text-indigo-900 mb-0.5">
                          Bill To
                        </h4>
                        <p className="font-black text-slate-800">{billToName}</p>
                        <p className="text-[8px] text-slate-600">{billToPhone}</p>
                        <p className="text-[8.5px] text-slate-600 leading-[12px]">
                          {billToAddress}
                        </p>
                        <p className="font-bold text-[8.5px] text-indigo-950">
                          GSTIN: {billToGSTIN}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[10px] text-indigo-900 mb-0.5">
                          Ship To
                        </h4>
                        <p className="font-black text-slate-800">{shipToName}</p>
                        <p className="text-[8px] text-slate-600">{shipToPhone}</p>
                        <p className="text-[8.5px] text-slate-600 leading-[12px]">
                          {shipToAddress}
                        </p>
                      </div>
                    </div>

                    {/* 4. Dynamic Items Table */}
                    <div className="mb-3 overflow-hidden border border-slate-300 rounded-sm">
                      <table className="w-full text-left border-collapse text-[8px]">
                        <thead>
                          <tr className="bg-[#e46a25] text-white">
                            <th className="p-1 font-bold text-center border-r border-slate-300 w-6">
                              S.No
                            </th>
                            <th className="p-1 font-bold border-r border-slate-300">
                              Item Description
                            </th>
                            <th className="p-1 font-bold border-r border-slate-300 text-center w-12">
                              HSN/SAC
                            </th>
                            <th className="p-1 font-bold border-r border-slate-300 text-right w-12">
                              Qty UoM
                            </th>
                            <th className="p-1 font-bold border-r border-slate-300 text-right w-14">
                              Price (₹)
                            </th>
                            <th className="p-1 font-bold border-r border-slate-300 text-right w-14">
                              Taxable (₹)
                            </th>
                            <th className="p-1 font-bold border-r border-slate-300 text-right w-14">
                              CGST (₹)
                            </th>
                            <th className="p-1 font-bold border-r border-slate-300 text-right w-14">
                              SGST (₹)
                            </th>
                            <th className="p-1 font-bold text-right w-14">
                              Amount (₹)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {calculatedItems.map((item, i) => (
                            <tr key={item.id} className="text-slate-800">
                              <td className="p-1 border-r border-slate-200 text-center">
                                {i + 1}
                              </td>
                              <td className="p-1 border-r border-slate-200 font-bold whitespace-pre-wrap leading-[12px]">
                                {item.description}
                              </td>
                              <td className="p-1 border-r border-slate-200 text-center">
                                {item.hsn}
                              </td>
                              <td className="p-1 border-r border-slate-200 text-right leading-[12px]">
                                {item.qty} {item.uom && <span>{item.uom}</span>}
                              </td>
                              <td className="p-1 border-r border-slate-200 text-right">
                                {item.price.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="p-1 border-r border-slate-200 text-right">
                                {item.taxableValue.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="p-1 border-r border-slate-200 text-right leading-[10px]">
                                {item.cgstAmount.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                                <div className="text-[7px] text-slate-500 font-medium">
                                  {item.cgstPercent}%
                                </div>
                              </td>
                              <td className="p-1 border-r border-slate-200 text-right leading-[10px]">
                                {item.sgstAmount.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                                <div className="text-[7px] text-slate-500 font-medium">
                                  {item.sgstPercent}%
                                </div>
                              </td>
                              <td className="p-1 text-right font-bold">
                                {item.totalAmount.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                            </tr>
                          ))}

                          {/* Totals Row inside table */}
                          <tr className="font-extrabold text-slate-900 border-t-2 border-slate-300">
                            <td
                              colSpan={5}
                              className="p-1 text-right border-r border-slate-200"
                            >
                              Total @{(calculatedItems[0]?.cgstPercent ?? 0) + (calculatedItems[0]?.sgstPercent ?? 0)}%
                            </td>
                            <td className="p-1 text-right border-r border-slate-200">
                              {totalTaxableValue.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="p-1 text-right border-r border-slate-200">
                              {totalCGST.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="p-1 text-right border-r border-slate-200">
                              {totalSGST.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="p-1 text-right">
                              {overallTotal.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* 5. Direct Summary & Totals calculation below table */}
                    <div className="flex flex-col items-end w-full space-y-1 mb-4 text-[9px] text-slate-800">
                      <div className="flex justify-between w-64 border-b border-slate-200 pb-0.5">
                        <span className="font-bold">Total Taxable Value</span>
                        <span className="font-extrabold">
                          ₹
                          {totalTaxableValue.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between w-64 border-b border-slate-200 pb-0.5">
                        <span className="font-bold">Rounded Off</span>
                        <span className="font-extrabold">
                          {roundedOffValue < 0 ? "(-)" : "(+)"} ₹
                          {Math.abs(roundedOffValue).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between w-64 border-b border-slate-200 pb-0.5">
                        <span className="font-extrabold text-slate-900">
                          Total Value (in figure)
                        </span>
                        <span className="font-black text-indigo-900 text-xs">
                          ₹
                          {totalRounded.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between w-full mt-1">
                        <span className="font-bold text-slate-600">
                          Total Value (in words):
                        </span>
                        <span className="font-black text-slate-900 text-[9.5px]">
                          ₹ {numberToWords(totalRounded)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 6. Stamp/Signatory Area */}
                  <div className="border-t border-slate-200 pt-3 flex justify-between items-end mt-2 select-none">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-20 h-11 border border-indigo-200 border-dashed rounded flex items-center justify-center text-[7.5px] text-indigo-400 font-bold opacity-60">
                        Seal & Stamp
                      </div>
                    </div>
                    <div className="text-right text-[8.5px] text-slate-600">
                      <p className="mb-5 font-bold">Authorized Signatory</p>
                      <p className="border-t border-slate-300 w-32 inline-block pt-0.5 mt-2">
                        For {senderCompany}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* ------------------- MODERN ORANGE STYLE (TABLE BASED ROBUST REPLICA) ------------------- */
                <div style={{ width: "210mm", minHeight: "297mm", padding: "12mm 15mm", boxSizing: "border-box", background: "#ffffff", color: "#222", fontFamily: "Arial, sans-serif" }}>
                  {/* 1. Top Structural Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginBottom: '35px', tableLayout: 'fixed' }}>
                    <tbody>
                      <tr>
                        {/* Left Region */}
                        <td style={{ width: '55%', verticalAlign: 'top', paddingRight: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                            <img src={renderlogo} alt="Logo" style={{ height: '42px', objectFit: 'contain' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#951c61', letterSpacing: '0.4px' }}>RENDERWAYS TECHNOLOGY</div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#34225c', letterSpacing: '0.4px' }}>PVT LTD</div>
                            </div>
                          </div>
                          
                          <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#333' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '12.5px', marginBottom: '3px', color: '#111' }}>{senderCompany}</div>
                            <div style={{ whiteSpace: 'pre-line', marginBottom: '3px', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{senderAddress}</div>
                            <div style={{ marginBottom: '1px' }}>{senderPhone}</div>
                            <div style={{ marginBottom: '1px' }}>{senderEmail}</div>
                            <div style={{ fontWeight: 'bold', color: '#111' }}>GSTIN: {senderGSTIN}</div>
                            {senderWebsite && <div>Website: {senderWebsite}</div>}
                          </div>
                        </td>
                        
                        {/* Right Region - Spine alignment */}
                        <td style={{ width: '45%', verticalAlign: 'top' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginBottom: '25px' }}>
                            <tbody>
                              <tr style={{ height: '30px' }}>
                                <td style={{ width: '120px', fontSize: '18px', fontWeight: 'bold', color: '#222', verticalAlign: 'bottom' }}>INVOICE</td>
                                <td style={{ fontSize: '18px', fontWeight: 'bold', color: '#222', textAlign: 'right', verticalAlign: 'bottom' }}>{invoiceNumber}</td>
                              </tr>
                              <tr style={{ height: '20px' }}>
                                <td style={{ fontSize: '12px', color: '#333', verticalAlign: 'middle' }}>Issue Date:</td>
                                <td style={{ fontSize: '12px', color: '#333', textAlign: 'right', verticalAlign: 'middle' }}>{issueDate ? issueDate.split('-').reverse().join(' - ') : ''}</td>
                              </tr>
                              <tr style={{ height: '20px' }}>
                                <td style={{ fontSize: '12px', color: '#333', verticalAlign: 'middle' }}>Due Date:</td>
                                <td style={{ fontSize: '12px', color: '#333', textAlign: 'right', verticalAlign: 'middle' }}>{dueDate ? dueDate.split('-').reverse().join(' - ') : ''}</td>
                              </tr>
                              <tr style={{ height: '20px' }}>
                                <td style={{ fontSize: '12px', color: '#333', verticalAlign: 'middle' }}>Place of Supply:</td>
                                <td style={{ fontSize: '12px', color: '#333', textAlign: 'right', verticalAlign: 'middle' }}>{placeOfSupply}</td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* 2. Recipient Details Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginBottom: '25px', tableLayout: 'fixed' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '55%', verticalAlign: 'top', fontSize: '12px', lineHeight: '1.5', paddingRight: '20px' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '12.5px', marginBottom: '3px' }}>Bill To</div>
                          <div style={{ fontWeight: 'bold', fontSize: '13.5px', marginBottom: '1px' }}>{billToName}</div>
                          {billToPhone && <div style={{ marginBottom: '1px' }}>{billToPhone}</div>}
                          <div style={{ whiteSpace: 'pre-line', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{billToAddress}</div>
                          {billToGSTIN && <div style={{ fontWeight: 'bold', color: '#111', marginTop: '2px' }}>GSTIN: {billToGSTIN}</div>}
                        </td>
                        <td style={{ width: '45%', verticalAlign: 'top', fontSize: '12px', lineHeight: '1.5' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '12.5px', marginBottom: '3px' }}>Ship To</div>
                          <div style={{ fontWeight: 'bold', fontSize: '13.5px', marginBottom: '1px' }}>{shipToName}</div>
                          <div style={{ marginBottom: '1px' }}>{shipToPhone ? shipToPhone : ''}</div>
                          <div style={{ whiteSpace: 'pre-line', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{shipToAddress}</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* 3. The Content Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#d9662c', color: '#ffffff' }}>
                        <th style={{ padding: '8px 4px', fontWeight: '500', textAlign: 'center' }}>S.No</th>
                        <th style={{ padding: '8px 6px', fontWeight: '500', textAlign: 'left' }}>Item Description</th>
                        <th style={{ padding: '8px 4px', fontWeight: '500', textAlign: 'center' }}>HSN/SAC</th>
                        <th style={{ padding: '8px 4px', fontWeight: '500', textAlign: 'center' }}>Qty<br/><span style={{ fontSize: '8.5px', fontWeight: 'normal' }}>UoM</span></th>
                        <th style={{ padding: '8px 4px', fontWeight: '500', textAlign: 'right' }}>Price<br/><span style={{ fontSize: '8.5px', fontWeight: 'normal' }}>(INR)</span></th>
                        <th style={{ padding: '8px 4px', fontWeight: '500', textAlign: 'right' }}>Taxable Value<br/><span style={{ fontSize: '8.5px', fontWeight: 'normal' }}>(INR)</span></th>
                        <th style={{ padding: '8px 4px', fontWeight: '500', textAlign: 'right' }}>CGST<br/><span style={{ fontSize: '8.5px', fontWeight: 'normal' }}>(INR)</span></th>
                        <th style={{ padding: '8px 4px', fontWeight: '500', textAlign: 'right' }}>SGST<br/><span style={{ fontSize: '8.5px', fontWeight: 'normal' }}>(INR)</span></th>
                        <th style={{ padding: '8px 4px', fontWeight: '500', textAlign: 'right' }}>Amount<br/><span style={{ fontSize: '8.5px', fontWeight: 'normal' }}>(INR)</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculatedItems.map((item, idx) => (
                        <tr key={item.id} style={{ verticalAlign: 'top' }}>
                          <td style={{ padding: '8px 4px', border: '1px solid #e5e7eb', borderTop: idx === 0 ? '1px solid #e5e7eb' : 'none', textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ padding: '8px 6px', border: '1px solid #e5e7eb', borderTop: idx === 0 ? '1px solid #e5e7eb' : 'none' }}>
                            {item.description.split('\n').map((line: string, i: number) => (
                              <div key={i} style={{ color: i === 0 ? '#0c63a3' : '#333', fontWeight: i === 0 ? '500' : 'normal', marginBottom: '1px' }}>{line}</div>
                            ))}
                          </td>
                          <td style={{ padding: '8px 4px', border: '1px solid #e5e7eb', borderTop: idx === 0 ? '1px solid #e5e7eb' : 'none', textAlign: 'center' }}>{item.hsn}</td>
                          <td style={{ padding: '8px 4px', border: '1px solid #e5e7eb', borderTop: idx === 0 ? '1px solid #e5e7eb' : 'none', textAlign: 'center' }}>
                            <div>{item.qty}</div>
                            {item.uom && <div style={{ fontSize: '8.5px', marginTop: '1px' }}>{item.uom}</div>}
                          </td>
                          <td style={{ padding: '8px 4px', border: '1px solid #e5e7eb', borderTop: idx === 0 ? '1px solid #e5e7eb' : 'none', textAlign: 'right' }}>
                            {item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '8px 4px', border: '1px solid #e5e7eb', borderTop: idx === 0 ? '1px solid #e5e7eb' : 'none', textAlign: 'right' }}>
                            {item.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '8px 4px', border: '1px solid #e5e7eb', borderTop: idx === 0 ? '1px solid #e5e7eb' : 'none', textAlign: 'right' }}>
                            <div>{item.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div style={{ fontSize: '8.5px', marginTop: '1px', color: '#444' }}>{item.cgstPercent}%</div>
                          </td>
                          <td style={{ padding: '8px 4px', border: '1px solid #e5e7eb', borderTop: idx === 0 ? '1px solid #e5e7eb' : 'none', textAlign: 'right' }}>
                            <div>{item.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div style={{ fontSize: '8.5px', marginTop: '1px', color: '#444' }}>{item.sgstPercent}%</div>
                          </td>
                          <td style={{ padding: '8px 4px', border: '1px solid #e5e7eb', borderTop: idx === 0 ? '1px solid #e5e7eb' : 'none', textAlign: 'right' }}>
                            {item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ height: '35px' }}>
                        <td colSpan={2} style={{ border: 'none', backgroundColor: 'transparent' }}></td>
                        <td style={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', textAlign: 'right', padding: '8px' }}>Total</td>
                        <td style={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', textAlign: 'center', padding: '8px 4px' }}>@{calculatedItems[0]?.cgstPercent || 0}%</td>
                        <td style={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }}></td>
                        <td style={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', textAlign: 'right', padding: '8px 4px' }}>
                          {totalTaxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', textAlign: 'right', padding: '8px 4px' }}>
                          {totalCGST.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', textAlign: 'right', padding: '8px 4px' }}>
                          {totalSGST.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', textAlign: 'right', padding: '8px 4px' }}>
                          {overallTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* 4. Totals Block */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginTop: '20px', marginBottom: '25px' }}>
                    <tbody>
                      <tr>
                        <td>
                          <div style={{ fontSize: '11px', color: '#444' }}>
                            <span style={{ fontWeight: 'bold' }}>Amount In Words:</span><br/>
                            <span>INR {numberToWords(Math.round(overallTotal))}</span>
                          </div>
                        </td>
                        <td style={{ width: '260px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                              <tr style={{ height: '24px' }}>
                                <td style={{ fontSize: '12px', fontWeight: 'bold' }}>Total Taxable Value</td>
                                <td style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'right' }}>INR {totalTaxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              </tr>
                              <tr style={{ height: '24px' }}>
                                <td style={{ fontSize: '12px', fontWeight: 'bold' }}>Total Value (in figure)</td>
                                <td style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'right' }}>INR {Math.round(overallTotal).toLocaleString('en-IN')}</td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* 5. Final Bottom Block */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginTop: '30px' }}>
                    <tbody>
                      <tr>
                        <td style={{ verticalAlign: 'bottom', fontSize: '12px' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '6px' }}>Terms & Conditions</div>
                          <div style={{ fontStyle: 'italic', color: '#555' }}>{terms}</div>
                        </td>
                        <td style={{ width: '200px', textAlign: 'center', verticalAlign: 'bottom' }}>
                          <img src={stampImg} alt="stamp" style={{ height: '45px', objectFit: 'contain', mixBlendMode: 'multiply', marginBottom: '2px' }} />
                          <div style={{ width: '100%', height: '1px', backgroundColor: '#d1d5db', margin: '3px 0' }}></div>
                          <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#111' }}>Provider Signature</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
