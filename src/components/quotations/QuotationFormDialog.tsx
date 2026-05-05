import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Download, FileText, Loader2 } from "lucide-react";
import renderlogo from "@/assets/renderlogo.png";

interface QuotationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitQuotation?: (quotationData: any) => Promise<void>;
}

export function QuotationFormDialog({
  open,
  onOpenChange,
  onSubmitQuotation,
}: QuotationFormDialogProps) {
  const [quoteNumber, setQuoteNumber] = useState("RT25-26/QEN-2540");
  const [issueDate, setIssueDate] = useState("2025-12-09");
  const [validUntil, setValidUntil] = useState("2025-12-24");
  const [placeOfSupply, setPlaceOfSupply] = useState("TN (33)");

  // Sender Details
  const [senderCompany, setSenderCompany] = useState("Renderways Technology Pvt Ltd");
  const [senderAddress, setSenderAddress] = useState(
    "No. 25, 1st floor Gandhi street, Mettukuppam, Maduravoyal, Chennai-600095 Phoneno:9543095480 No:22/26 LIC Colony, Hotel Vasantham Road, OPP.New Bus stand, Salem - 636004 Phone : 8122633004, No.20/12, 1st West Highway Road, Katpadi(PO), Gandhi Nagar, Vellore- 632006. Phone no: 82206 60352, Chennai, Tamil Nadu (TN-33) 600095, IN"
  );
  const [senderPhone, setSenderPhone] = useState("+919543095480");
  const [senderEmail, setSenderEmail] = useState("support@renderways.in");
  const [senderGSTIN, setSenderGSTIN] = useState("33AALCR1788A1ZG");
  const [senderWebsite, setSenderWebsite] = useState("www.renderways.in");

  // Quote To Details
  const [quoteToName, setQuoteToName] = useState("Dhamodharan");
  const [quoteToPhone, setQuoteToPhone] = useState("9790191909");
  const [quoteToAddress, setQuoteToAddress] = useState(
    "Vellore, Tamil Nadu (TN-33), IN"
  );
  const [quoteToGSTIN, setQuoteToGSTIN] = useState("");

  // Ship To Details
  const [shipToName, setShipToName] = useState("");
  const [shipToPhone, setShipToPhone] = useState("9790191909");
  const [shipToAddress, setShipToAddress] = useState(
    "Vellore, Tamil Nadu (TN-33), IN"
  );

  // Terms & Conditions
  const [terms, setTerms] = useState("Thanks for your support");

  // Items
  const [items, setItems] = useState<any[]>([
    {
      id: 1,
      description: "Hp victus laptop\n*S/NO.5cd337517p\n*Motherboard Issue",
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
      hsn: "9987",
      qty: 1,
      uom: "NOS",
      price: 750.0,
      cgstPercent: 0,
      sgstPercent: 0,
    },
  ]);

  const [saving, setSaving] = useState(false);

  // Calculations
  const calculatedItems = items.map((item) => {
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
        cgstPercent: 0,
        sgstPercent: 0,
      },
    ]);
  };

  const handleRemoveItem = (id: any) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItemField = (id: any, field: string, val: any) => {
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
        senderCompany,
        senderAddress,
        senderPhone,
        senderEmail,
        senderGSTIN,
        quoteToName,
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
      });
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    const previewEl = document.getElementById("quotation-preview-container");
    if (!previewEl) return;

    const exportPDF = () => {
      const opt = {
        margin: 0,
        filename: `${quoteNumber || "Quotation"}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      };
      (window as any).html2pdf().from(previewEl).set(opt).save();
    };

    if (!(window as any).html2pdf) {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = exportPDF;
      document.head.appendChild(script);
    } else {
      exportPDF();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] w-full max-h-[92vh] overflow-y-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0 overflow-x-hidden">
        <DialogHeader className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Quotation Creator & Editor
          </DialogTitle>
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadPDF}
              variant="default"
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <Download className="w-4 h-4" /> Download Accurate PDF
            </Button>
            {onSubmitQuotation && (
              <Button onClick={handleSaveQuotation} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {saving ? "Saving..." : "Save Quotation"}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left Panel: Form Section */}
          <div className="lg:col-span-6 p-4 border-r border-slate-200 dark:border-slate-800 max-h-[calc(92vh-100px)] overflow-y-auto space-y-5 bg-white dark:bg-slate-900/40">
            {/* QUOTATION DETAILS */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm border-b pb-1">
                Quotation Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Quote Number</Label>
                  <Input
                    className="h-8 text-xs"
                    value={quoteNumber}
                    onChange={(e) => setQuoteNumber(e.target.value)}
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
                  <Label className="text-xs">Valid Until</Label>
                  <Input
                    className="h-8 text-xs"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
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
                  <Label className="text-xs">Sender Email</Label>
                  <Input
                    className="h-8 text-xs"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
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

            {/* QUOTE TO DETAILS */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm border-b pb-1">
                Quote To Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Quote To Name</Label>
                  <Input
                    className="h-8 text-xs"
                    value={quoteToName}
                    onChange={(e) => setQuoteToName(e.target.value)}
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Quote To Address</Label>
                  <Input
                    className="h-8 text-xs"
                    value={quoteToAddress}
                    onChange={(e) => setQuoteToAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Quote To Phone</Label>
                  <Input
                    className="h-8 text-xs"
                    value={quoteToPhone}
                    onChange={(e) => setQuoteToPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Quote To GSTIN</Label>
                  <Input
                    className="h-8 text-xs"
                    value={quoteToGSTIN}
                    onChange={(e) => setQuoteToGSTIN(e.target.value)}
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
                  <Label className="text-xs">Ship To Name</Label>
                  <Input
                    className="h-8 text-xs"
                    value={shipToName}
                    onChange={(e) => setShipToName(e.target.value)}
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Ship To Address</Label>
                  <Input
                    className="h-8 text-xs"
                    value={shipToAddress}
                    onChange={(e) => setShipToAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Ship To Phone</Label>
                  <Input
                    className="h-8 text-xs"
                    value={shipToPhone}
                    onChange={(e) => setShipToPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* TERMS & CONDITIONS */}
            <div className="space-y-1">
              <Label className="text-xs">Terms & Conditions</Label>
              <textarea
                rows={2}
                className="w-full text-xs p-1.5 border rounded-md dark:bg-slate-900 border-slate-200"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
              />
            </div>

            {/* ITEMS SECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-1">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                  Quotation Items
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
                        <Label className="text-[10px]">Price (INR)</Label>
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
          </div>

          {/* Right Panel: Beautiful Accurate Quotation Preview */}
          <div className="lg:col-span-6 p-4 max-h-[calc(92vh-100px)] overflow-auto bg-slate-200 dark:bg-slate-800/20 flex justify-center items-start">
            <div
              id="quotation-preview-container"
              className="bg-white text-black p-8 shadow-xl text-[12px] leading-relaxed relative flex flex-col justify-between select-none pointer-events-none"
              style={{
                fontFamily: "system-ui, -apple-system, Arial, sans-serif",
                color: "#1a1a1a",
                boxSizing: "border-box",
                width: "794px",
                height: "1123px",
              }}
            >
              <div>
                {/* 1. Header with Logo and Title */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <img
                      src={renderlogo}
                      alt="Logo"
                      className="h-10 w-auto object-contain"
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
                    <h1 className="text-lg font-bold text-slate-800 leading-none mb-1">
                      QUOTE
                    </h1>
                    <p className="text-sm font-extrabold text-indigo-900 leading-tight">
                      {quoteNumber}
                    </p>
                  </div>
                </div>

                {/* 2. Addresses and dates section */}
                <div className="grid grid-cols-12 gap-4 mb-4">
                  {/* Sender Details */}
                  <div className="col-span-6 text-[9.5px] leading-[14px] text-slate-800">
                    <p className="font-extrabold text-[12px] text-indigo-950 mb-1">
                      {senderCompany}
                    </p>
                    <p className="text-slate-600 mb-1 whitespace-pre-line leading-relaxed">
                      {senderAddress}
                    </p>
                    <p><span className="font-bold">Phone:</span> {senderPhone}</p>
                    <p><span className="font-bold">Email:</span> {senderEmail}</p>
                    <p className="font-bold text-indigo-950">GSTIN: {senderGSTIN}</p>
                    <p><span className="font-bold">Website:</span> {senderWebsite}</p>
                  </div>

                  {/* Date details and Place of supply */}
                  <div className="col-span-6 flex flex-col justify-start items-end text-[10px] leading-normal text-slate-800">
                    <div className="space-y-1 text-right">
                      <p>
                        <span className="font-bold text-slate-600">Issue Date:</span>{" "}
                        {issueDate}
                      </p>
                      <p>
                        <span className="font-bold text-slate-600">Valid Until:</span>{" "}
                        {validUntil}
                      </p>
                      <p>
                        <span className="font-bold text-slate-600">Place of Supply:</span>{" "}
                        {placeOfSupply}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Quote To & Ship To Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4 border-t border-b py-3 border-slate-200">
                  <div>
                    <h4 className="font-extrabold text-[11px] text-indigo-900 mb-1 tracking-wide uppercase">
                      Quote To
                    </h4>
                    <p className="font-black text-slate-800 text-[11px]">{quoteToName}</p>
                    {quoteToPhone && <p className="text-[10px] text-slate-600 mt-0.5">{quoteToPhone}</p>}
                    <p className="text-[10.5px] text-slate-600 leading-[14px] mt-0.5">
                      {quoteToAddress}
                    </p>
                    {quoteToGSTIN && (
                      <p className="font-bold text-[10px] text-indigo-950 mt-1">
                        GSTIN: {quoteToGSTIN}
                      </p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[11px] text-indigo-900 mb-1 tracking-wide uppercase">
                      Ship To
                    </h4>
                    {shipToName && <p className="font-black text-slate-800 text-[11px]">{shipToName}</p>}
                    {shipToPhone && <p className="text-[10px] text-slate-600 mt-0.5">{shipToPhone}</p>}
                    <p className="text-[10.5px] text-slate-600 leading-[14px] mt-0.5">
                      {shipToAddress}
                    </p>
                  </div>
                </div>

                {/* 4. Table */}
                <div className="mb-4 overflow-hidden border border-slate-300 rounded-sm">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-[#e46a25] text-white">
                        <th className="p-1.5 font-bold text-center border-r border-slate-300 w-8">
                          S.No
                        </th>
                        <th className="p-1.5 font-bold border-r border-slate-300">
                          Item Description
                        </th>
                        <th className="p-1.5 font-bold border-r border-slate-300 text-center w-16">
                          HSN/SAC
                        </th>
                        <th className="p-1.5 font-bold border-r border-slate-300 text-right w-16">
                          Qty UoM
                        </th>
                        <th className="p-1.5 font-bold border-r border-slate-300 text-right w-18">
                          Price (INR)
                        </th>
                        <th className="p-1.5 font-bold border-r border-slate-300 text-right w-20">
                          Taxable (INR)
                        </th>
                        <th className="p-1.5 font-bold border-r border-slate-300 text-right w-16">
                          CGST (INR)
                        </th>
                        <th className="p-1.5 font-bold border-r border-slate-300 text-right w-16">
                          SGST (INR)
                        </th>
                        <th className="p-1.5 font-bold text-right w-20">
                          Amount (INR)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {calculatedItems.map((item, i) => (
                        <tr key={item.id} className="text-slate-800 bg-white">
                          <td className="p-1.5 border-r border-slate-200 text-center">
                            {i + 1}
                          </td>
                          <td className="p-1.5 border-r border-slate-200 whitespace-pre-line leading-relaxed">
                            {item.description}
                          </td>
                          <td className="p-1.5 border-r border-slate-200 text-center">
                            {item.hsn || "-"}
                          </td>
                          <td className="p-1.5 border-r border-slate-200 text-right">
                            {item.qty} {item.uom && <span>{item.uom}</span>}
                          </td>
                          <td className="p-1.5 border-r border-slate-200 text-right">
                            {Number(item.price).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-1.5 border-r border-slate-200 text-right">
                            {Number(item.taxableValue).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-1.5 border-r border-slate-200 text-right">
                            {Number(item.cgstAmount).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            {item.cgstPercent > 0 && (
                              <div className="text-[8.5px] font-medium text-slate-500">
                                {item.cgstPercent}%
                              </div>
                            )}
                          </td>
                          <td className="p-1.5 border-r border-slate-200 text-right">
                            {Number(item.sgstAmount).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            {item.sgstPercent > 0 && (
                              <div className="text-[8.5px] font-medium text-slate-500">
                                {item.sgstPercent}%
                              </div>
                            )}
                          </td>
                          <td className="p-1.5 text-right font-bold text-slate-900">
                            {Number(item.totalAmount).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))}
                      {/* Summary Row inside the table footer */}
                      <tr className="bg-slate-50/60 font-extrabold text-slate-800">
                        <td colSpan={5} className="p-1.5 border-r border-slate-300 text-right">
                          Total @0%
                        </td>
                        <td className="p-1.5 border-r border-slate-300 text-right">
                          {totalTaxableValue.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="p-1.5 border-r border-slate-300 text-right">
                          {totalCGST.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="p-1.5 border-r border-slate-300 text-right">
                          {totalSGST.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="p-1.5 text-right font-black">
                          {overallTotal.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 5. Subtotals Section */}
                <div className="flex justify-end mb-4">
                  <div className="w-64 space-y-1.5 text-right text-[11px] font-medium">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-slate-600 font-bold">Total Taxable Value</span>
                      <span className="font-extrabold text-slate-900">
                        INR {totalTaxableValue.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-slate-600 font-bold">Total Value (in figure)</span>
                      <span className="font-extrabold text-indigo-900">
                        INR {overallTotal.toLocaleString("en-IN", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Section */}
              <div className="border-t border-slate-200 pt-3">
                <div className="grid grid-cols-2 gap-4 items-end">
                  <div>
                    {terms && (
                      <div>
                        <h4 className="font-extrabold text-[11px] text-indigo-900 mb-0.5 uppercase tracking-wide">
                          Terms & Conditions
                        </h4>
                        <p className="text-[10px] text-slate-600 leading-relaxed italic">
                          {terms}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end justify-end">
                    <div className="w-40 text-center">
                      <div className="text-[10px] text-indigo-900 font-extrabold tracking-wide select-none pointer-events-none mb-1">
                        For RENDERWAYS TECHNOLOGY
                      </div>
                      <div className="border-b border-slate-300 h-11"></div>
                      <div className="text-[10.5px] font-black text-slate-700 tracking-wide mt-1">
                        Provider Signature
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
