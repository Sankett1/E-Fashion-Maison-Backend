import express from "express";
import {
  createOrder, getMyOrders, getOrderById,
  markOrderPaid, getAllOrders, updateOrderStatus, getOrderStats,
} from "../controllers/orderController.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { validateOrder }      from "../middleware/validate.js";

const router = express.Router();

// ── Admin routes first (must precede /:id wildcard) ───────────────────────────
router.get("/admin/all",   protect, adminOnly, getAllOrders);
router.get("/admin/stats", protect, adminOnly, getOrderStats);

// ── User routes ───────────────────────────────────────────────────────────────
router.post("/",           protect, validateOrder, createOrder);
router.get("/my-orders",   protect, getMyOrders);
router.get("/:id",         protect, getOrderById);
router.put("/:id/pay",     protect, markOrderPaid);
router.put("/:id/status",  protect, adminOnly, updateOrderStatus);

export default router;
