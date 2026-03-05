const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAllCustomers,
  getCustomerById,
  getCustomerOrders,
  searchCustomers,
  deleteCustomer,
  toggleActive,
} = require('../controllers/customer.controller');

const router = express.Router();

// All customer management is admin-only
router.use(protect, adminOnly);

router.get('/', getAllCustomers);
router.get('/search', searchCustomers);       // must be before /:id
router.get('/:id', getCustomerById);
router.get('/:id/orders', getCustomerOrders);
router.delete('/:id', deleteCustomer);
router.put('/:id/toggle-active', toggleActive);

module.exports = router;
