import User    from "../models/User.js";
import Product from "../models/Product.js";
import Order   from "../models/Order.js";

// ── @route  GET /api/admin/dashboard ─────────────────────────────────────────
export const getDashboardStats = async (req, res, next) => {
  try {
    const [totalUsers, totalProducts, totalOrders, revenueData] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.aggregate([{ $match: { isPaid: true } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
    ]);

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email");

    const lowStockProducts = await Product.find({ stock: { $lte: 5 }, isActive: true })
      .select("name stock images")
      .limit(10);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: revenueData[0]?.total || 0,
      },
      recentOrders,
      lowStockProducts,
    });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/admin/users ──────────────────────────────────────────────
export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = search ? { $or: [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }] } : {};
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    res.json({ success: true, total, users });
  } catch (error) {
    next(error);
  }
};

// ── @route  PUT /api/admin/users/:id ─────────────────────────────────────────
export const updateUserRole = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ── @route  DELETE /api/admin/users/:id ──────────────────────────────────────
export const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User deactivated" });
  } catch (error) {
    next(error);
  }
};

// ── @route  GET /api/admin/revenue-chart ─────────────────────────────────────
export const getRevenueChart = async (req, res, next) => {
  try {
    const data = await Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id:      { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue:  { $sum: "$totalAmount" },
          orders:   { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
