import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const CategorySchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80, unique: true },
  slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 100, unique: true },
  description: { type: String, trim: true, maxlength: 1000, default: "" },
  image: { type: String, trim: true, maxlength: 2000, default: "" },
  icon: { type: String, trim: true, maxlength: 60, default: "package" },
  subcategories: { type: [String], default: [] },
  items: { type: [String], default: [] },
  courseOptions: { type: Schema.Types.Mixed, default: undefined },
  customPricing: { type: Schema.Types.Mixed, default: undefined },
  filters: { type: [String], default: [] },
  seoTitle: { type: String, trim: true, maxlength: 180, default: "" },
  seoDescription: { type: String, trim: true, maxlength: 320, default: "" },
  active: { type: Boolean, default: true, index: true },
  displayOrder: { type: Number, default: 0, min: 0 }
}, { timestamps: true, versionKey: false });

CategorySchema.index({ active: 1, displayOrder: 1 });
export type CategoryDocument = InferSchemaType<typeof CategorySchema>;
const Category = (mongoose.models.Category as Model<CategoryDocument>) ||
  mongoose.model<CategoryDocument>("Category", CategorySchema);
export default Category;
