const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAllProducts,
  addProduct,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller');

const router = express.Router();

// ── Public (any logged-in user — mobile app needs these) ──────────────────────
router.get('/',    protect, getAllProducts);
router.get('/:id', protect, getProductById);

// ── Admin-only (create / update / delete) ─────────────────────────────────────
router.post('/',       protect, adminOnly, addProduct);
router.put('/:id',    protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
