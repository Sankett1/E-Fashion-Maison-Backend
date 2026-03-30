import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema({
  product:   { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name:      { type: String, required: true },
  image:     { type: String, required: true },
  price:     { type: Number, required: true },
  size:      { type: String, required: true },
  qty:       { type: Number, required: true, min: 1 },
});

const ShippingAddressSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String },
  email:     { type: String, required: true },
  phone:     { type: String, required: true },
  address:   { type: String, required: true },
  city:      { type: String, required: true },
  state:     { type: String, required: true },
  pincode:   { type: String, required: true },
});

const PaymentResultSchema = new mongoose.Schema({
  id:           { type: String },
  status:       { type: String },
  update_time:  { type: String },
  email:        { type: String },
  method:       { type: String, enum: ["card", "upi", "netbanking", "cod", "stripe", "razorpay"] },
});

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items:       [OrderItemSchema],
    shippingAddress: { type: ShippingAddressSchema, required: true },
    paymentMethod:   { type: String, required: true },
    paymentResult:   { type: PaymentResultSchema },

    // Pricing
    subtotal:       { type: Number, required: true, default: 0 },
    shippingCharge: { type: Number, required: true, default: 0 },
    discount:       { type: Number, default: 0 },
    couponCode:     { type: String },
    totalAmount:    { type: Number, required: true, default: 0 },

    // Status
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled", "Refunded"],
      default: "Pending",
    },
    isPaid:         { type: Boolean, default: false },
    paidAt:         { type: Date },
    isDelivered:    { type: Boolean, default: false },
    deliveredAt:    { type: Date },

    trackingNumber: { type: String },
    courier:        { type: String },
    notes:          { type: String },
  },
  { timestamps: true }
);

// ── Auto-generate order number ─────────────────────────────────────────────────
OrderSchema.pre("save", function (next) {
  if (!this.orderNumber) {
    const year = new Date().getFullYear();
    this.orderNumber = `MSN-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  next();
});

export default mongoose.model("Order", OrderSchema);
