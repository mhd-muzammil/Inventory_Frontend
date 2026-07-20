import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Printer, FileText, Loader2 } from "lucide-react";
import renderlogo from "@/assets/renderlogo.png";
import bobQr from "@/assets/bob_qr.png";
import rtplQuoteSign from "@/assets/rtpl_quote_sign.png";

type DocumentStyle = "classic" | "orange";
type LineItemId = number | string;
type LineItemValue = string | number;

interface QuotationLineItem {
  id: LineItemId;
  description: string;
  detailDesc: string;
  modelNo: string;
  slNo: string;
  hsn: string;
  qty: number;
  uom: string;
  price: number;
  cgstPercent: number;
  sgstPercent: number;
}

type CalculatedQuotationLineItem = QuotationLineItem & {
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
};

export interface QuotationDraftData {
  quoteNumber?: string;
  issueDate?: string;
  validUntil?: string;
  placeOfSupply?: string;
  caseId?: string;
  orderNumber?: string;
  senderCompany?: string;
  senderAddress?: string;
  senderPhone?: string;
  senderEmail?: string;
  senderGSTIN?: string;
  senderPAN?: string;
  senderWebsite?: string;
  bankDetails?: string;
  bankAc?: string;
  bankIfsc?: string;
  quoteToName?: string;
  quoteToEmail?: string;
  quoteToPhone?: string;
  quoteToAddress?: string;
  quoteToGSTIN?: string;
  shipToName?: string;
  shipToPhone?: string;
  shipToAddress?: string;
  items?: QuotationLineItem[];
  totalTaxableValue?: number;
  totalCGST?: number;
  totalSGST?: number;
  overallTotal?: number;
  terms?: string;
  style?: DocumentStyle;
  region?: string;
}

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  const formatNumber = (n: number) => {
    const str = String(n).padStart(9, '0');
    const matches = str.match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!matches) return "";
    
    let out = "";
    // Crore
    const c = parseInt(matches[1]);
    if (c > 0) out += (a[c] || b[parseInt(matches[1][0])] + " " + a[parseInt(matches[1][1])]) + "Crore ";
    // Lakh
    const l = parseInt(matches[2]);
    if (l > 0) out += (a[l] || b[parseInt(matches[2][0])] + " " + a[parseInt(matches[2][1])]) + "Lakh ";
    // Thousand
    const t = parseInt(matches[3]);
    if (t > 0) out += (a[t] || b[parseInt(matches[3][0])] + " " + a[parseInt(matches[3][1])]) + "Thousand ";
    // Hundred
    const h = parseInt(matches[4]);
    if (h > 0) out += a[h] + "Hundred ";
    // Ones/Tens
    const o = parseInt(matches[5]);
    if (o > 0) {
      if (out !== "") out += "and ";
      out += (a[o] || b[parseInt(matches[5][0])] + " " + a[parseInt(matches[5][1])]);
    }
    return out;
  };
  return formatNumber(Math.floor(num)).trim() + " Only";
}

interface QuotationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitQuotation?: (quotationData: QuotationDraftData) => Promise<void>;
  initialStyle?: DocumentStyle;
  initialData?: QuotationDraftData | null;
  defaultRegion?: string;
  allowStyleChange?: boolean;
}

export function QuotationFormDialog({
  open,
  onOpenChange,
  onSubmitQuotation,
  initialStyle = "classic",
  initialData = null,
  defaultRegion = "chennai",
  allowStyleChange = true,
}: QuotationFormDialogProps) {
  const [quotationStyle, setQuotationStyle] = useState<DocumentStyle>(initialStyle);
  
  const [quoteNumber, setQuoteNumber] = useState(initialStyle === "classic" ? "RTPL/25-26/QEN/271" : "RT25-26/QEN-2540");
  const [issueDate, setIssueDate] = useState(initialStyle === "classic" ? "2026-05-04" : "2025-12-09");
  const [validUntil, setValidUntil] = useState(initialStyle === "classic" ? "2026-05-09" : "2025-12-24");
  const [placeOfSupply, setPlaceOfSupply] = useState("TN (33)");
  const [region, setRegion] = useState<string>(initialData?.region || defaultRegion || "chennai");
  
  // Global fields
  const [caseId, setCaseId] = useState(initialStyle === "classic" ? "5158956515" : "");
  const [orderNumber, setOrderNumber] = useState(initialStyle === "classic" ? "WO-034297922" : "");

  // Sender Details
  const [senderCompany, setSenderCompany] = useState(initialStyle === "classic" ? "RENDERWAYS TECHNOLOGY PVT LTD" : "Renderways Technology Pvt Ltd");
  const [senderAddress, setSenderAddress] = useState(
    initialStyle === "classic" 
    ? "# 25, First Floor, Gandhi Street, Mettukuppam\nMaduravoyal, Chennai - 600095\nTamil Nadu"
    : "No. 25, 1st floor Gandhi street, Mettukuppam, Maduravoyal, Chennai-600095 Phoneno:9543095480 No:22/26 LIC Colony, Hotel Vasantham Road, OPP.New Bus stand, Salem - 636004 Phone : 8122633004, No.20/12, 1st West Highway Road, Katpadi(PO), Gandhi Nagar, Vellore- 632006. Phone no: 82206 60352, Chennai, Tamil Nadu (TN-33) 600095, IN"
  );
  const [senderPhone, setSenderPhone] = useState(initialStyle === "classic" ? "9543095480" : "+919543095480");
  const [senderEmail, setSenderEmail] = useState(initialStyle === "classic" ? "chennai@renderways.in" : "support@renderways.in");
  const [senderGSTIN, setSenderGSTIN] = useState("33AALCR1788A1ZG");
  const [senderWebsite, setSenderWebsite] = useState("www.renderways.in");
  const [senderPAN, setSenderPAN] = useState("AALCR1788A");

  // Bank Details
  const [bankDetails, setBankDetails] = useState("Bank of Baroda, Maduravoyal");
  const [bankAc, setBankAc] = useState("43770200000450");
  const [bankIfsc, setBankIfsc] = useState("BARB0MADTHI");

  // Quote To Details
  const [quoteToName, setQuoteToName] = useState(initialStyle === "classic" ? "Hemakannan" : "Dhamodharan");
  const [quoteToPhone, setQuoteToPhone] = useState(initialStyle === "classic" ? "7550193718" : "9790191909");
  const [quoteToEmail, setQuoteToEmail] = useState(initialStyle === "classic" ? "hemakannan1108@gmail.com" : "");
  const [quoteToAddress, setQuoteToAddress] = useState(
    initialStyle === "classic"
    ? "no 91, skramace meenakshi apt BB main road\nChennai\nTamilnadu\n600039"
    : "Vellore, Tamil Nadu (TN-33), IN"
  );
  const [quoteToGSTIN, setQuoteToGSTIN] = useState("");

  // Ship To Details — left empty so the print template falls back to Quote To details unless overridden
  const [shipToName, setShipToName] = useState("");
  const [shipToPhone, setShipToPhone] = useState("");
  const [shipToAddress, setShipToAddress] = useState("");

  // Terms & Conditions
  const [terms, setTerms] = useState(initialStyle === "classic" ? "Thanks for your support" : "Thanks for your support");

  // Items
  const [items, setItems] = useState<QuotationLineItem[]>(
    initialStyle === "classic" 
    ? [
        {
          id: 1,
          description: "Service Charge of HP Printer having details as",
          detailDesc: "HP LaserJet Tank MFP 2606sdw Printer",
          modelNo: "381U2A#ACJ",
          slNo: "VNF4803044",
          hsn: "",
          qty: 1,
          uom: "",
          price: 500.0,
          cgstPercent: 9,
          sgstPercent: 9,
        },
      ]
    : [
        {
          id: 1,
          description: "Hp victus laptop\n*S/NO.5cd337517p\n*Motherboard Issue",
          detailDesc: "",
          modelNo: "",
          slNo: "",
          hsn: "8471",
          qty: 1,
          uom: "",
          price: 5300.0,
          cgstPercent: 0,
          sgstPercent: 0,
        },
        {
          id: 2,
          description: "ServiceCharges",
          detailDesc: "",
          modelNo: "",
          slNo: "",
          hsn: "9987",
          qty: 1,
          uom: "NOS",
          price: 750.0,
          cgstPercent: 0,
          sgstPercent: 0,
        },
      ]
  );

  const [saving, setSaving] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData && open) {
      if (initialData.style) setQuotationStyle(initialData.style);
      setQuoteNumber(initialData.quoteNumber || "");
      setIssueDate(initialData.issueDate || "");
      setValidUntil(initialData.validUntil || "");
      setPlaceOfSupply(initialData.placeOfSupply || "");
      setCaseId(initialData.caseId || "");
      setOrderNumber(initialData.orderNumber || "");
      setSenderCompany(initialData.senderCompany || "");
      setSenderAddress(initialData.senderAddress || "");
      setSenderPhone(initialData.senderPhone || "");
      setSenderEmail(initialData.senderEmail || "");
      setSenderGSTIN(initialData.senderGSTIN || "");
      setSenderPAN(initialData.senderPAN || "");
      if (initialData.senderWebsite) setSenderWebsite(initialData.senderWebsite);
      if (initialData.bankDetails) setBankDetails(initialData.bankDetails);
      if (initialData.bankAc) setBankAc(initialData.bankAc);
      if (initialData.bankIfsc) setBankIfsc(initialData.bankIfsc);
      setQuoteToName(initialData.quoteToName || "");
      if (initialData.quoteToEmail) setQuoteToEmail(initialData.quoteToEmail);
      setQuoteToPhone(initialData.quoteToPhone || "");
      setQuoteToAddress(initialData.quoteToAddress || "");
      setQuoteToGSTIN(initialData.quoteToGSTIN || "");
      setShipToName(initialData.shipToName || "");
      setShipToPhone(initialData.shipToPhone || "");
      setShipToAddress(initialData.shipToAddress || "");
      setTerms(initialData.terms || "");
      setItems(initialData.items || []);
      if (initialData.region) setRegion(initialData.region);
    } else if (open) {
      // If creating new, reset region to default user region
      setRegion(defaultRegion || "chennai");
    }
  }, [initialData, open, defaultRegion]);

  // Calculations
  const calculatedItems: CalculatedQuotationLineItem[] = items.map((item) => {
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

  const totalTaxableValue = calculatedItems.reduce((sum, item) => sum + item.taxableValue, 0);
  const totalCGST = calculatedItems.reduce((sum, item) => sum + item.cgstAmount, 0);
  const totalSGST = calculatedItems.reduce((sum, item) => sum + item.sgstAmount, 0);
  const overallTotal = totalTaxableValue + totalCGST + totalSGST;

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        description: "",
        detailDesc: "",
        modelNo: "",
        slNo: "",
        hsn: "",
        qty: 1,
        uom: "",
        price: 0,
        cgstPercent: 0,
        sgstPercent: 0,
      },
    ]);
  };

  const handleRemoveItem = (id: LineItemId) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItemField = (
    id: LineItemId,
    field: keyof QuotationLineItem,
    val: LineItemValue,
  ) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleSaveQuotation = async () => {
    if (!onSubmitQuotation) return;
    setSaving(true);
    try {
      await onSubmitQuotation({
        quoteNumber,
        issueDate,
        validUntil,
        placeOfSupply,
        caseId,
        orderNumber,
        senderCompany,
        senderAddress,
        senderPhone,
        senderEmail,
        senderGSTIN,
        senderPAN,
        senderWebsite,
        bankDetails,
        bankAc,
        bankIfsc,
        quoteToName,
        quoteToEmail,
        quoteToPhone,
        quoteToAddress,
        quoteToGSTIN,
        shipToName,
        shipToPhone,
        shipToAddress,
        items: calculatedItems,
        totalTaxableValue,
        totalCGST,
        totalSGST,
        overallTotal,
        terms,
        style: quotationStyle,
        region,
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

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Quotation - ${quoteNumber || "New"}</title>
      ${styles}
      <style>
        @page{size:A4;margin:0}
        *{box-sizing:border-box}
        body{margin:0;background:#fff;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
        .print-root{width:210mm;margin:0 auto;background:#fff}
        .print-root .shadow-xl{box-shadow:none!important}
        .print-page-break{break-after:page;page-break-after:always}
      </style></head><body>
      <div class="print-root">${previewEl.outerHTML}</div>
      <script>window.onload=function(){window.focus();window.onafterprint=function(){window.close()};window.print();}</script>
    </body></html>`);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] w-full max-h-[92vh] overflow-y-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0 overflow-x-hidden">
        <DialogHeader className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between gap-4 flex-wrap">
          <DialogTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Quotation Editor
          </DialogTitle>
          <div className="flex items-center gap-3">
            {allowStyleChange && (
              <div className="flex items-center gap-2 mr-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Template:</span>
                <Select value={quotationStyle} onValueChange={(val) => setQuotationStyle(val as DocumentStyle)}>
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
            {onSubmitQuotation && (
              <Button onClick={handleSaveQuotation} disabled={saving} className="h-8">
                {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                Save
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left Panel */}
          <div className="lg:col-span-12 p-4 max-h-[calc(92vh-70px)] overflow-y-auto space-y-5 bg-white dark:bg-slate-900/40">
            <div className="space-y-3">
              <h3 className="font-bold text-indigo-600 text-sm border-b pb-1">Quotation Reference</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Quotation #</Label>
                  <Input className="h-8 text-xs" value={quoteNumber} onChange={(e) => setQuoteNumber(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Issue Date</Label>
                  <Input className="h-8 text-xs" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                </div>
                {quotationStyle === "orange" && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">Valid Until</Label>
                      <Input className="h-8 text-xs" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Place of Supply</Label>
                      <Input className="h-8 text-xs" value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)} />
                    </div>
                  </>
                )}
                <div className="space-y-1">
                  <Label className="text-xs">CASE ID</Label>
                  <Input className="h-8 text-xs" value={caseId} onChange={(e) => setCaseId(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ORDER NUMBER</Label>
                  <Input className="h-8 text-xs" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-indigo-600 font-semibold">Region (Filtering)</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger className="h-8 text-xs border-indigo-200">
                      <SelectValue placeholder="Select Region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vellore">Vellore</SelectItem>
                      <SelectItem value="salem">Salem</SelectItem>
                      <SelectItem value="chennai">Chennai</SelectItem>
                      <SelectItem value="kanchipuram">Kanchipuram</SelectItem>
                      <SelectItem value="hosur">Hosur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-indigo-600 text-sm border-b pb-1">Sender Info</h3>
              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-1"><Label className="text-xs">Company Name</Label><Input className="h-8 text-xs" value={senderCompany} onChange={(e) => setSenderCompany(e.target.value)} /></div>
                <div className="space-y-1"><Label className="text-xs">Address</Label><textarea className="w-full h-16 text-xs p-1.5 border rounded dark:bg-slate-800" value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-xs">GSTIN</Label><Input className="h-8 text-xs" value={senderGSTIN} onChange={(e) => setSenderGSTIN(e.target.value)} /></div>
                  <div className="space-y-1"><Label className="text-xs">PAN</Label><Input className="h-8 text-xs" value={senderPAN} onChange={(e) => setSenderPAN(e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-xs">Email</Label><Input className="h-8 text-xs" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} /></div>
                  <div className="space-y-1"><Label className="text-xs">Phone</Label><Input className="h-8 text-xs" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} /></div>
                </div>
                {quotationStyle === "orange" && (
                  <div className="space-y-1"><Label className="text-xs">Website</Label><Input className="h-8 text-xs" value={senderWebsite} onChange={(e) => setSenderWebsite(e.target.value)} /></div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-indigo-600 text-sm border-b pb-1">Quote To (Customer)</h3>
              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-1"><Label className="text-xs">Name</Label><Input className="h-8 text-xs" value={quoteToName} onChange={(e) => setQuoteToName(e.target.value)} /></div>
                <div className="space-y-1"><Label className="text-xs">Address</Label><textarea className="w-full h-16 text-xs p-1.5 border rounded dark:bg-slate-800" value={quoteToAddress} onChange={(e) => setQuoteToAddress(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-xs">Phone</Label><Input className="h-8 text-xs" value={quoteToPhone} onChange={(e) => setQuoteToPhone(e.target.value)} /></div>
                  <div className="space-y-1"><Label className="text-xs">Email</Label><Input className="h-8 text-xs" value={quoteToEmail} onChange={(e) => setQuoteToEmail(e.target.value)} /></div>
                </div>
                {quotationStyle === "orange" && (
                  <div className="space-y-1"><Label className="text-xs">GSTIN</Label><Input className="h-8 text-xs" value={quoteToGSTIN} onChange={(e) => setQuoteToGSTIN(e.target.value)} /></div>
                )}
              </div>
            </div>

            {quotationStyle === "orange" && (
              <div className="space-y-3">
                <h3 className="font-bold text-indigo-600 text-sm border-b pb-1">Ship To (leave blank to reuse Quote To)</h3>
                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-1"><Label className="text-xs">Name</Label><Input className="h-8 text-xs" value={shipToName} onChange={(e) => setShipToName(e.target.value)} /></div>
                  <div className="space-y-1"><Label className="text-xs">Address</Label><textarea className="w-full h-16 text-xs p-1.5 border rounded dark:bg-slate-800" value={shipToAddress} onChange={(e) => setShipToAddress(e.target.value)} /></div>
                  <div className="space-y-1"><Label className="text-xs">Phone</Label><Input className="h-8 text-xs" value={shipToPhone} onChange={(e) => setShipToPhone(e.target.value)} /></div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-1"><h3 className="font-bold text-indigo-600 text-sm">Line Items</h3><Button size="sm" className="h-6 text-xs" onClick={handleAddItem}>Add Item</Button></div>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 space-y-2 relative">
                    <Button onClick={() => handleRemoveItem(item.id)} variant="ghost" size="icon" className="h-5 w-5 text-red-500 absolute top-1 right-1"><Trash2 className="w-3 h-3"/></Button>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Item Description (Main)</Label>
                      <Input className="h-7 text-xs" value={item.description} onChange={(e) => updateItemField(item.id, "description", e.target.value)} />
                    </div>
                    {quotationStyle === "classic" && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1"><Label className="text-[10px]">Detail Item</Label><Input className="h-7 text-xs" value={item.detailDesc || ''} onChange={(e) => updateItemField(item.id, "detailDesc", e.target.value)} /></div>
                        <div><Label className="text-[10px]">Model No</Label><Input className="h-7 text-xs" value={item.modelNo || ''} onChange={(e) => updateItemField(item.id, "modelNo", e.target.value)} /></div>
                        <div><Label className="text-[10px]">Sl.No</Label><Input className="h-7 text-xs" value={item.slNo || ''} onChange={(e) => updateItemField(item.id, "slNo", e.target.value)} /></div>
                      </div>
                    )}
                    <div className={quotationStyle === "orange" ? "grid grid-cols-5 gap-2" : "grid grid-cols-4 gap-2"}>
                      <div><Label className="text-[10px]">Qty</Label><Input type="number" min={1} className="h-7 text-xs" value={item.qty} onChange={(e) => updateItemField(item.id, "qty", Number(e.target.value))} /></div>
                      <div><Label className="text-[10px]">Price</Label><Input type="number" className="h-7 text-xs" value={item.price} onChange={(e) => updateItemField(item.id, "price", Number(e.target.value))} /></div>
                      <div><Label className="text-[10px]">CGST%</Label><Input type="number" className="h-7 text-xs" value={item.cgstPercent} onChange={(e) => updateItemField(item.id, "cgstPercent", Number(e.target.value))} /></div>
                      <div><Label className="text-[10px]">SGST%</Label><Input type="number" className="h-7 text-xs" value={item.sgstPercent} onChange={(e) => updateItemField(item.id, "sgstPercent", Number(e.target.value))} /></div>
                      {quotationStyle === "orange" && <div><Label className="text-[10px]">HSN</Label><Input className="h-7 text-xs" value={item.hsn} onChange={(e) => updateItemField(item.id, "hsn", e.target.value)} /></div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {quotationStyle === "orange" && (
              <div className="space-y-3">
                <h3 className="font-bold text-indigo-600 text-sm border-b pb-1">Terms &amp; Conditions</h3>
                <textarea className="w-full h-16 text-xs p-1.5 border rounded dark:bg-slate-800" value={terms} onChange={(e) => setTerms(e.target.value)} />
              </div>
            )}

            {quotationStyle === "classic" && (
              <div className="space-y-3">
                <h3 className="font-bold text-indigo-600 text-sm border-b pb-1">Footer (Bank)</h3>
                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-1"><Label className="text-xs">Bank</Label><Input className="h-8 text-xs" value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">A/c No</Label><Input className="h-8 text-xs" value={bankAc} onChange={(e) => setBankAc(e.target.value)} /></div>
                    <div><Label className="text-xs">IFSC</Label><Input className="h-8 text-xs" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} /></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Hidden print source */}
          <div className="hidden">
            <div ref={printRef} id="quotation-preview-container" className="flex flex-col gap-0 select-none pointer-events-none bg-white" style={{ width: "210mm", background: "#fff" }}>
              
              {quotationStyle === "classic" ? (
                /* ------------------- CLASSIC BLACK & WHITE STYLE (100% ACCURATE) ------------------- */
                <>
                  {/* Page 1 Container */}
                  <div style={{ width: "210mm", minHeight: "297mm", padding: "15mm 15mm", boxSizing: "border-box", background: "#ffffff", color: "#000000", fontFamily: "Arial, sans-serif", position: 'relative' }}>
                    
                    {/* Header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                          <img src={renderlogo} alt="" style={{ height: '38px' }} />
                          <div>
                            <div style={{ color: '#8b2866', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Renderways Technology</div>
                            <div style={{ color: '#3d1958', fontSize: '8px', fontWeight: 'bold', letterSpacing: '0.5px' }}>PVT LTD</div>
                          </div>
                        </div>
                        <div style={{ fontSize: '11.5px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>{senderCompany}</div>
                        <div style={{ fontSize: '10.5px', whiteSpace: 'pre-line', lineHeight: '1.3' }}>{senderAddress}</div>
                        <div style={{ fontSize: '10.5px', marginTop: '2px' }}>GST # {senderGSTIN}</div>
                        <div style={{ fontSize: '10.5px' }}>{senderPhone}</div>
                      </div>
                      
                      <div style={{ textAlign: 'right', minWidth: '220px' }}>
                        <div style={{ fontSize: '34px', color: '#999999', fontWeight: 400, marginBottom: '12px', letterSpacing: '1.5px', fontFamily: 'Verdana, sans-serif' }}>QUOTATION</div>
                        <div style={{ fontSize: '10.5px', display: 'grid', gridTemplateColumns: '110px 1fr', textAlign: 'left', gap: '2px' }}>
                          <div style={{ fontWeight: 'bold' }}>Quotation Date :</div><div>{issueDate}</div>
                          <div style={{ fontWeight: 'bold' }}>Quotation #</div><div>{quoteNumber}</div>
                        </div>
                        <div style={{ height: '20px' }}></div>
                        <div style={{ fontSize: '10.5px', display: 'grid', gridTemplateColumns: '110px 1fr', textAlign: 'left', gap: '2px' }}>
                          <div style={{ fontWeight: 'bold' }}>CASE ID</div><div style={{ fontWeight: 'bold' }}>{caseId}</div>
                          <div style={{ fontWeight: 'bold' }}>ORDER NUMBER</div><div style={{ fontWeight: 'bold' }}>{orderNumber}</div>
                        </div>
                      </div>
                    </div>

                    {/* Customer To section */}
                    <div style={{ fontSize: '10.5px', marginBottom: '15px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>To:</div>
                      <div style={{ paddingLeft: '0px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{quoteToName}</div>
                        <div style={{ whiteSpace: 'pre-line', lineHeight: '1.3', color: '#333' }}>{quoteToAddress}</div>
                        {quoteToPhone && <div>{quoteToPhone}</div>}
                        {quoteToEmail && <div>{quoteToEmail}</div>}
                      </div>
                    </div>

                    {/* The Main Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '10.5px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #000' }}>
                          <th style={{ padding: '5px', borderRight: '1px solid #000', textAlign: 'center', fontWeight: 'bold', letterSpacing: '0.5px' }}>DESCRIPTION</th>
                          <th style={{ width: '140px', padding: '5px', textAlign: 'center', fontWeight: 'bold', letterSpacing: '0.5px' }}>AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculatedItems.map((item, index) => (
                          <React.Fragment key={item.id}>
                            {/* Row 1: Service charge display */}
                            <tr style={{ borderBottom: '1px solid #000' }}>
                              <td style={{ padding: '8px 15px', borderRight: '1px solid #000', textAlign: 'center' }}>{item.description}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', verticalAlign: 'bottom' }}>
                                {item.taxableValue.toFixed(2)}
                              </td>
                            </tr>
                            {/* Row 2: Sub-headers row inside the description column */}
                            <tr style={{ borderBottom: '1px solid #000' }}>
                              <td style={{ borderRight: '1px solid #000', padding: 0 }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <tr>
                                    <td style={{ padding: '3px 8px', borderRight: '1px solid #000', width: '60%', fontWeight: 'normal' }}>Description</td>
                                    <td style={{ padding: '3px 8px', borderRight: '1px solid #000', width: '18%', fontWeight: 'normal' }}>Model No</td>
                                    <td style={{ padding: '3px 8px', fontWeight: 'normal' }}>Sl.No</td>
                                  </tr>
                                </table>
                              </td>
                              <td style={{ borderLeft: 'none' }}></td>
                            </tr>
                            {/* Row 3: The detail value row */}
                            <tr style={{ borderBottom: (index === calculatedItems.length - 1) ? '0' : '1px solid #000' }}>
                              <td style={{ borderRight: '1px solid #000', padding: 0 }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                  <tr>
                                    <td style={{ padding: '5px 8px', borderRight: '1px solid #000', width: '60%' }}>{item.detailDesc}</td>
                                    <td style={{ padding: '5px 8px', borderRight: '1px solid #000', width: '18%' }}>{item.modelNo}</td>
                                    <td style={{ padding: '5px 8px' }}>{item.slNo}</td>
                                  </tr>
                                </table>
                              </td>
                              <td></td>
                            </tr>
                          </React.Fragment>
                        ))}
                        {/* Spacer for padding table height to look authentic */}
                        <tr style={{ height: '80px', borderBottom: '1px solid #000' }}>
                          <td style={{ borderRight: '1px solid #000' }}></td>
                          <td></td>
                        </tr>
                        {/* Summary rows at table foot */}
                        <tr style={{ borderBottom: '1px solid #000' }}>
                          <td style={{ padding: '4px 8px', borderRight: '1px solid #000' }}>Total Amount</td>
                          <td style={{ padding: '4px 10px', textAlign: 'right' }}>{totalTaxableValue.toFixed(2)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #000' }}>
                          <td style={{ padding: '4px 8px', borderRight: '1px solid #000' }}>SGST @ {calculatedItems[0]?.sgstPercent ?? 0} %</td>
                          <td style={{ padding: '4px 10px', textAlign: 'right' }}>{totalSGST.toFixed(2)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #000' }}>
                          <td style={{ padding: '4px 8px', borderRight: '1px solid #000' }}>CGST @ {calculatedItems[0]?.cgstPercent ?? 0} %</td>
                          <td style={{ padding: '4px 10px', textAlign: 'right' }}>{totalCGST.toFixed(2)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #000' }}>
                          <td style={{ padding: '4px 8px', borderRight: '1px solid #000' }}>Total TAX Amount</td>
                          <td style={{ padding: '4px 10px', textAlign: 'right' }}>{(totalSGST + totalCGST).toFixed(2)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #000', fontWeight: 'bold', fontSize: '11.5px' }}>
                          <td style={{ padding: '6px 8px', borderRight: '1px solid #000' }}>Total Quotation Value</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right' }}>{overallTotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td colSpan={2} style={{ padding: '4px 8px', fontStyle: 'italic' }}>Rupees {numberToWords(overallTotal)}</td>
                        </tr>
                        {/* Footer signatures block */}
                        <tr>
                          <td colSpan={2} style={{ padding: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', minHeight: '80px' }}>
                              <div style={{ alignSelf: 'flex-start' }}>
                                <div>PAN # {senderPAN}</div>
                                <div style={{ marginTop: '4px' }}>GST # {senderGSTIN}</div>
                              </div>
                              <div style={{ textAlign: 'right', position: 'relative', minWidth: '220px' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>For {senderCompany}</div>
                                <img src={rtplQuoteSign} alt="Authorized Signatory" style={{ height: '70px', objectFit: 'contain', display: 'block', margin: '5px 0 0 auto' }} />
                                <div style={{ fontWeight: 'bold', marginTop: '5px' }}>Authorized Signatory</div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Final bottom bar */}
                    <div style={{ border: '1px solid #000', borderTop: 0 }}>
                      <div style={{ backgroundColor: '#000', color: '#fff', textAlign: 'center', padding: '3px', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        THANKS FOR YOUR BUSINESS WITH US
                      </div>
                      <div style={{ padding: '6px 10px', fontSize: '9.5px', lineHeight: '1.5' }}>
                        <div><strong>A. Bank:</strong> {bankDetails}, <strong>A/c :</strong> {bankAc}  <strong>IFSC Code:</strong> {bankIfsc}</div>
                        <div><strong>B.</strong> Payments to be in advance and details of the payment to be shared on mail with us {senderEmail}</div>
                        <div><strong>C.</strong> Please refer the Terms and Conditions as metioned in page 2</div>
                      </div>
                    </div>

                  </div>

                  {/* Print page break */}
                  <div className="print-page-break" style={{ height: 0 }}></div>

                  {/* Page 2 Container: Terms & Conditions */}
                  <div style={{ width: "210mm", minHeight: "297mm", padding: "20mm 20mm", boxSizing: "border-box", background: "#ffffff", color: "#000000", fontFamily: "Arial, sans-serif" }}>
                    <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '15px', fontSize: '11.5px', letterSpacing: '0.3px' }}>
                      *PLEASE SHARE YOUR GST NO AND ENTITY NAME IN CASE YOU NEED TO CLAIM THE INPUT TAX BENEFITS *
                    </div>
                    
                    <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '8px' }}>Terms & Conditions:</div>
                    
                    <ol style={{ paddingLeft: '18px', fontSize: '10.5px', lineHeight: '1.45', color: '#222' }}>
                      <li style={{ marginBottom: '3px' }}>You are requested to approve the above Service / Part estimate charges to enable us to take up the repair.</li>
                      <li style={{ marginBottom: '3px' }}>The service charges are for troubleshooting , post making the payment the engineer shall visit , in case any parts required additional part</li>
                      <li style={{ marginBottom: '3px' }}>Part estimate will be provided by us separately If Part required to complete the service</li>
                      <li style={{ marginBottom: '3px' }}>The necessary order for the parts will be done post we receive the payments.</li>
                      <li style={{ marginBottom: '3px' }}>Estimate Quote is valid for 5 days from the Quoted date.</li>
                      <li style={{ marginBottom: '3px' }}>Payment should be 100% in advance through online mode only. Please don't do any cash transactions.</li>
                      <li style={{ marginBottom: '3px' }}>Upon making the payment towards service estimate charges as above please do share us the confirmation of the payment thru mail .We</li>
                      <li style={{ marginBottom: '3px' }}>The service estimate charges will be applicable for respective products should be paid in advance thru online mode only , and in case the</li>
                      <li style={{ marginBottom: '3px' }}>Authorization by way of P.O is required if Quoted value is Rs.10000/- & above.</li>
                      <li style={{ marginBottom: '3px' }}>Repaired units should be collected within 7 days of completion of repair.</li>
                      <li style={{ marginBottom: '3px' }}>Part will be replaced within 4 – 5 Weeks from the date of Quote approval & Advance Payment made subject to part availability.</li>
                      <li style={{ marginBottom: '3px' }}>Above-mentioned activity will be performed only during office hours (i.e. Mon to Fri 9.00 AM to 5.00 PM)</li>
                      <li style={{ marginBottom: '3px' }}>During the course of the repair, additional parts may be required to service the unit. In such case an additional quote will be raised for</li>
                      <li style={{ marginBottom: '3px' }}>Defective Parts that have been replaced with working Parts shall be returned to HP for disposal in accordance with e-waste Rules</li>
                      <li style={{ marginBottom: '3px' }}>Should you need any further clarification please feel free contact the undersigned .</li>
                    </ol>

                    <div style={{ fontSize: '10.5px', margin: '8px 0' }}>
                      Company GSTIN No: {senderGSTIN} &nbsp;&nbsp;&nbsp;&nbsp; Company PAN No : {senderPAN}
                    </div>

                    <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11.5px', margin: '12px 0' }}>
                      *PLEASE SHARE YOUR GST NO AND ENTITY NAME IN CASE YOU NEED TO CLAIM THE INPUT TAX BENEFITS *
                    </div>

                    <div style={{ marginTop: '30px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '8px' }}>Scan QR Code</div>
                      {/* QR IMAGE ASSET */}
                      <img src={bobQr} alt="QR" style={{ height: '220px', objectFit: 'contain', border: '1px solid #ddd' }} />
                    </div>
                  </div>
                </>
              ) : (
                /* ------------------- EXISTING MODERN ORANGE STYLE (ACCURATE REDESIGN) ------------------- */
                <div style={{ width: "210mm", minHeight: "297mm", padding: "12mm 15mm", boxSizing: "border-box", background: "#ffffff", color: "#222", fontFamily: "Arial, sans-serif" }}>
                  
                  {/* 1. Top Structural Table replacing Grid for robust print support */}
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
                            <div>Website: {senderWebsite}</div>
                          </div>
                        </td>
                        
                        {/* Right Region - Exact Spine alignment */}
                        <td style={{ width: '45%', verticalAlign: 'top' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginBottom: '25px' }}>
                            <tbody>
                              <tr style={{ height: '30px' }}>
                                <td style={{ width: '120px', fontSize: '18px', fontWeight: 'bold', color: '#222', verticalAlign: 'bottom' }}>QUOTE</td>
                                <td style={{ fontSize: '18px', fontWeight: 'bold', color: '#222', textAlign: 'right', verticalAlign: 'bottom' }}>{quoteNumber}</td>
                              </tr>
                              <tr style={{ height: '20px' }}>
                                <td style={{ fontSize: '12px', color: '#333', verticalAlign: 'middle' }}>Issue Date:</td>
                                <td style={{ fontSize: '12px', color: '#333', textAlign: 'right', verticalAlign: 'middle' }}>{issueDate ? issueDate.split('-').reverse().join(' - ') : ''}</td>
                              </tr>
                              <tr style={{ height: '20px' }}>
                                <td style={{ fontSize: '12px', color: '#333', verticalAlign: 'middle' }}>Valid Until:</td>
                                <td style={{ fontSize: '12px', color: '#333', textAlign: 'right', verticalAlign: 'middle' }}>{validUntil ? validUntil.split('-').reverse().join(' - ') : ''}</td>
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
                          <div style={{ fontWeight: 'bold', fontSize: '12.5px', marginBottom: '3px' }}>Quote To</div>
                          <div style={{ fontWeight: 'bold', fontSize: '13.5px', marginBottom: '1px' }}>{quoteToName}</div>
                          {quoteToPhone && <div style={{ marginBottom: '1px' }}>{quoteToPhone}</div>}
                          <div style={{ whiteSpace: 'pre-line', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{quoteToAddress}</div>
                          {quoteToGSTIN && <div style={{ fontWeight: 'bold', color: '#111', marginTop: '2px' }}>GSTIN: {quoteToGSTIN}</div>}
                        </td>
                        <td style={{ width: '45%', verticalAlign: 'top', fontSize: '12px', lineHeight: '1.5' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '12.5px', marginBottom: '3px' }}>Ship To</div>
                          <div style={{ fontWeight: 'bold', fontSize: '13.5px', marginBottom: '1px' }}>{shipToName || quoteToName}</div>
                          <div style={{ marginBottom: '1px' }}>{shipToPhone ? shipToPhone : (quoteToPhone || '')}</div>
                          <div style={{ whiteSpace: 'pre-line', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{shipToAddress || quoteToAddress}</div>
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
                      {/* Footer Row matches visually using solid Table borders logic */}
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

                  {/* 4. Totals Block with robust outer container */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginTop: '20px', marginBottom: '25px' }}>
                    <tbody>
                      <tr>
                        <td></td>
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

                  {/* 5. Final Bottom Block using robust Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginTop: '30px' }}>
                    <tbody>
                      <tr>
                        <td style={{ verticalAlign: 'bottom', fontSize: '12px' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '6px' }}>Terms & Conditions</div>
                          <div style={{ fontStyle: 'italic', color: '#555' }}>{terms}</div>
                        </td>
                        <td style={{ width: '200px', textAlign: 'center', verticalAlign: 'bottom' }}>
                          <img src={rtplQuoteSign} alt="Provider Signature" style={{ height: '70px', objectFit: 'contain', display: 'block', margin: '0 auto 2px' }} />
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

