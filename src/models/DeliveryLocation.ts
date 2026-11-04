import mongoose, { Schema, type Model } from "mongoose";

const PointSchema = new Schema({
  lat: { type: Number, required: true, min: -90, max: 90 },
  lng: { type: Number, required: true, min: -180, max: 180 },
  recordedAt: { type: Date, required: true, default: Date.now },
}, { _id: false });

const DeliveryLocationSchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true, index: true },
  deliveryBoyId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  lat: { type: Number, required: true, min: -90, max: 90 },
  lng: { type: Number, required: true, min: -180, max: 180 },
  accuracy: { type: Number, min: 0, max: 100000 },
  heading: { type: Number, min: 0, max: 360 },
  speed: { type: Number, min: 0, max: 1000 },
  updatedAt: { type: Date, required: true, default: Date.now },
  history: { type: [PointSchema], default: [] },
}, { timestamps: true, versionKey: false });

DeliveryLocationSchema.index({ orderId: 1, deliveryBoyId: 1 }, { unique: true });
const DeliveryLocation = (mongoose.models.DeliveryLocation as Model<any>) || mongoose.model("DeliveryLocation", DeliveryLocationSchema);
export default DeliveryLocation;
