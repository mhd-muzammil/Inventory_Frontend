import { useRef } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Ticket } from "@/types";

interface PrintTemplateProps {
  ticket: Ticket;
}

/* ── Region → CSO prefix mapping ───────────────────────────── */
const REGION_CSO_PREFIX: Record<string, string> = {
  vellore: "RT-VLR",
  salem: "RT-SAL",
  chennai: "RT-CHN",
  kanchipuram: "RT-KPM",
  hosur: "RT-HSR",
};

/* ── Region → branch address ───────────────────────────────── */
const REGION_ADDRESS: Record<string, { lines: string[]; phone: string; cell: string; gst: string }> = {
  salem: {
    lines: ["22/26, LIC Colony, Hotel Vasantham Road,", "OPP. New Bus Stand, SALEM - 636004"],
    phone: "+91 427-4057671",
    cell: "+91 8122633004",
    gst: "33AALCR1788A1ZG",
  },
  vellore: {
    lines: ["No.1, Gandhi Nagar, 2nd Street,", "Vellore - 632001"],
    phone: "+91 416-2243456",
    cell: "+91 8122633004",
    gst: "33AALCR1788A1ZG",
  },
  chennai: {
    lines: ["No.5, Anna Salai,", "Chennai - 600002"],
    phone: "+91 44-28523456",
    cell: "+91 8122633004",
    gst: "33AALCR1788A1ZG",
  },
  kanchipuram: {
    lines: ["No.10, Gandhi Road,", "Kanchipuram - 631501"],
    phone: "+91 44-27223456",
    cell: "+91 8122633004",
    gst: "33AALCR1788A1ZG",
  },
  hosur: {
    lines: ["No.3, Industrial Area,", "Hosur - 635109"],
    phone: "+91 4344-223456",
    cell: "+91 8122633004",
    gst: "33AALCR1788A1ZG",
  },
};

const DEFAULT_ADDRESS = REGION_ADDRESS.salem;

/* ── Service type keys ─────────────────────────────────────── */
const SERVICE_TYPES = [
  { key: "warranty", label: "Warranty" },
  { key: "non_warranty", label: "Non Warranty" },
  { key: "doc", label: "DOC" },
  { key: "amc", label: "AMC" },
  { key: "rental", label: "Rental" },
] as const;

/* ── Call status options ───────────────────────────────────── */
const CALL_STATUSES = ["Pending", "Closed", "Taken for Service"] as const;

/* ── Helper: table cell ────────────────────────────────────── */
function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <td className={`border border-black px-2 py-1.5 text-xs ${className}`}>
      {children ?? <span>&nbsp;</span>}
    </td>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`border border-black px-2 py-1.5 text-xs font-bold text-left bg-gray-50 ${className}`}>
      {children}
    </th>
  );
}

/* ================================================================
   PRINT TEMPLATE
   ================================================================ */
export function PrintTemplate({ ticket }: PrintTemplateProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=800,height=1100");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CSO - ${ticket.ticket_number}</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            color: #000;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          td, th {
            border: 1px solid #000;
            padding: 4px 6px;
            font-size: 11px;
            vertical-align: top;
          }
          th {
            font-weight: bold;
            background-color: #f3f4f6 !important;
          }
          .container {
            width: 100%;
            max-width: 190mm;
            margin: 0 auto;
            border: 2px solid #000;
          }
          .header {
            text-align: center;
            padding: 8px 12px;
            border-bottom: 2px solid #000;
            position: relative;
          }
          .header-gst {
            position: absolute;
            left: 12px;
            top: 8px;
            font-size: 10px;
            font-weight: bold;
          }
          .header-cso {
            position: absolute;
            right: 12px;
            top: 8px;
            font-size: 10px;
            font-weight: bold;
          }
          .header-badge {
            display: inline-block;
            background: #1e40af;
            color: white;
            padding: 2px 12px;
            font-size: 11px;
            font-weight: bold;
            border-radius: 2px;
            margin-bottom: 4px;
          }
          .company-name {
            font-size: 16px;
            font-weight: 900;
            color: #dc2626;
            letter-spacing: 1px;
            margin: 2px 0;
          }
          .company-address {
            font-size: 9px;
            font-weight: bold;
            color: #1e3a5f;
          }
          .section-label {
            font-weight: bold;
            font-size: 11px;
            background-color: #f3f4f6 !important;
            padding: 4px 6px;
            border: 1px solid #000;
          }
          .checkbox {
            display: inline-block;
            width: 12px;
            height: 12px;
            border: 1.5px solid #000;
            margin-right: 3px;
            vertical-align: middle;
            position: relative;
          }
          .checkbox.checked::after {
            content: "\\2713";
            position: absolute;
            top: -3px;
            left: 1px;
            font-size: 12px;
            font-weight: bold;
            color: #1e40af;
          }
          .service-type-row {
            padding: 6px 12px;
            border-bottom: 1px solid #000;
            font-size: 11px;
          }
          .service-type-row label {
            margin-right: 16px;
            white-space: nowrap;
          }
          .description-box {
            min-height: 50px;
            padding: 6px;
            border: 1px solid #000;
            font-size: 11px;
          }
          .sig-section {
            display: flex;
            justify-content: space-between;
            padding: 8px 12px;
            min-height: 60px;
            border-top: 1px solid #000;
          }
          .sig-box {
            width: 45%;
          }
          .sig-label {
            font-size: 10px;
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 4px;
            margin-top: 30px;
          }
          .footer-stripe {
            height: 14px;
            background: repeating-linear-gradient(
              -45deg,
              #dc2626,
              #dc2626 8px,
              #fff 8px,
              #fff 16px
            ) !important;
            border-top: 1px solid #000;
          }
          .footer-note {
            font-size: 8px;
            padding: 4px 8px;
            border-top: 1px solid #000;
            color: #333;
          }
          .footer-web {
            font-size: 9px;
            padding: 3px 8px;
            font-weight: bold;
            border-top: 1px solid #000;
          }
          .val { font-weight: normal; }
          .empty-cell { min-height: 18px; }
          @media print {
            body { margin: 0; }
            .container { border-width: 2px; }
          }
        </style>
      </head>
      <body>
        ${content.innerHTML}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); };
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const addr = REGION_ADDRESS[ticket.region] || DEFAULT_ADDRESS;
  const csoPrefix = REGION_CSO_PREFIX[ticket.region] || "RT";
  const currentStatus = ticket.current_status;
  const callStatus = currentStatus === "closed" ? "Closed" : "Pending";

  return (
    <>
      {/* ── Print Button ───────────────────────────────── */}
      <Button onClick={handlePrint} variant="outline" className="gap-2">
        <Printer className="w-4 h-4" /> Print CSO
      </Button>

      {/* ── Hidden print-only content ──────────────────── */}
      <div className="hidden">
        <div ref={printRef}>
          <div className="container">
            {/* ── HEADER ─────────────────────────────── */}
            <div className="header">
              <div className="header-gst">GST # {addr.gst}</div>
              <div className="header-cso">CSO No. : {ticket.form_number || `${csoPrefix}-${ticket.ticket_number.replace("TKT-", "")}`}</div>
              <span className="header-badge">HP Care</span>
              <div className="company-name">RENDERWAYS TECHNOLOGY PVT LTD</div>
              <div className="company-address">
                {addr.lines.join(" ")}<br />
                Ph: {addr.phone}, Cell: {addr.cell}
              </div>
            </div>

            {/* ── CUSTOMER + PRODUCT INFO ─────────────── */}
            <table>
              <tbody>
                <tr>
                  <Th>Customer Name</Th>
                  <Td>{ticket.cust_name}</Td>
                  <Th>Service Type</Th>
                  <Td>{ticket.service_type_display}</Td>
                </tr>
                <tr>
                  <Th>Contact Number</Th>
                  <Td>{ticket.cust_contact}</Td>
                  <Th>Product Name</Th>
                  <Td>{ticket.product_name}</Td>
                </tr>
                <tr>
                  <Th rowSpan={5}>Customer Address</Th>
                  <Td rowSpan={5}>{ticket.cust_address}</Td>
                  <Th>Serial Number</Th>
                  <Td>{ticket.serial_number}</Td>
                </tr>
                <tr>
                  <Th>Case ID</Th>
                  <Td>{ticket.case_id}</Td>
                </tr>
                <tr>
                  <Th>Condition Received</Th>
                  <Td>{ticket.condition_received}</Td>
                </tr>
                <tr>
                  <Th>Arrival Date</Th>
                  <Td>{formatDate(ticket.arrival_date)}</Td>
                </tr>
                <tr>
                  <Th>Delivery Date</Th>
                  <Td>{formatDate(ticket.closed_at) || formatDate(ticket.target_completion)}</Td>
                </tr>
              </tbody>
            </table>

            {/* ── SERVICE TYPE CHECKBOXES ─────────────── */}
            <div className="service-type-row">
              <strong>Service Type : </strong>
              {SERVICE_TYPES.map(({ key, label }) => (
                <label key={key}>
                  <span className={`checkbox ${ticket.service_type === key ? "checked" : ""}`} />
                  {label}{"  "}
                </label>
              ))}
            </div>

            {/* ── ISSUE DESCRIPTION ──────────────────── */}
            <div className="section-label">Issue Description:</div>
            <div className="description-box">
              {ticket.issue_description}
            </div>

            {/* ── PART DETAILS TABLE ─────────────────── */}
            <table>
              <thead>
                <tr>
                  <Th>Part Details<br /><span style={{ fontWeight: "normal", fontSize: "9px" }}>Product/Part No.</span></Th>
                  <Th>Part Usage</Th>
                  <Th>Failure Code</Th>
                  <Th>Part Description</Th>
                  <Th>Qty</Th>
                  <Th>CT Code</Th>
                  <Th>So. No./<br />Req ID</Th>
                  <Th>Removed Part S.No.</Th>
                  <Th>Installed Part S.No.</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>{ticket.part_number}</Td>
                  <Td>{ticket.part_usage}</Td>
                  <Td>{ticket.failure_code}</Td>
                  <Td>{ticket.part_description}</Td>
                  <Td>{ticket.qty || ""}</Td>
                  <Td>{ticket.ct_code}</Td>
                  <Td>{ticket.so_req_id}</Td>
                  <Td>{ticket.removed_part_sno}</Td>
                  <Td>{ticket.installed_part_sno}</Td>
                </tr>
              </tbody>
            </table>

            {/* ── RESOLUTION SUMMARY ─────────────────── */}
            <div className="section-label">Resolution Summary :</div>
            <div className="description-box">
              {ticket.resolution_summary}
            </div>

            {/* ── ENGINEER / CALL STATUS / EXPLANATION ── */}
            <table>
              <thead>
                <tr>
                  <Th className="text-center">Engineer Details</Th>
                  <Th className="text-center">Call Status</Th>
                  <Th className="text-center">Explanation</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black px-2 py-1.5 text-xs" style={{ verticalAlign: "top" }}>
                    <div><strong>Engineer</strong></div>
                    <div>Name : {ticket.assigned_engineer?.name || ticket.engineer_name}</div>
                    <div>HP ID : {ticket.hp_id}</div>
                  </td>
                  <td className="border border-black px-2 py-1.5 text-xs" style={{ verticalAlign: "top" }}>
                    {CALL_STATUSES.map((s) => (
                      <div key={s}>
                        <span className={`checkbox ${callStatus === s ? "checked" : ""}`} />
                        {" "}{s}
                      </div>
                    ))}
                  </td>
                  <Td>{ticket.explanation}</Td>
                </tr>
              </tbody>
            </table>

            {/* ── CUSTOMER COMMENTS ──────────────────── */}
            <div className="section-label">Customer Comments :</div>
            <div className="description-box" style={{ minHeight: "35px" }}>
              {ticket.customer_comments}
            </div>

            {/* ── SIGNATURES ─────────────────────────── */}
            <div className="sig-section">
              <div className="sig-box">
                <div className="sig-label">
                  Customer Signature<br />
                  <span style={{ fontWeight: "normal", fontSize: "9px" }}>Received in Good Condition</span>
                </div>
              </div>
              <div className="sig-box" style={{ textAlign: "right" }}>
                <div className="sig-label">Engineer Signature</div>
              </div>
            </div>

            {/* ── FOOTER NOTE ────────────────────────── */}
            <div className="footer-note">
              Note : Hard Disk related issue and replacement may lead to loss of data. It is advisable for the customer to
              Backup the files &amp; Applications prior to repair Activity. Physical Damage not &amp; under Cover Warranty.
            </div>

            {/* ── STRIPE ─────────────────────────────── */}
            <div className="footer-stripe" />

            {/* ── WEB SUPPORT ────────────────────────── */}
            <div className="footer-web">
              Web Support : https://support.hp.com/in-en/
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
