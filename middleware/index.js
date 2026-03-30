// ── Middleware barrel export ──────────────────────────────────────────────────
export { protect, adminOnly, optionalAuth }      from "./auth.js";
export { validateRegister, validateLogin, validateChangePassword, validateAddress, validateProduct, validateOrder, validateReview } from "./validate.js";
export { requestLogger, errorLogger }            from "./logger.js";
export { uploadSingle, uploadMultiple, requireFile, fileSizeGuard } from "./upload.js";
export { sanitize, preventParamPollution }       from "./sanitize.js";
export { cache, bustCache, clearCache, cacheStats } from "./cache.js";
export { default as errorHandler, notFound }     from "./errorHandler.js";
