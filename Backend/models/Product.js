const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
  },
  {
    timestamps: true, // auto-manages createdAt and updatedAt
  }
);

// Global cursor pagination: sort all products by updatedAt DESC, _id DESC as tie-breaker
productSchema.index({ updatedAt: -1, _id: -1 });

// Category-filtered cursor pagination: equality on category first (ESR rule), then sort keys
productSchema.index({ category: 1, updatedAt: -1, _id: -1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
