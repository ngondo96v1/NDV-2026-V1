
import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
import { Server } from "socket.io";
import http from "http";
import { rateLimit } from "express-rate-limit";

// Load environment variables from .env file
dotenv.config();

import { apiRouter, keepAliveSupabase } from "./api/index.ts";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  
  // Trust proxy is required for express-rate-limit to work correctly behind a reverse proxy (like nginx/Cloud Run)
  app.set('trust proxy', 1);
  
  // 1. Global Rate Limiter - Protects against general DDoS
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 1000, // Limit each IP to 1000 requests per windowMs
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      error: "Too Many Requests",
      message: "Hệ thống đang nhận được quá nhiều yêu cầu từ địa chỉ IP của bạn. Vui lòng thử lại sau 15 phút."
    }
  });

  // 2. API Rate Limiter - Stricter for API calls
  const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    limit: 100, // Limit each IP to 100 requests per minute
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      error: "Too Many API Requests",
      message: "Bạn đang gửi yêu cầu quá nhanh. Vui lòng đợi một lát."
    },
    skip: (req) => {
      // Skip rate limiting for static assets or if needed
      return req.url.includes("node_modules") || req.url.endsWith(".js") || req.url.endsWith(".css");
    }
  });

  // 3. Auth Rate Limiter - Very strict for login/register to prevent brute force
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 20, // Limit each IP to 20 login/register attempts per 15 minutes
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      error: "Too Many Auth Attempts",
      message: "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút để bảo mật tài khoản."
    }
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Apply global limiter to all requests
  app.use(globalLimiter);

  // Apply API limiter to all /api routes
  app.use("/api", apiLimiter);

  // Apply strict limiter to auth routes
  app.use("/api/login", authLimiter);
  app.use("/api/register", authLimiter);
  app.use("/api/admin/login", authLimiter);

  // Make io accessible to routes
  app.set("io", io);

  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);

  // Socket.io connection handling
  io.on("connection", (socket) => {
    console.log(`[SOCKET] New connection: ${socket.id}`);

    socket.on("join", (data) => {
      const { userId, isAdmin } = data;
      if (isAdmin) {
        socket.join("admin");
        console.log(`[SOCKET] ${socket.id} joined admin room`);
      }
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`[SOCKET] ${socket.id} joined room user_${userId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[SOCKET] Disconnected: ${socket.id}`);
    });
  });

  app.use((req, res, next) => {
    // Skip logging for static assets in development to reduce noise
    if (process.env.NODE_ENV !== "production" && (req.url.endsWith(".tsx") || req.url.endsWith(".ts") || req.url.endsWith(".css") || req.url.includes("node_modules"))) {
      return next();
    }
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Mount the API router
  app.use("/api", apiRouter);

  // Fall-through for /api that didn't match any route in apiRouter
  app.use("/api", (req, res) => {
    console.warn(`[SERVER WARN] API route not found in router: ${req.method} ${req.url}`);
    res.status(404).json({
      error: "API Route Not Found",
      message: `Đường dẫn API không tồn tại: ${req.method} ${req.url}`
    });
  });

  // Vite middleware for development
  const distPath = path.join(process.cwd(), "dist");
  const useVite = process.env.NODE_ENV !== "production" || !fs.existsSync(distPath);

  if (useVite) {
    console.log("Using Vite middleware");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static files from dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Production build not found. Please run 'npm run build'.");
      }
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Initial Supabase ping on startup
    keepAliveSupabase().then(success => {
      if (success) {
        io.to("admin").emit("supabase_ping", { timestamp: new Date().toISOString() });
      }
    });
    
    // Ping Supabase every 1 hour to prevent project pausing
    setInterval(async () => {
      const success = await keepAliveSupabase();
      if (success) {
        io.to("admin").emit("supabase_ping", { timestamp: new Date().toISOString() });
      }
    }, 1 * 60 * 60 * 1000);
  });

  // Global error handler - MUST be after all other routes
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("UNHANDLED ERROR:", err);
    
    // Ensure we always return JSON
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Đã xảy ra lỗi hệ thống không xác định";
    
    if (!res.headersSent) {
      res.status(status).json({ 
        error: "Internal Server Error", 
        message: message,
        path: req.url,
        method: req.method,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  });
}

startServer().catch(err => {
  console.error("CRITICAL: Failed to start server:", err);
});
