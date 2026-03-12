import express from "express";
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const db = createClient({
  url: process.env.TURSO_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const app = express();

app.use(express.json());

// Auth Routes
app.post("/api/signup", async (req, res) => {
  const { email, password, name, username, phone, is_whatsapp, lat, lng, location_name } = req.body;
  const id = Math.random().toString(36).substr(2, 9);
  try {
    await db.execute({
      sql: "INSERT INTO clients_details (id, email, password, name, username, phone, is_whatsapp, lat, lng, location_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [id, email, password, name, username, phone, is_whatsapp ? 1 : 0, lat, lng, location_name],
    });
    res.status(201).json({ id, email, name, username, phone, is_whatsapp, lat, lng, location_name });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Email or username already exists" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.execute({
      sql: "SELECT * FROM clients_details WHERE email = ? AND password = ?",
      args: [email, password],
    });
    const user = result.rows[0];
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
        location_name: user.location_name
      });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API Routes
app.post("/api/orders", async (req, res) => {
  const { id, user_id, customer_name, phone, address, lat, lng, clothes_weight, blankets_count, total_price } = req.body;
  try {
    await db.execute({
      sql: `
        INSERT INTO Order_details (id, user_id, customer_name, phone, address, lat, lng, clothes_weight, blankets_count, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [id, user_id, customer_name, phone, address, lat, lng, clothes_weight, blankets_count, total_price],
    });
    res.status(201).json({ success: true, id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

app.get("/api/orders/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await db.execute({
      sql: "SELECT * FROM Order_details WHERE user_id = ? ORDER BY created_at DESC",
      args: [userId],
    });
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.get("/api/orders/:id", async (req, res) => {
  const { id } = req.params;
  try {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/orders/:id/cancel", async (req, res) => {
  const { id } = req.params;
  try {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;