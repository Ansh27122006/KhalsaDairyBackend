const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");

// Max image size: 2MB as Base64 (~2.7MB raw string) — reject anything larger
// to prevent MongoDB documents from growing too big
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const validateImage = (imageBase64) => {
  if (!imageBase64) return null; // no image is fine
  if (typeof imageBase64 !== "string") return "Image must be a Base64 string";
  if (!imageBase64.startsWith("data:image/")) return "Invalid image format";
  // Rough size check: Base64 string length * 0.75 ≈ actual bytes
  const approxBytes = imageBase64.length * 0.75;
  if (approxBytes > MAX_IMAGE_BYTES) return "Image must be under 2MB";
  return null;
};

// ─── GET /api/products ────────────────────────────────────────────────────────
const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// ─── POST /api/products ───────────────────────────────────────────────────────
const addProduct = asyncHandler(async (req, res) => {
  const { _id, id, imageBase64, ...rest } = req.body;

  const imgError = validateImage(imageBase64);
  if (imgError) {
    return res.status(400).json({ error: "BAD_REQUEST", message: imgError });
  }

  const product = await Product.create({
    ...rest,
    imageBase64: imageBase64 || null,
  });

  res.status(200).json(product);
});

// ─── GET /api/products/:id ────────────────────────────────────────────────────
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res
      .status(404)
      .json({ error: "NOT_FOUND", message: "Product not found" });
  }
  res.json(product);
});

// ─── PUT /api/products/:id ────────────────────────────────────────────────────
const updateProduct = asyncHandler(async (req, res) => {
  const { name, description, price, unit, available, imageBase64 } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({
      error: "NOT_FOUND",
      message: `Product not found with id: ${req.params.id}`,
    });
  }

  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = price;
  if (unit !== undefined) product.unit = unit;
  if (available !== undefined) product.available = available;

  // imageBase64 can be:
  //   - a new Base64 string  → update to new image
  //   - null / ""            → remove image
  //   - undefined            → leave image unchanged
  if (imageBase64 !== undefined) {
    const imgError = validateImage(imageBase64);
    if (imgError) {
      return res.status(400).json({ error: "BAD_REQUEST", message: imgError });
    }
    product.imageBase64 = imageBase64 || null;
  }

  await product.save();
  res.json(product);
});

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return res.status(404).json({
      error: "NOT_FOUND",
      message: `Product not found with id: ${req.params.id}`,
    });
  }
  res.status(204).send();
});

module.exports = {
  getAllProducts,
  addProduct,
  getProductById,
  updateProduct,
  deleteProduct,
};
