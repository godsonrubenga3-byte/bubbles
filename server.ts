import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("bubbles.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    lat REAL,
    lng REAL,
    clothes_weight REAL DEFAULT 0,
    blankets_count INTEGER DEFAULT 0,
    total_price REAL NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Routes
  app.post("/api/signup", (req, res) => {
    const { email, password, name } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      const stmt = db.prepare("INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)");
      stmt.run(id, email, password, name);
      res.status(201).json({ id, email, name });
    } catch (error) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      res.json({ id: user.id, email: user.email, name: user.name });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // API Routes
  app.post("/api/orders", (req, res) => {
    const { id, user_id, customer_name, phone, address, lat, lng, clothes_weight, blankets_count, total_price } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO orders (id, user_id, customer_name, phone, address, lat, lng, clothes_weight, blankets_count, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, user_id, customer_name, phone, address, lat, lng, clothes_weight, blankets_count, total_price);
      res.status(201).json({ success: true, id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.get("/api/orders/user/:userId", (req, res) => {
    const { userId } = req.params;
    const orders = db.prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC").all(userId);
    res.json(orders);
  });

  app.get("/api/orders/:id", (req, res) => {
    const { id } = req.params;
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  });

  app.post("/api/orders/:id/cancel", (req, res) => {
    const { id } = req.params;
    const order = db.prepare("SELECT status FROM orders WHERE id = ?").get(id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status !== 'Pending') return res.status(400).json({ error: "Only pending orders can be cancelled" });

    db.prepare("UPDATE orders SET status = 'Cancelled' WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
