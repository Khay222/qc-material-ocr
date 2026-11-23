import type { Config, Context } from "@netlify/functions";
import { db } from "../../db/index.js";
import { batches, scanItems } from "../../db/schema.js";
import { eq, sql } from "drizzle-orm";

export default async (req: Request, _context: Context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const { batchId, itemIndex, material1, material2, isMatch, errorReason } = body;

    if (!batchId || !material1 || !material2) {
      return Response.json({ error: "batchId, material1, and material2 are required" }, { status: 400 });
    }

    const batchIdNum = parseInt(batchId, 10);
    const itemIndexNum = parseInt(itemIndex, 10) || 1;

    // Insert the scan audit item
    const [insertedScan] = await db
      .insert(scanItems)
      .values({
        batchId: batchIdNum,
        itemIndex: itemIndexNum,
        material1: material1.trim(),
        material2: material2.trim(),
        isMatch: Boolean(isMatch),
        errorReason: errorReason || null,
      })
      .returning();

    // Update batch counter
    let updatedBatch = null;
    if (isMatch) {
      // Fetch targetQty to check if completed
      const [currentBatch] = await db.select().from(batches).where(eq(batches.id, batchIdNum)).limit(1);
      const nextCompleted = (currentBatch?.completedQty || 0) + 1;
      const isCompleted = currentBatch ? nextCompleted >= currentBatch.targetQty : false;

      const [batchResult] = await db
        .update(batches)
        .set({
          completedQty: sql`${batches.completedQty} + 1`,
          status: isCompleted ? "completed" : batches.status,
          completedAt: isCompleted ? new Date() : batches.completedAt,
        })
        .where(eq(batches.id, batchIdNum))
        .returning();
      updatedBatch = batchResult;
    } else {
      const [batchResult] = await db
        .update(batches)
        .set({
          mismatchCount: sql`${batches.mismatchCount} + 1`,
        })
        .where(eq(batches.id, batchIdNum))
        .returning();
      updatedBatch = batchResult;
    }

    return Response.json({
      success: true,
      scan: insertedScan,
      batch: updatedBatch,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("Scans API Error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return Response.json({ error: msg }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/scans",
};
