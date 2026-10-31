import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ProductSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 160, index: "text" },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 180 },
  sku: { type: String, trim: true, uppercase: true, maxlength: 80, sparse: true, unique: true },
  category: { type: String, required: true, trim: true, maxlength: 80, index: true },
  subcategory: { type: String, trim: true, maxlength: 100, default: "" },
  brand: { type: String, trim: true, maxlength: 100, default: "", index: true },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  image: { type: String, default: "" },
  images: { type: [String], default: [] },
  specifications: { type: Map, of: String, default: {} },
  tags: { type: [String], default: [] },
  stock: { type: Number, required: true, default: 0, min: 0 },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true, versionKey: false });

ProductSchema.index({ active: 1, category: 1, createdAt: -1 });
ProductSchema.index({ active: 1, price: 1 });
ProductSchema.index({ active: 1, brand: 1 });

export type ProductDocument = InferSchemaType<typeof ProductSchema>;
const Product = (mongoose.models.Product as Model<ProductDocument>) ||
  mongoose.model<ProductDocument>("Product", ProductSchema);
export default Product;
