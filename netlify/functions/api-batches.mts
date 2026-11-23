import type { Config, Context } from "@netlify/functions";
import { db } from "../../db/index.js";
import { batches, scanItems } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";

export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const url = new URL(req.url);
  const pathId = context.params?.id || url.searchParams.get("id");

  try {
    // GET /api/batches or /api/batches/:id
    if (req.method === "GET") {
      if (pathId) {
        const batchIdNum = parseInt(pathId, 10);
        if (isNaN(batchIdNum)) {
          return Response.json({ error: "Invalid batch ID" }, { status: 400 });
        }

        const [batch] = await db.select().from(batches).where(eq(batches.id, batchIdNum)).limit(1);
        if (!batch) {
          return Response.json({ error: "Batch not found" }, { status: 404 });
        }

        const items = await db
          .select()
          .from(scanItems)
          .where(eq(scanItems.batchId, batchIdNum))
          .orderBy(scanItems.itemIndex);

        return Response.json({ batch, items });
      }

      // List all batches
      const allBatches = await db
        .select()
        .from(batches)
        .orderBy(desc(batches.createdAt))
        .limit(100);

      return Response.json({ batches: allBatches });
    }

    // POST /api/batches: Create new batch or finish batch
    if (req.method === "POST") {
      const body = await req.json();
      const { action, batchNumber, targetQty, operatorName, operatorEmail, notes, batchId, status } = body;

      // Update existing batch status (e.g. mark completed)
      if (action === "update_status" && batchId) {
        const idNum = parseInt(batchId, 10);
        const [updated] = await db
          .update(batches)
          .set({
            status: status || "completed",
            completedAt: status === "completed" ? new Date() : null,
          })
          .where(eq(batches.id, idNum))
          .returning();

        return Response.json({ batch: updated });
      }

      // Create new batch
      if (!batchNumber) {
        return Response.json({ error: "Batch number is required" }, { status: 400 });
      }

      const [newBatch] = await db
        .insert(batches)
        .values({
          batchNumber: batchNumber.trim(),
          targetQty: typeof targetQty === "number" ? targetQty : parseInt(targetQty, 10) || 50,
          completedQty: 0,
          mismatchCount: 0,
          status: "in_progress",
          operatorName: operatorName?.trim() || "Warehouse Operator",
          operatorEmail: operatorEmail?.trim() || null,
          notes: notes?.trim() || null,
        })
        .returning();

      return Response.json({ batch: newBatch }, { status: 201 });
    }

    return new Response("Method Not Allowed", { status: 405 });
  } catch (error: unknown) {
    console.error("Batches API Error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return Response.json({ error: msg }, { status: 500 });
  }
};

export const config: Config = {
  path: ["/api/batches", "/api/batches/:id"],
};
