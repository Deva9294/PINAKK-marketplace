import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ShippingZoneSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  pincodes: { type: [String], required: true, validate: [(v: string[]) => v.length > 0 && v.every(x => /^\d{6}$/.test(x)), "Enter valid 6-digit PIN codes"] },
  fee: { type: Number, required: true, min: 0 },
  freeAbove: { type: Number, default: 0, min: 0 },
  active: { type: Boolean, default: true },
}, { _id: true });

const ShippingSettingsSchema = new Schema({
  key: { type: String, default: "default", unique: true, index: true },
  defaultEnabled: { type: Boolean, default: true },
  defaultFee: { type: Number, default: 0, min: 0 },
  defaultFreeAbove: { type: Number, default: 0, min: 0 },
  zones: { type: [ShippingZoneSchema], default: [] },
}, { timestamps: true, versionKey: false });

export type ShippingSettingsDocument = InferSchemaType<typeof ShippingSettingsSchema>;
const ShippingSettings = (mongoose.models.ShippingSettings as Model<ShippingSettingsDocument>) || mongoose.model<ShippingSettingsDocument>("ShippingSettings", ShippingSettingsSchema);
export default ShippingSettings;
