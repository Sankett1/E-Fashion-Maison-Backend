import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const AddressSchema = new mongoose.Schema({
  label:   { type: String, default: "Home" },
  line1:   { type: String, required: true },
  city:    { type: String, required: true },
  state:   { type: String, required: true },
  pincode: { type: String, required: true },
  phone:   { type: String },
  isDefault: { type: Boolean, default: false },
});

const UserSchema = new mongoose.Schema(
  {
    name:     { type: String, required: [true, "Name is required"], trim: true, maxlength: [60, "Name cannot exceed 60 characters"] },
    email:    { type: String, required: [true, "Email is required"], unique: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"] },
    password: { type: String, required: [true, "Password is required"], minlength: [6, "Password must be at least 6 characters"], select: false },
    phone:    { type: String, trim: true },
    avatar:   {
      public_id: { type: String, default: "" },
      url:       { type: String, default: "" },
    },
    role:      { type: String, enum: ["user", "admin"], default: "user" },
    addresses: [AddressSchema],
    wishlist:  [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    resetPasswordToken:   { type: String, select: false },
    resetPasswordExpire:  { type: Date, select: false },
    emailVerified:        { type: Boolean, default: false },
    emailVerifyToken:     { type: String, select: false },
    isActive:             { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ── Hash password before save ─────────────────────────────────────────────────
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Compare password ──────────────────────────────────────────────────────────
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// ── Generate JWT ──────────────────────────────────────────────────────────────
UserSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

export default mongoose.model("User", UserSchema);
