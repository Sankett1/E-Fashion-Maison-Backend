import express from "express";
import {
  getDashboardStats, getAllUsers, updateUserRole,
  deactivateUser, getRevenueChart,
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// All admin routes require protect + adminOnly
router.use(protect, adminOnly);

router.get("/dashboard",     getDashboardStats);
router.get("/users",         getAllUsers);
router.put("/users/:id",     updateUserRole);
router.delete("/users/:id",  deactivateUser);
router.get("/revenue-chart", getRevenueChart);

export default router;
