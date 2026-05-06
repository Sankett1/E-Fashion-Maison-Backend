import express from "express";
import {
  createOrder, getMyOrders, getOrderById,
  markOrderPaid, getAllOrders, updateOrderStatus, getOrderStats,
} from "../controllers/orderController.js";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../controllers/razorpayController.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { validateOrder }      from "../middleware/validate.js";

const router = express.Router();

// ── Admin routes first (must precede /:id wildcard) ───────────────────────────
router.get("/admin/all",   protect, adminOnly, getAllOrders);
router.get("/admin/stats", protect, adminOnly, getOrderStats);

// ── Razorpay routes ───────────────────────────────────────────────────────────
router.post("/razorpay/create",  protect, createRazorpayOrder);
router.post("/razorpay/verify",  protect, verifyRazorpayPayment);

// ── User routes ───────────────────────────────────────────────────────────────
router.post("/",           protect, validateOrder, createOrder);
router.get("/",            protect, getMyOrders);
router.get("/my-orders",   protect, getMyOrders);

// ── Parameterized routes (specific before generic) ──────────────────────────────
router.put("/:id/pay",     protect, markOrderPaid);
router.put("/:id/status",  protect, adminOnly, updateOrderStatus);
router.get("/:id",         protect, getOrderById);

export default router;
