import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const CouponSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 32, index: true },
  description: { type: String, trim: true, maxlength: 180, default: "" },
  discountType: { type: String, enum: ["percentage", "fixed"], required: true },
  discountValue: { type: Number, required: true, min: 1 },
  minSubtotal: { type: Number, default: 0, min: 0 },
  maxDiscount: { type: Number, default: 0, min: 0 },
  usageLimit: { type: Number, default: 0, min: 0 },
  usedCount: { type: Number, default: 0, min: 0 },
  startsAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true, versionKey: false });

export type CouponDocument = InferSchemaType<typeof CouponSchema>;
const Coupon = (mongoose.models.Coupon as Model<CouponDocument>) || mongoose.model<CouponDocument>("Coupon", CouponSchema);
export default Coupon;
