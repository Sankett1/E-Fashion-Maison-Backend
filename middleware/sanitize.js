// ── Input sanitization middleware ─────────────────────────────────────────────
// Strips XSS patterns and NoSQL injection operators from request body/query/params

const XSS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<[^>]+>/g,
];

const stripXSS = (value) => {
  if (typeof value !== "string") return value;
  let clean = value;
  for (const pattern of XSS_PATTERNS) {
    clean = clean.replace(pattern, "");
  }
  return clean.trim();
};

// Remove MongoDB operators from objects to prevent NoSQL injection
const stripMongoOps = (obj) => {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(stripMongoOps);

  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    // Drop keys that start with $ or contain dots (MongoDB operators/path injection)
    if (key.startsWith("$") || key.includes(".")) continue;
    clean[key] = typeof val === "object" ? stripMongoOps(val) : stripXSS(String(val ?? ""));
  }
  return clean;
};

export const sanitize = (req, res, next) => {
  if (req.body   && typeof req.body   === "object") req.body   = stripMongoOps(req.body);
  if (req.query  && typeof req.query  === "object") req.query  = stripMongoOps(req.query);
  if (req.params && typeof req.params === "object") req.params = stripMongoOps(req.params);
  next();
};

// ── Prevent parameter pollution ───────────────────────────────────────────────
// e.g. ?sort=price&sort=name → takes last value only
export const preventParamPollution = (whitelist = []) => (req, res, next) => {
  if (req.query) {
    for (const [key, val] of Object.entries(req.query)) {
      if (Array.isArray(val) && !whitelist.includes(key)) {
        req.query[key] = val[val.length - 1];
      }
    }
  }
  next();
};
