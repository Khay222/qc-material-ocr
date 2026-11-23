import type { Config, Context } from "@netlify/functions";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { eq } from "drizzle-orm";

// Simple fast SHA-256 hash using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", enc.encode(password));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default async (req: Request, _context: Context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  try {
    if (req.method === "POST") {
      const body = await req.json();
      const { action, name, email, password, role } = body;

      // Demo login
      if (action === "demo") {
        return Response.json({
          success: true,
          user: {
            id: 999,
            name: "Hans Mueller",
            email: "hans.mueller@dhl-logistics.com",
            role: "Senior QA Inspector",
          },
          token: "demo-dhl-token-" + Date.now(),
        });
      }

      // Registration
      if (action === "register") {
        if (!name || !email || !password) {
          return Response.json({ error: "Name, email, and password are required" }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existing = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
        if (existing.length > 0) {
          return Response.json({ error: "An account with this email already exists" }, { status: 409 });
        }

        const passwordHash = await hashPassword(password);
        const [newUser] = await db
          .insert(users)
          .values({
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
            role: role || "Warehouse Operator",
          })
          .returning({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
          });

        return Response.json({
          success: true,
          user: newUser,
          token: "auth-" + newUser.id + "-" + Date.now(),
        }, { status: 201 });
      }

      // Login
      if (action === "login") {
        if (!email || !password) {
          return Response.json({ error: "Email and password are required" }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const passwordHash = await hashPassword(password);

        const found = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
        if (found.length === 0 || found[0].passwordHash !== passwordHash) {
          return Response.json({ error: "Invalid email or password" }, { status: 401 });
        }

        const user = found[0];
        return Response.json({
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token: "auth-" + user.id + "-" + Date.now(),
        });
      }

      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    return Response.json({ status: "Auth service ready" });
  } catch (error: unknown) {
    console.error("Auth API Error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return Response.json({ error: msg }, { status: 500 });
  }
};

export const config: Config = {
  path: "/api/auth",
};
