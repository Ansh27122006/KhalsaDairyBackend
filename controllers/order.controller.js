const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');

// ─── POST /api/orders ─────────────────────────────────────────────────────────
// Mirrors OrderServiceImpl.placeOrder
// Items arrive as [{ productId, quantity }] — stored as subdocuments (not raw JSON)
const placeOrder = asyncHandler(async (req, res) => {
  const { customerName, phone, address, items, total } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: 'Order must contain at least one item',
    });
  }

  const order = await Order.create({
    customerName,
    phone,
    address,
    items,   // stored as proper subdocument array in MongoDB
    total,
    status: 'PENDING',
  });

  res.status(200).json(order);
});

// ─── GET /api/orders ──────────────────────────────────────────────────────────
// Mirrors: findAllByOrderByCreatedAtDesc
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found' });
  }
  res.json(order);
});

// ─── PUT /api/orders/:id/status ───────────────────────────────────────────────
// Body: { "status": "CONFIRMED" }
// Mirrors: OrderServiceImpl.updateOrderStatus
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const validStatuses = ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'];
  if (!validStatuses.includes(status?.toUpperCase())) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: `Status must be one of: ${validStatuses.join(', ')}`,
    });
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found' });
  }

  order.status = status.toUpperCase();
  await order.save(); // triggers updatedAt via timestamps

  res.json(order);
});

// ─── DELETE /api/orders/:id ───────────────────────────────────────────────────
const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Order not found' });
  }
  res.status(204).send();
});

module.exports = {
  placeOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
};
