import type { Config, Context } from "@netlify/functions";
import { db } from "../../db/index.js";
import { batches, scanItems } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default async (req: Request, _context: Context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  try {
    const url = new URL(req.url);
    const batchIdParam = url.searchParams.get("batchId");

    let csvContent = "";
    let filename = `dhl_scan_report_${new Date().toISOString().slice(0, 10)}.csv`;

    if (batchIdParam) {
      const batchId = parseInt(batchIdParam, 10);
      const [batch] = await db.select().from(batches).where(eq(batches.id, batchId)).limit(1);
      const items = await db
        .select()
        .from(scanItems)
        .where(eq(scanItems.batchId, batchId))
        .orderBy(scanItems.itemIndex);

      filename = `dhl_batch_${batch?.batchNumber || batchId}_scans.csv`;

      // Header row
      const headers = [
        "Batch ID",
        "Batch Number",
        "Item #",
        "Material 1",
        "Material 2",
        "Validation Result",
        "Error Reason",
        "Timestamp",
        "Operator",
      ];
      csvContent += headers.map(escapeCSV).join(",") + "\r\n";

      for (const item of items) {
        const row = [
          item.batchId,
          batch?.batchNumber || "",
          item.itemIndex,
          item.material1,
          item.material2,
          item.isMatch ? "MATCHED" : "MISMATCH",
          item.errorReason || "",
          item.scannedAt ? new Date(item.scannedAt).toISOString() : "",
          batch?.operatorName || "",
        ];
        csvContent += row.map(escapeCSV).join(",") + "\r\n";
      }
    } else {
      // Export all batches summary
      const allBatches = await db
        .select()
        .from(batches)
        .orderBy(desc(batches.createdAt));

      const headers = [
        "Batch ID",
        "Batch Number",
        "Status",
        "Target Qty",
        "Completed Qty",
        "Mismatch Count",
        "Operator",
        "Created At",
        "Completed At",
        "Notes",
      ];
      csvContent += headers.map(escapeCSV).join(",") + "\r\n";

      for (const b of allBatches) {
        const row = [
          b.id,
          b.batchNumber,
          b.status.toUpperCase(),
          b.targetQty,
          b.completedQty,
          b.mismatchCount,
          b.operatorName,
          b.createdAt ? new Date(b.createdAt).toISOString() : "",
          b.completedAt ? new Date(b.completedAt).toISOString() : "",
          b.notes || "",
        ];
        csvContent += row.map(escapeCSV).join(",") + "\r\n";
      }
    }

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: unknown) {
    console.error("Export API Error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return Response.json({ error: msg }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/export-csv",
};
