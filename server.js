import "dotenv/config";
import "express-async-errors";
import express      from "express";
import cors         from "cors";
import helmet       from "helmet";
import rateLimit    from "express-rate-limit";

import connectDB         from "./config/db.js";
import authRoutes        from "./routes/authRoutes.js";
import productRoutes     from "./routes/productRoutes.js";
import orderRoutes       from "./routes/orderRoutes.js";
import adminRoutes       from "./routes/adminRoutes.js";
import { requestLogger, errorLogger } from "./middleware/logger.js";
import { sanitize, preventParamPollution } from "./middleware/sanitize.js";
import { fileSizeGuard } from "./middleware/upload.js";
import errorHandler, { notFound } from "./middleware/errorHandler.js";

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // allow Cloudinary images
}));

// ── CORS — supports multiple allowed origins (dev + prod) ─────────────────────
// FIX: Support an array of allowed origins via CORS_ORIGINS env var,
// falling back to single CLIENT_URL or localhost for dev.
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map(o => o.trim())
  : [process.env.CLIENT_URL || "http://localhost:5173"];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["X-Total-Count"],
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Custom error handler for JSON parsing errors ────────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON in request body",
      details: "Please ensure your request body contains valid JSON. Example: { \"key\": \"value\" }",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
  next(err);
});

// ── Custom request logger ─────────────────────────────────────────────────────
app.use(requestLogger);

// ── Sanitize inputs (XSS + NoSQL injection protection) ───────────────────────
app.use(sanitize);
app.use(preventParamPollution(["sort", "category", "sizes", "colors", "tag"]));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests — please try again in 15 minutes." },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  standardHeaders: true,
  legacyHeaders: false,
  message:  { success: false, message: "Too many auth attempts — please wait 15 minutes." },
});

app.use("/api",               limiter);
app.use("/api/auth/login",    authLimiter);
app.use("/api/auth/register", authLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "MAISON API is running",
    env:     process.env.NODE_ENV,
    version: "2.1.0",
    uptime:  `${Math.floor(process.uptime())}s`,
    db:      "connected",
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders",   orderRoutes);
app.use("/api/admin",    adminRoutes);

// ── File upload error handler ─────────────────────────────────────────────────
app.use(fileSizeGuard(5));

// ── 404 + global error handler ────────────────────────────────────────────────
app.use(notFound);
app.use(errorLogger);
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀  MAISON API v2.1 — ${process.env.NODE_ENV || "development"} mode`);
  console.log(`📡  http://localhost:${PORT}/api/health`);
  console.log(`🌐  Allowed origins: ${allowedOrigins.join(", ")}`);
  console.log(`📝  Logs → ./logs/api.log\n`);
});

export default app;
