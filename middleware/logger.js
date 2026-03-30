import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR   = path.join(__dirname, "..", "logs");
const LOG_FILE  = path.join(LOG_DIR, "api.log");

// Create logs directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const pad  = (n) => String(n).padStart(2, "0");
const time = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const METHOD_PAD = { GET: "GET   ", POST: "POST  ", PUT: "PUT   ", DELETE: "DELETE", PATCH: "PATCH " };

// ── Console colours (disabled in production) ──────────────────────────────────
const C = process.env.NODE_ENV === "production" ? {
  reset: "", dim: "", green: "", yellow: "", red: "", cyan: "", gold: "",
} : {
  reset:  "\x1b[0m",  dim:    "\x1b[2m",
  green:  "\x1b[32m", yellow: "\x1b[33m",
  red:    "\x1b[31m", cyan:   "\x1b[36m",
  gold:   "\x1b[93m",
};

const statusColour = (s) => {
  if (s >= 500) return C.red;
  if (s >= 400) return C.yellow;
  if (s >= 300) return C.cyan;
  return C.green;
};

// ── Logger middleware ─────────────────────────────────────────────────────────
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const ts    = time();
  const ip    = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "-";

  res.on("finish", () => {
    const ms     = Date.now() - start;
    const method = METHOD_PAD[req.method] || req.method.padEnd(6);
    const s      = res.statusCode;
    const col    = statusColour(s);

    // Console output
    console.log(
      `${C.dim}[${ts}]${C.reset} ` +
      `${C.gold}${method}${C.reset} ` +
      `${col}${s}${C.reset} ` +
      `${req.originalUrl.padEnd(50)} ` +
      `${C.dim}${ms}ms  ${ip}${C.reset}`
    );

    // File log (plain text)
    const line = `[${ts}] ${method.trim()} ${s} ${req.originalUrl} ${ms}ms ${ip}\n`;
    fs.appendFile(LOG_FILE, line, () => {});
  });

  next();
};

// ── Error logger ──────────────────────────────────────────────────────────────
export const errorLogger = (err, req, res, next) => {
  const ts   = time();
  const line = `[${ts}] ERROR ${err.status || 500} ${req.method} ${req.originalUrl} — ${err.message}\n`;

  if (process.env.NODE_ENV === "development") {
    console.error(`${C.red}[ERROR]${C.reset} ${err.message}`);
    if (err.stack) console.error(C.dim + err.stack + C.reset);
  }

  fs.appendFile(LOG_FILE, line, () => {});
  next(err);
};
