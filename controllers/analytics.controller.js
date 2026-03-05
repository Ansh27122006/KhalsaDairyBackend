const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const revenueInRange = async (start, end) => {
  const result = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: null, total: { $sum: "$total" } } },
  ]);
  return result[0]?.total ?? 0;
};

// ─── GET /api/analytics/dashboard ────────────────────────────────────────────
// Mirrors AnalyticsServiceImpl.getDashboardStats
const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const today = startOfToday();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  // Run all DB queries in parallel for performance
  const [
    totalOrders,
    pendingOrders,
    deliveredOrders,
    totalCustomers,
    totalRevenueResult,
    todayRevenue,
    weekRevenue,
    monthRevenue,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: "PENDING" }),
    Order.countDocuments({ status: "DELIVERED" }),
    User.countDocuments({ role: "user" }),
    Order.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]),
    revenueInRange(today, now),
    revenueInRange(weekAgo, now),
    revenueInRange(monthAgo, now),
  ]);

  res.json({
    totalOrders,
    pendingOrders,
    deliveredOrders,
    totalCustomers,
    totalRevenue: totalRevenueResult[0]?.total ?? 0,
    todayRevenue,
    weekRevenue,
    monthRevenue,
  });
});

// ─── GET /api/analytics/sales?period=TODAY ────────────────────────────────────
// Mirrors AnalyticsServiceImpl.getSalesReport
// Also IMPLEMENTS the popular products section that was a TODO in the Java code,
// using MongoDB aggregation on the items subdocument array.
const getSalesReport = asyncHandler(async (req, res) => {
  const period = (req.query.period || "TODAY").toUpperCase();
  const now = new Date();
  let startDate;

  switch (period) {
    case "WEEK":
      startDate = new Date(startOfToday());
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "MONTH":
      startDate = new Date(startOfToday());
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "TODAY":
    default:
      startDate = startOfToday();
  }

  const dateFilter = { createdAt: { $gte: startDate, $lte: now } };

  // Revenue + order count
  const [revenueResult, totalOrders] = await Promise.all([
    Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.countDocuments(dateFilter),
  ]);

  // ── Popular products (was a TODO in Java — now fully implemented) ───────────
  // Unwind items array, group by productId, sum quantities, look up product names
  const popularProductsAgg = await Order.aggregate([
    { $match: dateFilter },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        totalQuantity: { $sum: "$items.quantity" },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        name: { $ifNull: ["$product.name", "Unknown Product"] },
        totalQuantity: 1,
      },
    },
  ]);

  // Convert to { productName: quantity } map — same shape as Java SalesReportDTO
  const popularProducts = popularProductsAgg.reduce((acc, item) => {
    acc[item.name] = item.totalQuantity;
    return acc;
  }, {});

  res.json({
    period,
    totalSales: revenueResult[0]?.total ?? 0,
    totalOrders,
    popularProducts,
  });
});

module.exports = { getDashboardStats, getSalesReport };
