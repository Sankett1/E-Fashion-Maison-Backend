// ── Global error handler ──────────────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || "Internal Server Error";

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message    = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    statusCode = 409;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    message    = `Resource not found`;
    statusCode = 404;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    message    = Object.values(err.errors).map(e => e.message).join(", ");
    statusCode = 400;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError")  { message = "Invalid token";      statusCode = 401; }
  if (err.name === "TokenExpiredError")  { message = "Token has expired";   statusCode = 401; }

  if (process.env.NODE_ENV === "development") {
    console.error(`[ERROR] ${err.stack}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// ── 404 handler ───────────────────────────────────────────────────────────────
export const notFound = (req, res, next) => {
  const err = new Error(`Route not found — ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

export default errorHandler;
