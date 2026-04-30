import { useRef } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import borderImg from "@/assets/border.png";
import { formatDate } from "@/lib/utils";
import hpLogo from "@/assets/hplogo.png";
import renderFullLogo from "@/assets/renderfulllogo.png";
import renderLogo from "@/assets/renderlogo.png";
import type { Ticket } from "@/types";

interface PrintTemplateProps {
  ticket: Ticket;
}

const REGION_CSO_PREFIX: Record<string, string> = {
  vellore: "RT-VLR",
  salem: "RT-SAL",
  chennai: "RT-CHN",
  kanchipuram: "RT-KPM",
  hosur: "RT-HSR",
};

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

const SERVICE_TYPES = [
  { key: "warranty", label: "Warranty" },
  { key: "non_warranty", label: "Non Warranty" },
  { key: "doa", label: "DOA" },
  { key: "amc", label: "AMC" },
  { key: "rental", label: "Rental" },
  { key: "trade", label: "Trade" },
] as const;

const CALL_STATUSES = ["Pending", "Closed", "Taken for Service"] as const;

function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`cso-td ${className}`}>{children ?? <span>&nbsp;</span>}</td>;
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`cso-th ${className}`}>{children}</th>;
}

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
          * { box-sizing: border-box; }
     body {
        font-family: Arial, sans-serif;
        padding: 20px;
        background-color: #f4f4f4;
        display: flex;
        justify-content: center;
    }
    .form-container {
        width: 100%;
        max-width: 900px;
        background-color: #fff;
        border: 2px solid #272365;
        border-radius: 12px 12px 0 0;
        overflow: hidden;
    }
    .blue-text { color: #2e3192; font-weight: bold; }
    .pink-text { color: #ec1c74; font-weight: bold; }
    .bold { font-weight: bold; }
    .text-center { text-align: center; }
    .text-small { font-size: 11px; }
    
    /* Header Styles */
    .top-bar {
        display: flex;
        justify-content: space-between;
        padding: 10px 15px 5px;
        font-size: 12px;
        font-weight: bold;
    }
    .hp-care-badge {
        background-color: #2e3192;
        color: white;
        padding: 2px 10px;
        font-style: italic;
    }
    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        border-bottom: 2px solid #272365;
    }
    .company-info {
        text-align: center;
        flex-grow: 1;
        padding: 0 15px;
    }
    /* Removed .company-name class as we are using an image now */
    .company-address {
        font-size: 12px;
        font-weight: bold;
        margin-top: 5px;
    }

    /* Table Styles */
    table {
        width: 100%;
        border-collapse: collapse;
    }
    th, td {
        border: 1px solid #2e3192;
        padding: 6px 10px;
        font-size: 13px;
    }
    
    .section-box {
        border-bottom: 2px solid #272365;
        padding: 8px 10px;
        font-size: 13px;
    }
    .min-height-box { min-height: 70px; }
    .min-height-large { min-height: 90px; }

    .checkbox-group {
        display: flex;
        gap: 15px;
        align-items: center;
        justify-content: center;
    }
    .checkbox-group label {
        display: flex;
        align-items: center;
        gap: 4px;
        font-weight: bold;
    }

    /* Specific Tables */
    .part-table th {
        font-size: 11px;
        text-align: center;
        vertical-align: bottom;
    }
    .part-table td { height: 35px; }

    .engineer-status {
        display: flex;
        flex-direction: column;
        gap: 5px;
        font-weight: bold;
    }

    /* --- Footer Specific Styles --- */
    .signatures {
        display: flex;
        justify-content: space-between;
        padding: 40px 15px 10px;
        font-weight: bold;
        font-size: 14px;
        border-top: 1px solid #2e3192;
        border-bottom: 1px solid #2e3192;
    }

    .note-section {
        font-size: 12px;
        padding: 8px 10px;
        color: #333;
    }

    .footer-border-img {
        width: 100%; 
        height: 18.5px; 
        object-fit: cover; 
        object-position: top; 
        display: block; 
    }
    .web-support {
        font-family: 'Times New Roman', Times, serif; 
        font-weight: bold;
        font-size: 16px;
        padding: 5px 0;
        margin-top: 5px;
        color: #000;
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
  const callStatus = currentStatus === "closed"
    ? "Closed"
    : ["assigned", "diagnosis", "part_requested", "part_approved", "quotation_sent", "part_ordered", "part_received", "in_progress", "ready_for_delivery", "under_observation"].includes(currentStatus)
    ? "Taken for Service"
    : "Pending";

  return (
    <>
      <Button onClick={handlePrint} variant="outline" className="gap-2">
        <Printer className="w-4 h-4" /> Print CSO
      </Button>

      <div className="hidden">
        <div ref={printRef}>
          <div>
            <div className="form-container">
              <div className="top-bar">
                <span className="blue-text">GST # {addr.gst}</span>
                <span className="hp-care-badge">HP Care</span>
                <span className="blue-text">CSO No. : {ticket.form_number || `${csoPrefix}-${ticket.ticket_number.replace("TKT-", "")}`}</span>
              </div>

              <div className="header-content">
                <div style={{ width: "80px", display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden="true">
                  <img src={renderLogo} alt="Renderways Logo" style={{ width: "100%", height: "auto" }} />
                </div>
                <div className="company-info">
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <img src={renderFullLogo} alt="Renderways Technology Pvt Ltd" style={{ maxWidth: "350px", height: "auto" }} />
                  </div>
                  <div className="company-address">
                    {addr.lines.map((line, index) => (
                      <span key={index}>
                        {line}
                        <br />
                      </span>
                    ))}
                    Ph: {addr.phone}, Cell: {addr.cell}
                  </div>
                </div>
                <div style={{ width: "60px", display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden="true">
                  <img src={hpLogo} alt="HP Logo" style={{ width: "100%", height: "auto" }} />
                </div>
              </div>

              <table className="details-table" style={{ borderTop: "none", borderLeft: "none", borderRight: "none" }}>
                <tbody>
                  <tr>
                    <Td className="blue-text" style={{ width: "20%", borderLeft: "none" }}>Customer Name</Td>
                    <Td style={{ width: "30%" }}>{ticket.cust_name}</Td>
                    <Td className="bold" style={{ width: "20%" }}>Service Type</Td>
                    <Td style={{ width: "30%", borderRight: "none" }}>{ticket.service_type_display}</Td>
                  </tr>
                  <tr>
                    <Td className="blue-text" style={{ borderLeft: "none" }}>Contact Number</Td>
                    <Td>{ticket.cust_contact}</Td>
                    <Td className="bold">Product Name</Td>
                    <Td style={{ borderRight: "none" }}>{ticket.product_name}</Td>
                  </tr>
                  <tr>
                    <Td rowSpan={5} className="bold text-center " style={{ borderLeft: "none", padding: "12px 10px" }}>Customer<br />Address</Td>
                    <Td rowSpan={5} >{ticket.cust_address}</Td>
                    <Td className="bold">Serial Number</Td>
                    <Td style={{ borderRight: "none" }}>{ticket.serial_number}</Td>
                  </tr>
                  <tr>
                    <Td className="bold">Case ID</Td>
                    <Td style={{ borderRight: "none" }}>{ticket.case_id || ""}</Td>
                  </tr>
                  <tr>
                    <Td className="bold">Condition Received</Td>
                    <Td style={{ borderRight: "none" }}>{ticket.condition_received}</Td>
                  </tr>
                  <tr>
                    <Td className="bold">Arrival Date</Td>
                    <Td style={{ borderRight: "none" }}>{formatDate(ticket.arrival_date)}</Td>
                  </tr>
                  <tr>
                    <Td className="bold">Delivery Date</Td>
                    <Td style={{ borderRight: "none" }}>{formatDate(ticket.closed_at) || formatDate(ticket.target_completion)}</Td>
                  </tr>
                  <tr>
                    <Td colSpan={4} style={{ borderLeft: "none", borderRight: "none" }}>
                      <div style={{ display: "flex" }}>
                        <span className="bold" style={{ width: "30%" }}>Service Type :</span>
                        <div className="checkbox-group" style={{ width: "70%" }}>
                          {SERVICE_TYPES.map(({ key, label }) => (
                            <label key={key}>
                              {label}
                              <span className={`checkbox ${ticket.service_type === key ? "checked" : ""}`} />
                            </label>
                          ))}
                        </div>
                      </div>
                    </Td>
                  </tr>
                </tbody>
              </table>

              <div className="section-box min-height-large">
                <span className="bold">Issue Description:</span>
                <br />
                {ticket.issue_description}
              </div>

              <table className="part-table" style={{ borderLeft: "none", borderRight: "none" }}>
                <thead>
                  <tr>
                    <Th style={{ borderLeft: "none", width: "15%" }}>Part Details<br />Product/Part No.</Th>
                    <Th>Part<br />Usage</Th>
                    <Th>Failure<br />Code</Th>
                    <Th style={{ width: "20%" }}>Part Description</Th>
                    <Th>Qty</Th>
                    <Th>CT<br />Code</Th>
                    <Th>So. No./<br />Req ID</Th>
                    <Th>Removed<br />Part S.No.</Th>
                    <Th style={{ borderRight: "none" }}>Installed<br />Part S.No.</Th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <Td style={{ borderLeft: "none" }}>{ticket.part_number}</Td>
                    <Td>{ticket.part_usage}</Td>
                    <Td>{ticket.failure_code}</Td>
                    <Td>{ticket.part_description}</Td>
                    <Td>{ticket.qty ?? ""}</Td>
                    <Td>{ticket.ct_code}</Td>
                    <Td>{ticket.so_req_id}</Td>
                    <Td>{ticket.removed_part_sno}</Td>
                    <Td style={{ borderRight: "none" }}>{ticket.installed_part_sno}</Td>
                  </tr>
                </tbody>
              </table>

              <table style={{ borderLeft: "none", borderRight: "none", borderBottom: "none" }}>
                <tbody>
                  <tr>
                    <Th colSpan={2} className="text-center" style={{ borderLeft: "none", borderTop: "none", width: "35%" }}>Engineer Details</Th>
                    <Th className="text-center" style={{ borderTop: "none", width: "30%" }}>Call Status</Th>
                    <Th className="text-center" style={{ borderRight: "none", borderTop: "none", width: "35%" }}>Explanation</Th>
                  </tr>
                  <tr>
                    <Td className="bold" style={{ borderLeft: "none", width: "10%", borderBottom: "none" }}>Engineer</Td>
                    <Td rowSpan={3} style={{ width: "25%", borderBottom: "none" }}>
                      <div>Name : {ticket.assigned_engineer?.name || ticket.engineer_name}</div>
                      <div>HP ID : {ticket.hp_id}</div>
                    </Td>
                    <Td rowSpan={3} style={{ borderBottom: "none" }}>
                      <div className="engineer-status">
                        {CALL_STATUSES.map((s) => (
                          <span key={s}>
                            <span className={`checkbox ${callStatus === s ? "checked" : ""}`} /> {s}
                          </span>
                        ))}
                      </div>
                    </Td>
                    <Td rowSpan={3} style={{ borderRight: "none", borderBottom: "none" }}>{ticket.explanation}</Td>
                  </tr>
                  <tr>
                    <Td className="bold" style={{ borderLeft: "none", borderBottom: "none", borderTop: "none" }}>Name :</Td>
                  </tr>
                  <tr>
                    <Td className="bold" style={{ borderLeft: "none", borderTop: "none", borderBottom: "none" }}>HP ID</Td>
                  </tr>
                </tbody>
              </table>

              <div style={{ minHeight: "80px", padding: "10px", borderTop: "1px solid #2e3192" }}>
                <span className="bold">Customer Comments :</span>
                <br />
                {ticket.customer_comments}
              </div>

              <div className="signatures">
                <div>
                  Customer Signature<br />
                  Received in Good Condiotion
                </div>
                <div>Engineer Signature</div>
              </div>

              <div className="note-section">
                Note : Hard Disk related issue and replacemant may lead to loss of data. It is advisable for the customer to<br />
                Backup the files &amp; Applications prior to repair Activity. Physical Damage not &amp; under Cover Warranty.
              </div>

              <img src={borderImg} alt="Form Bottom Border" className="footer-border-img" />
            </div>

            <div className="web-support">
              Web Support : https://support.hp.com/in-en/
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
