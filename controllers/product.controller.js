const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');

// ─── GET /api/products ────────────────────────────────────────────────────────
const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// ─── POST /api/products ───────────────────────────────────────────────────────
// Mirrors ProductServiceImpl.saveProduct
// If body contains an id, it delegates to update (same as Java code)
const addProduct = asyncHandler(async (req, res) => {
  const { _id, id, ...productData } = req.body;

  // If an id was sent, treat it as an update (mirrors Java saveProduct logic)
  if (_id || id) {
    const productId = _id || id;
    const existing = await Product.findById(productId);
    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found' });
    }
    Object.assign(existing, productData);
    await existing.save();
    return res.json(existing);
  }

  const product = await Product.create(productData);
  res.status(200).json(product);
});

// ─── GET /api/products/:id ────────────────────────────────────────────────────
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found' });
  }
  res.json(product);
});

// ─── PUT /api/products/:id ────────────────────────────────────────────────────
// Mirrors ProductServiceImpl.updateProduct — updates all fields
const updateProduct = asyncHandler(async (req, res) => {
  const { name, description, price, unit, available } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: `Product not found with id: ${req.params.id}`,
    });
  }

  if (name        !== undefined) product.name        = name;
  if (description !== undefined) product.description = description;
  if (price       !== undefined) product.price       = price;
  if (unit        !== undefined) product.unit        = unit;
  if (available   !== undefined) product.available   = available;

  await product.save();
  res.json(product);
});

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: `Product not found with id: ${req.params.id}`,
    });
  }
  res.status(200).send();
});

module.exports = {
  getAllProducts,
  addProduct,
  getProductById,
  updateProduct,
  deleteProduct,
};
