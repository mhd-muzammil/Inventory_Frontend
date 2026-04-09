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
import Buffer from "@/pages/Buffer";
import PurchaseOrder from "@/pages/PurchaseOrder";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import UserManagement from "@/pages/UserManagement";
import EngineerManagement from "@/pages/EngineerManagement";
import TicketDetail from "@/pages/TicketDetail";

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
          <Route path="/part-request" element={<PartRequest />} />
          <Route path="/invoice" element={<Invoice />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/buffer" element={<Buffer />} />
          <Route path="/purchase-order" element={<PurchaseOrder />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/engineers" element={<EngineerManagement />} />
          <Route path="/users" element={<UserManagement />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}
