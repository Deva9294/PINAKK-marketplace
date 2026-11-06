import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const VariantSchema = new Schema({
  sku: { type: String, trim: true, uppercase: true, maxlength: 80, sparse: true },
  attributes: { type: Map, of: String, default: {} },
  price: { type: Number, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  stock: { type: Number, min: 0, default: 0 },
  image: { type: String, maxlength: 2000, default: "" },
  active: { type: Boolean, default: true }
}, { _id: true });

const ProductSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 160, index: "text" },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 180 },
  sku: { type: String, trim: true, uppercase: true, maxlength: 80, sparse: true, unique: true },\n  barcode: { type: String, trim: true, maxlength: 100, sparse: true },
  category: { type: String, required: true, trim: true, maxlength: 80, index: true },
  subcategory: { type: String, trim: true, maxlength: 100, default: "" },
  brand: { type: String, trim: true, maxlength: 100, default: "", index: true },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  price: { type: Number, required: true, min: 0 },
  gstRate: { type: Number, min: 0, max: 100 },
  hsnCode: { type: String, trim: true, maxlength: 8, default: "" },
  compareAtPrice: { type: Number, min: 0 },
  image: { type: String, default: "" },
  images: { type: [String], default: [] },
  specifications: { type: Map, of: String, default: {} },\n  variants: { type: [VariantSchema], default: [] },\n  weight: { type: Number, min: 0 },\n  size: { type: String, trim: true, maxlength: 100, default: "" },\n  colour: { type: String, trim: true, maxlength: 80, default: "" },\n  gsm: { type: Number, min: 0 },\n  material: { type: String, trim: true, maxlength: 100, default: "" },\n  lowStockThreshold: { type: Number, min: 0, default: 5 },\n  customDimensions: { enabled: { type: Boolean, default: false }, unit: { type: String, enum: ["sq ft", "sq m"], default: "sq ft" }, pricePerUnit: { type: Number, min: 0 } },\n  schoolCourse: { board: String, className: String, medium: String, stream: String, session: String, subject: String, bookType: String, publisher: String, isbn: String, edition: String, language: String, verifiedOfficial: { type: Boolean, default: false } },\n  seoTitle: { type: String, maxlength: 180, default: "" },\n  seoDescription: { type: String, maxlength: 320, default: "" },
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
