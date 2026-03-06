const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    unit: {
      type: String,
      trim: true, // e.g. "litre", "kg", "500ml"
    },
    available: {
      type: Boolean,
      default: true,
    },
    imageBase64: { type: String, default: null },
  },
  {
    timestamps: false, // Product entity in Java had no timestamps
  }
);

module.exports = mongoose.model("Product", productSchema);
