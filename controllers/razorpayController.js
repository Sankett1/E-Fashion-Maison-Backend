import Razorpay from "razorpay";
import crypto   from "crypto";
import Order    from "../models/Order.js";

// ── Lazily create the Razorpay client so missing env vars surface at call-time,
//    not at import time (useful during unit tests / seed scripts).
let _razorpay;
const getRazorpay = () => {
  if (!_razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env");
    }
    _razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
};

// ── POST /api/orders/razorpay/create ─────────────────────────────────────────
// Body: { orderId }   (the MongoDB order _id created just before payment)
export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorised" });
    }

    // Amount in paise (Razorpay expects smallest currency unit)
    const options = {
      amount:   Math.round(order.totalAmount * 100),
      currency: "INR",
      receipt:  order.orderNumber,
      notes:    { orderId: order._id.toString(), userId: req.user._id.toString() },
    };

    const razorpayOrder = await getRazorpay().orders.create(options);

    res.json({
      success:           true,
      razorpayOrderId:   razorpayOrder.id,
      amount:            razorpayOrder.amount,
      currency:          razorpayOrder.currency,
      razorpayKeyId:     process.env.RAZORPAY_KEY_ID,
      // Pass through info the frontend needs to pre-fill the Razorpay modal
      orderNumber:       order.orderNumber,
      customerName:      `${order.shippingAddress.firstName} ${order.shippingAddress.lastName || ""}`.trim(),
      customerEmail:     order.shippingAddress.email,
      customerPhone:     order.shippingAddress.phone,
    });
  } catch (error) { next(error); }
};

// ── POST /api/orders/razorpay/verify ─────────────────────────────────────────
// Body: { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "All payment fields are required" });
    }

    // ── 1. Verify HMAC-SHA256 signature ───────────────────────────────────────
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed — invalid signature" });
    }

    // ── 2. Mark the order as paid ─────────────────────────────────────────────
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorised" });
    }

    order.isPaid        = true;
    order.paidAt        = new Date();
    order.status        = "Processing";
    order.paymentMethod = "razorpay";
    order.paymentResult = {
      id:          razorpay_payment_id,
      status:      "captured",
      update_time: new Date().toISOString(),
      email:       order.shippingAddress.email,
      method:      "razorpay",
    };

    await order.save();

    res.json({ success: true, message: "Payment verified successfully", order });
  } catch (error) { next(error); }
};
