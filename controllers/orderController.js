import Order from "../models/Order.js";
import Product from "../models/Product.js";

export const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ success: false, message: "No order items" });
    const enrichedItems = [];
    let subtotal = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) return res.status(400).json({ success: false, message: `Product not available: ${item.product}` });
      if (product.stock < item.qty) return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      enrichedItems.push({ product: product._id, name: product.name, image: product.images?.[0]?.url || "", price: product.price, size: item.size, qty: item.qty });
      subtotal += product.price * item.qty;
    }
    let discount = 0;
    if (couponCode === "MAISON10") discount = Math.round(subtotal * 0.1);
    const shippingCharge = subtotal >= 2000 ? 0 : 199;
    const totalAmount = subtotal - discount + shippingCharge;
    const order = await Order.create({ user: req.user._id, items: enrichedItems, shippingAddress, paymentMethod, subtotal, discount, couponCode, shippingCharge, totalAmount });
    for (const item of enrichedItems) await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } });
    await order.populate("items.product", "name images");
    res.status(201).json({ success: true, order });
  } catch (error) { next(error); }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).populate("items.product", "name images");
    res.json({ success: true, count: orders.length, orders });
  } catch (error) { next(error); }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email").populate("items.product", "name images");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") return res.status(403).json({ success: false, message: "Not authorised" });
    res.json({ success: true, order });
  } catch (error) { next(error); }
};

export const markOrderPaid = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    order.isPaid = true;
    order.paidAt = new Date();
    order.status = "Processing";
    order.paymentResult = { id: req.body.id, status: req.body.status, update_time: req.body.update_time, email: req.body.email, method: order.paymentMethod };
    await order.save();
    res.json({ success: true, order });
  } catch (error) { next(error); }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate("user", "name email");
    res.json({ success: true, total, pages: Math.ceil(total / Number(limit)), orders });
  } catch (error) { next(error); }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, trackingNumber, courier } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (courier) order.courier = courier;
    if (status === "Delivered") { order.isDelivered = true; order.deliveredAt = new Date(); }
    await order.save();
    res.json({ success: true, order });
  } catch (error) { next(error); }
};

export const getOrderStats = async (req, res, next) => {
  try {
    const stats = await Order.aggregate([{ $match: { isPaid: true } }, { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" }, totalOrders: { $sum: 1 }, avgOrderValue: { $avg: "$totalAmount" } } }]);
    const statusBreakdown = await Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    res.json({ success: true, stats: stats[0] || {}, statusBreakdown });
  } catch (error) { next(error); }
};
