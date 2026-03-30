// ── Simple in-memory response cache ──────────────────────────────────────────
// Suitable for development/small-scale. Replace with Redis in production.

const store = new Map(); // { key: { data, expiresAt } }

// ── Cache middleware factory ──────────────────────────────────────────────────
// Usage: router.get("/products", cache(60), getProducts)
export const cache = (ttlSeconds = 60) => (req, res, next) => {
  // Only cache GET requests without auth
  if (req.method !== "GET") return next();

  const key = req.originalUrl;
  const hit = store.get(key);

  if (hit && hit.expiresAt > Date.now()) {
    res.setHeader("X-Cache", "HIT");
    res.setHeader("X-Cache-Age", Math.round((hit.expiresAt - Date.now()) / 1000) + "s remaining");
    return res.json(hit.data);
  }

  // Intercept res.json to store the response
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (res.statusCode === 200) {
      store.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
      res.setHeader("X-Cache", "MISS");
    }
    originalJson(data);
  };

  next();
};

// ── Bust a specific cache key or prefix ──────────────────────────────────────
export const bustCache = (prefix) => {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
};

// ── Clear entire cache (call after write operations) ─────────────────────────
export const clearCache = () => store.clear();

// ── Stats ─────────────────────────────────────────────────────────────────────
export const cacheStats = () => ({
  entries: store.size,
  keys:    [...store.keys()],
});
