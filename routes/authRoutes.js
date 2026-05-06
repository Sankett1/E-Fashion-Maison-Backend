import express from "express";
import {
  register, login, logout,
  getMe, updateProfile, changePassword,
  updateAvatar, addAddress, removeAddress, getAddresses, updateAddress,
} from "../controllers/authController.js";
import { protect }        from "../middleware/auth.js";
import { uploadAvatar }   from "../config/cloudinary.js";
import {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateAddress,
} from "../middleware/validate.js";

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.post("/register", validateRegister, register);
router.post("/login",    validateLogin,    login);
router.post("/logout",   logout);

// ── Protected ─────────────────────────────────────────────────────────────────
router.get("/me",                     protect, getMe);
router.put("/update-profile",         protect, updateProfile);
router.put("/change-password",        protect, validateChangePassword, changePassword);
router.put("/avatar",                 protect, uploadAvatar.single("avatar"), updateAvatar);
router.get("/addresses",              protect, getAddresses);
router.post("/address",               protect, validateAddress, addAddress);
router.put("/address/:id",            protect, validateAddress, updateAddress);
router.delete("/address/:id",         protect, removeAddress);

export default router;
