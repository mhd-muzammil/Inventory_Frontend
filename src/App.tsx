import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/Dashboard";
import Materials from "@/pages/Materials";
import Customers from "@/pages/Customers";
import Quotation from "@/pages/Quotation";
import PartRequest from "@/pages/PartRequest";
import Invoice from "@/pages/Invoice";
import Stock from "@/pages/Stock";
import HPStock from "@/pages/HPStock";
import HPStockRMA from "@/pages/HPStockRMA";
import Buffer from "@/pages/Buffer";
import PurchaseOrder from "@/pages/PurchaseOrder";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import UserManagement from "@/pages/UserManagement";
import ManagerManagement from "@/pages/ManagerManagement";
import EngineerManagement from "@/pages/EngineerManagement";
import TicketDetail from "@/pages/TicketDetail";
import BufferStockManagement from "@/pages/BufferStockManagement";
import ActivityCharges from "@/pages/ActivityCharges";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/cso-entry" element={<Materials />} />
          <Route path="/tickets/:id" element={<TicketDetail />} />
          <Route path="/quotation" element={<Quotation />} />
          <Route path="/quotation/hp" element={<Quotation />} />
          <Route path="/quotation/rtpl" element={<Quotation />} />
          <Route path="/part-request" element={<PartRequest />} />
          <Route path="/invoice" element={<Invoice />} />
          <Route path="/invoice/bill-of-supply" element={<Invoice />} />
          <Route path="/invoice/tax-invoice" element={<Invoice />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/hp-stock" element={<HPStock />} />
          <Route path="/hp-stock-rma" element={<HPStockRMA />} />
          <Route path="/buffer" element={<Buffer />} />
          <Route path="/buffer-stock" element={<BufferStockManagement />} />
          <Route path="/purchase-order" element={<PurchaseOrder />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/activity-charges" element={<ActivityCharges />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/engineers" element={<EngineerManagement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/managers" element={<ManagerManagement />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}
