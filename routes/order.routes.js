const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const {
  placeOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} = require('../controllers/order.controller');

const router = express.Router();

// All order routes require login
router.use(protect);

// ── Customer-accessible ──────────────────────────────────────────────────────
router.post('/', placeOrder);          // any logged-in user can place an order
router.get('/:id', getOrderById);      // user can view a specific order

// ── Admin-only ───────────────────────────────────────────────────────────────
router.get('/',          adminOnly, getAllOrders);        // list ALL orders
router.put('/:id/status', adminOnly, updateOrderStatus); // change status
router.delete('/:id',    adminOnly, deleteOrder);        // delete order

module.exports = router;
