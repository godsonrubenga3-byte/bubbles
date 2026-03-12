import express from "express";
import cors from "cors";
import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";
import dotenv from "dotenv";

dotenv.config();

const tursoUrl = process.env.TURSO_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

let dbCache: ReturnType<typeof createClient> | null = null;

const getDb = (): ReturnType<typeof createClient> => {
  if (!dbCache) {
    if (!tursoUrl) {
      throw new Error("TURSO_URL not configured");
    }
    dbCache = createClient({
      url: tursoUrl,
      authToken: tursoAuthToken,
    });
  }
  return dbCache;
};

if (!tursoUrl) {
  console.warn("TURSO_URL missing - API will return service unavailable");
}

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// Auth Routes
app.post("/api/signup", async (req, res) => {
  try {
    const db = getDb();
    const { email, password, name, username, phone, is_whatsapp, lat, lng, location_name, address } = req.body;
    const id = randomUUID();
    await db.execute({
      sql: "INSERT INTO clients_details (id, email, password, name, username, phone, is_whatsapp, lat, lng, location_name, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [id, email, password, name, username, phone, is_whatsapp ? 1 : 0, lat, lng, location_name, address || ""],
    });
    res.status(201).json({ id, email, name, username, phone, is_whatsapp, lat, lng, location_name, address: address || "" });
  } catch (error: any) {
    console.error("Signup error:", error);
    if (error.message?.includes("TURSO_URL")) {
      res.status(503).json({ error: "Service temporarily unavailable" });
    } else {
      res.status(400).json({ error: "Email or username already exists" });
    }
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const db = getDb();
    const { email, password } = req.body;
    const result = await db.execute({
      sql: "SELECT * FROM clients_details WHERE email = ? AND password = ?",
      args: [email, password],
    });
    const user = result.rows[0] as any;
    if (user) {
      res.json({ 
        id: user.id, 
        email: user.email, 
        name: user.name,
        username: user.username,
        phone: user.phone,
        is_whatsapp: user.is_whatsapp === 1,
        lat: user.lat,
        lng: user.lng,
        location_name: user.location_name,
        address: user.address || ""
      });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error: any) {
    console.error("Login error:", error);
    if (error.message?.includes("TURSO_URL")) {
      res.status(503).json({ error: "Service temporarily unavailable" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// API Routes
app.post("/api/orders", async (req, res) => {
  try {
    const db = getDb();
    const { user_id, customer_name, phone, address, lat, lng, clothes_weight, blankets_count, total_price } = req.body;
    const id = randomUUID();
    await db.execute({
      sql: `
        INSERT INTO Order_details (id, user_id, customer_name, phone, address, lat, lng, clothes_weight, blankets_count, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [id, user_id, customer_name, phone, address, lat, lng, clothes_weight, blankets_count, total_price],
    });
    res.status(201).json({ success: true, id });
  } catch (error: any) {
    console.error("Orders create error:", error);
    if (error.message?.includes("TURSO_URL")) {
      res.status(503).json({ error: "Service temporarily unavailable" });
    } else {
      res.status(500).json({ error: "Failed to create order" });
    }
  }
});

app.get("/api/orders/user/:userId", async (req, res) => {
  try {
    const db = getDb();
    const { userId } = req.params;
    const result = await db.execute({
      sql: "SELECT * FROM Order_details WHERE user_id = ? ORDER BY created_at DESC",
      args: [userId],
    });
    res.json(result.rows);
  } catch (error: any) {
    console.error("Orders list error:", error);
    if (error.message?.includes("TURSO_URL")) {
      res.status(503).json({ error: "Service temporarily unavailable" });
    } else {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  }
});

app.get("/api/orders/:id", async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const result = await db.execute({
      sql: "SELECT * FROM Order_details WHERE id = ?",
      args: [id],
    });
    const order = result.rows[0];
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  } catch (error: any) {
    console.error("Order get error:", error);
    if (error.message?.includes("TURSO_URL")) {
      res.status(503).json({ error: "Service temporarily unavailable" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

app.post("/api/orders/:id/cancel", async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const result = await db.execute({
      sql: "SELECT status FROM Order_details WHERE id = ?",
      args: [id],
    });
    const order = result.rows[0];
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status !== 'Pending') return res.status(400).json({ error: "Only pending orders can be cancelled" });

    await db.execute({
      sql: "UPDATE Order_details SET status = 'Cancelled' WHERE id = ?",
      args: [id],
    });
    res.json({ success: true });
  } catch (error: any) {
    console.error("Cancel error:", error);
    if (error.message?.includes("TURSO_URL")) {
      res.status(503).json({ error: "Service temporarily unavailable" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

app.get("/api/health", (req, res) => {
  try {
    const db = getDb();
    res.json({ status: "ok", db: "ready" });
  } catch {
    res.status(503).json({ status: "db_unavailable", error: "Service temporarily unavailable" });
  }
});

export default app;
