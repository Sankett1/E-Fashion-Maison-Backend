import express from "express";
import {
  getProducts, getProductById,
  createProduct, updateProduct, deleteProduct, deleteProductImage,
  createReview, getFeaturedProducts, toggleWishlist,
} from "../controllers/productController.js";
import { protect, adminOnly, optionalAuth } from "../middleware/auth.js";
import { uploadProduct }                    from "../config/cloudinary.js";
import { validateProduct, validateReview }  from "../middleware/validate.js";
import { cache, bustCache }                 from "../middleware/cache.js";

const router = express.Router();

// ── Public (with optional auth for wishlist state) ────────────────────────────
router.get("/",        optionalAuth, cache(30), getProducts);
router.get("/featured",              cache(120), getFeaturedProducts);
router.get("/:id",    optionalAuth,             getProductById);

// ── User (authenticated) ──────────────────────────────────────────────────────
router.post("/:id/review",  protect, validateReview, createReview);
router.put("/:id/wishlist", protect, toggleWishlist);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.post("/",
  protect, adminOnly,
  uploadProduct.array("images", 6),
  validateProduct,
  createProduct
);
router.put("/:id",
  protect, adminOnly,
  uploadProduct.array("images", 6),
  updateProduct
);
router.delete("/:id",                    protect, adminOnly, deleteProduct);
router.delete("/:id/image/:imageId",     protect, adminOnly, deleteProductImage);

export default router;
