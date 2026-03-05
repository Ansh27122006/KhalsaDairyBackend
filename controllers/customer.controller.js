const User  = require('../models/User');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');

// ─── GET /api/customers ───────────────────────────────────────────────────────
const getAllCustomers = asyncHandler(async (req, res) => {
  const customers = await User.find().sort({ createdAt: -1 });
  res.json(customers);
});

// ─── GET /api/customers/:id ───────────────────────────────────────────────────
const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await User.findById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Customer not found' });
  }
  res.json(customer);
});

// ─── GET /api/customers/:id/orders ───────────────────────────────────────────
// Mirrors CustomerServiceImpl.getCustomerOrders — looks up user then finds
// orders by phone number (same join strategy as the Java code)
const getCustomerOrders = asyncHandler(async (req, res) => {
  const customer = await User.findById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Customer not found' });
  }
  const orders = await Order.find({ phone: customer.phone }).sort({ createdAt: -1 });
  res.json(orders);
});

// ─── GET /api/customers/search?query= ────────────────────────────────────────
// Mirrors: findByNameContainingIgnoreCaseOrPhoneContaining
const searchCustomers = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'query param is required' });
  }
  const regex = new RegExp(query, 'i'); // case-insensitive, mirrors IgnoreCase
  const customers = await User.find({
    $or: [{ name: regex }, { phone: regex }],
  });
  res.json(customers);
});

// ─── DELETE /api/customers/:id ────────────────────────────────────────────────
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await User.findByIdAndDelete(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Customer not found' });
  }
  res.status(204).send();
});

// ─── PUT /api/customers/:id/toggle-active ─────────────────────────────────────
const toggleActive = asyncHandler(async (req, res) => {
  const customer = await User.findById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Customer not found' });
  }
  customer.isActive = !customer.isActive;
  await customer.save();
  res.json(customer);
});

module.exports = {
  getAllCustomers,
  getCustomerById,
  getCustomerOrders,
  searchCustomers,
  deleteCustomer,
  toggleActive,
};
