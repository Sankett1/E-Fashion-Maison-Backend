import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name:    { type: String, required: true },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true }
);

const ImageSchema = new mongoose.Schema({
  public_id: { type: String, required: true },
  url:       { type: String, required: true },
});

const ProductSchema = new mongoose.Schema(
  {
    name:        { type: String, required: [true, "Product name is required"], trim: true, maxlength: [120, "Name cannot exceed 120 characters"] },
    description: { type: String, required: [true, "Description is required"], maxlength: [2000, "Description cannot exceed 2000 characters"] },
    price:       { type: Number, required: [true, "Price is required"], min: [0, "Price cannot be negative"] },
    originalPrice: { type: Number },
    category:    { type: String, required: [true, "Category is required"], enum: ["Women", "Men", "Accessories", "Kids"] },
    subCategory: { type: String },
    sizes:       [{ type: String, enum: ["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "38", "39", "40", "41", "42", "43", "44"] }],
    colors:      [{ type: String }],
    images:      [ImageSchema],
    stock:       { type: Number, required: true, default: 0, min: 0 },
    sku:         { type: String, unique: true },
    tags:        [{ type: String }],
    fabric:      { type: String },
    careInstructions: { type: String },
    isActive:    { type: Boolean, default: true },
    isFeatured:  { type: Boolean, default: false },
    tag:         { type: String, enum: ["NEW", "SALE", "TRENDING", null], default: null },
    // Reviews aggregated fields
    ratings:     { type: Number, default: 0 },
    numReviews:  { type: Number, default: 0 },
    reviews:     [ReviewSchema],
  },
  { timestamps: true }
);

// ── Auto-generate SKU ─────────────────────────────────────────────────────────
ProductSchema.pre("save", function (next) {
  if (!this.sku) {
    this.sku = `MSN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

// ── Recalculate average rating on save ────────────────────────────────────────
ProductSchema.methods.recalcRating = function () {
  if (this.reviews.length === 0) {
    this.ratings = 0;
    this.numReviews = 0;
  } else {
    this.numReviews = this.reviews.length;
    this.ratings = +(
      this.reviews.reduce((acc, r) => acc + r.rating, 0) / this.reviews.length
    ).toFixed(1);
  }
};

// ── Virtual: discount percentage ─────────────────────────────────────────────
ProductSchema.virtual("discountPercent").get(function () {
  if (!this.originalPrice || this.originalPrice <= this.price) return 0;
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

ProductSchema.set("toJSON", { virtuals: true });
ProductSchema.set("toObject", { virtuals: true });

// ── Text search index ─────────────────────────────────────────────────────────
ProductSchema.index({ name: "text", description: "text", tags: "text" });

export default mongoose.model("Product", ProductSchema);
