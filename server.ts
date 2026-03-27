import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

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
    role TEXT DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS shops (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    lat REAL,
    lng REAL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    driver_id TEXT,
    shop_id TEXT,
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
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(driver_id) REFERENCES users(id),
    FOREIGN KEY(shop_id) REFERENCES shops(id)
  );

  -- Insert some initial shops in Dar es Salaam if they don't exist
  INSERT OR IGNORE INTO shops (id, name, address, lat, lng) VALUES 
  ('shop-1', 'Bubbles Central - Kariakoo', 'Kariakoo Market Area, Dar es Salaam', -6.8161, 39.2766),
  ('shop-2', 'Bubbles North - Masaki', 'Masaki Peninsula, Dar es Salaam', -6.7490, 39.2736),
  ('shop-3', 'Bubbles West - Ubungo', 'Ubungo Bus Terminal Area, Dar es Salaam', -6.7881, 39.2181);
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Routes
  app.post("/api/signup", async (req, res) => {
    const { email, password, name, role } = req.body;
    const id = Math.random().toString(36).substr(2, 9);
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare("INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)");
      stmt.run(id, email, hashedPassword, name, role || 'customer');
      res.status(201).json({ id, email, name, role: role || 'customer' });
    } catch (error) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (user && await bcrypt.compare(password, user.password)) {
      res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
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

  // Driver Routes
  app.get("/api/driver/available-orders", (req, res) => {
    // Orders that are Pending (need pickup from customer) or Ready for Delivery (need pickup from shop)
    const orders = db.prepare(`
      SELECT * FROM orders 
      WHERE (status = 'Pending' AND driver_id IS NULL) 
      OR (status = 'Ready for Delivery' AND driver_id IS NULL)
      ORDER BY created_at DESC
    `).all();
    res.json(orders);
  });

  app.get("/api/driver/my-orders/:driverId", (req, res) => {
    const { driverId } = req.params;
    const orders = db.prepare("SELECT * FROM orders WHERE driver_id = ? AND status NOT IN ('Delivered', 'Cancelled')").all(driverId);
    res.json(orders);
  });

  app.post("/api/driver/accept-order", (req, res) => {
    const { orderId, driverId } = req.body;
    const order = db.prepare("SELECT status, driver_id FROM orders WHERE id = ?").get(orderId);
    
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.driver_id) return res.status(400).json({ error: "Order already accepted by another driver" });

    let newStatus = order.status;
    if (order.status === 'Pending') newStatus = 'Driver Assigned';
    else if (order.status === 'Ready for Delivery') newStatus = 'Out for Delivery';

    db.prepare("UPDATE orders SET driver_id = ?, status = ? WHERE id = ?").run(driverId, newStatus, orderId);
    res.json({ success: true, status: newStatus });
  });

  app.post("/api/driver/update-status", (req, res) => {
    const { orderId, status, shopId, driverId } = req.body;
    try {
      // Basic security check: ensure driver is assigned to this order or it's a shop simulation
      const order = db.prepare("SELECT driver_id, status FROM orders WHERE id = ?").get(orderId);
      if (!order) return res.status(404).json({ error: "Order not found" });
      
      // Allow status updates if driver is assigned OR if it's a shop processing status (Washing, Drying, Ready)
      const isShopStatus = ['Washing', 'Drying', 'Ready for Delivery'].includes(status);
      if (order.driver_id !== driverId && !isShopStatus) {
        return res.status(403).json({ error: "Unauthorized: You are not assigned to this order" });
      }

      // If status is 'At Shop', clear driver_id so it can be picked up by any driver when ready
      if (status === 'At Shop') {
        if (shopId) {
          db.prepare("UPDATE orders SET status = ?, shop_id = ?, driver_id = NULL WHERE id = ?").run(status, shopId, orderId);
        } else {
          db.prepare("UPDATE orders SET status = ?, driver_id = NULL WHERE id = ?").run(status, orderId);
        }
      } else {
        if (shopId) {
          db.prepare("UPDATE orders SET status = ?, shop_id = ? WHERE id = ?").run(status, shopId, orderId);
        } else {
          db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, orderId);
        }
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  app.get("/api/shops", (req, res) => {
    const shops = db.prepare("SELECT * FROM shops").all();
    res.json(shops);
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
