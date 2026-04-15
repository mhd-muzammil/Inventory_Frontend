import { useState } from "react";
import { motion } from "framer-motion";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import { BufferStockDashboard } from "@/components/buffer-stock/BufferStockDashboard";
import { RegionStockTable } from "@/components/buffer-stock/RegionStockTable";
import { BufferCaseTable } from "@/components/buffer-stock/BufferCaseTable";
import { TransferTable } from "@/components/buffer-stock/TransferTable";
import { ApprovalQueue } from "@/components/buffer-stock/ApprovalQueue";
import { ReplenishmentTable } from "@/components/buffer-stock/ReplenishmentTable";
import { AuditLogTable } from "@/components/buffer-stock/AuditLogTable";

export default function BufferStockManagement() {
  const [tab, setTab] = useState("dashboard");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Buffer Stock Management
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage OEM buffer stock, service cases, transfers, approvals, and replenishment.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="stock">Region Stock</TabsTrigger>
          <TabsTrigger value="cases">Cases</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="replenishment">Replenishment</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <BufferStockDashboard />
        </TabsContent>

        <TabsContent value="stock">
          <RegionStockTable />
        </TabsContent>

        <TabsContent value="cases">
          <BufferCaseTable />
        </TabsContent>

        <TabsContent value="transfers">
          <TransferTable />
        </TabsContent>

        <TabsContent value="approvals">
          <ApprovalQueue />
        </TabsContent>

        <TabsContent value="replenishment">
          <ReplenishmentTable />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogTable />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
