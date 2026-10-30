import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ProductSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 180 },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  image: { type: String, default: "" },
  stock: { type: Number, required: true, default: 0, min: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });

export type ProductDocument = InferSchemaType<typeof ProductSchema>;
const Product = (mongoose.models.Product as Model<ProductDocument>) ||
  mongoose.model<ProductDocument>("Product", ProductSchema);
export default Product;
