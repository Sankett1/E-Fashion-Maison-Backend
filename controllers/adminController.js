import User    from "../models/User.js";
import Product from "../models/Product.js";
import Order   from "../models/Order.js";

// ── @route  GET /api/admin/dashboard ─────────────────────────────────────────
export const getDashboardStats = async (req, res, next) => {
  try {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const prev  = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalUsers, totalProducts, totalOrders, revenueData,
      monthOrders, prevMonthOrders,
      monthRevenue, prevMonthRevenue,
      monthUsers, prevMonthUsers,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.aggregate([{ $match: { isPaid: true } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
      Order.countDocuments({ createdAt: { $gte: start } }),
      Order.countDocuments({ createdAt: { $gte: prev, $lt: start } }),
      Order.aggregate([{ $match: { isPaid: true, createdAt: { $gte: start } } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
      Order.aggregate([{ $match: { isPaid: true, createdAt: { $gte: prev, $lt: start } } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
      User.countDocuments({ role: "user", createdAt: { $gte: start } }),
      User.countDocuments({ role: "user", createdAt: { $gte: prev, $lt: start } }),
    ]);

    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).populate("user", "name email");
    const lowStockProducts = await Product.find({ stock: { $lte: 5 }, isActive: true }).select("name stock images category").limit(10);
    const statusBreakdown = await Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);

    const pct = (curr, prev) => prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

    res.json({
      success: true,
      stats: {
        totalUsers, totalProducts, totalOrders,
        totalRevenue: revenueData[0]?.total || 0,
        thisMonthOrders:  monthOrders,
        thisMonthRevenue: monthRevenue[0]?.total || 0,
        thisMonthUsers:   monthUsers,
        ordersGrowth:     pct(monthOrders, prevMonthOrders),
        revenueGrowth:    pct(monthRevenue[0]?.total || 0, prevMonthRevenue[0]?.total || 0),
        usersGrowth:      pct(monthUsers, prevMonthUsers),
      },
      recentOrders,
      lowStockProducts,
      statusBreakdown,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = search ? { $or: [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }] } : {};
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    res.json({ success: true, total, users });
  } catch (error) { next(error); }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

export const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "User deactivated" });
  } catch (error) { next(error); }
};

export const getRevenueChart = async (req, res, next) => {
  try {
    const data = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]);
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

// ── @route  GET /api/admin/analytics ─────────────────────────────────────────
export const getAnalytics = async (req, res, next) => {
  try {
    const { period = "12" } = req.query;
    const months = Math.min(Math.max(parseInt(period) || 12, 1), 24);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      revenueByMonth, revenueByDay,
      salesByCategory, topProducts,
      ordersByStatus, usersByMonth,
      paymentMethods, totalRevenueAgg,
      totalOrders, totalUsers, totalProducts,
    ] = await Promise.all([
      // Monthly revenue
      Order.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 }, avgOrderValue: { $avg: "$totalAmount" } } },
        { $sort: { _id: 1 } }, { $limit: months },
      ]),
      // Daily last 30 days
      Order.aggregate([
        { $match: { isPaid: true, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      // Category sales
      Order.aggregate([
        { $match: { isPaid: true } },
        { $unwind: "$items" },
        { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "p" } },
        { $unwind: { path: "$p", preserveNullAndEmptyArrays: true } },
        { $group: { _id: "$p.category", revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } }, units: { $sum: "$items.qty" } } },
        { $sort: { revenue: -1 } },
      ]),
      // Top products
      Order.aggregate([
        { $match: { isPaid: true } },
        { $unwind: "$items" },
        { $group: { _id: "$items.product", name: { $first: "$items.name" }, revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } }, unitsSold: { $sum: "$items.qty" } } },
        { $sort: { unitsSold: -1 } }, { $limit: 8 },
      ]),
      // Status distribution
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      // Users by month
      User.aggregate([
        { $match: { role: "user" } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }, { $limit: months },
      ]),
      // Payment methods
      Order.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: "$paymentMethod", count: { $sum: 1 }, revenue: { $sum: "$totalAmount" } } },
        { $sort: { count: -1 } },
      ]),
      Order.aggregate([{ $match: { isPaid: true } }, { $group: { _id: null, total: { $sum: "$totalAmount" }, avg: { $avg: "$totalAmount" }, count: { $sum: 1 } } }]),
      Order.countDocuments(),
      User.countDocuments({ role: "user" }),
      Product.countDocuments({ isActive: true }),
    ]);

    const kpiRow = totalRevenueAgg[0] || { total: 0, avg: 0, count: 0 };

    res.json({
      success: true,
      kpis: {
        totalRevenue: kpiRow.total,
        totalOrders,
        totalUsers,
        totalProducts,
        avgOrderValue: Math.round(kpiRow.avg || 0),
      },
      revenueByMonth,
      revenueByDay,
      salesByCategory,
      topProducts,
      ordersByStatus,
      usersByMonth,
      paymentMethods,
    });
  } catch (error) {
    next(error);
  }
};