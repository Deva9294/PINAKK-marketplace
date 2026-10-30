import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const OrderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  image: { type: String, default: "", maxlength: 2000 },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, max: 20 },
}, { _id: false });

const OrderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true, index: true },
  customer: {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 16 },
    email: { type: String, trim: true, lowercase: true, maxlength: 254 },
  },
  fulfillmentMethod: { type: String, enum: ["pickup", "delivery"], required: true },
  address: {
    line1: { type: String, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    city: { type: String, trim: true, maxlength: 100 },
    state: { type: String, trim: true, maxlength: 100 },
    postalCode: { type: String, trim: true, maxlength: 10 },
  },
  items: { type: [OrderItemSchema], required: true, validate: [(v: unknown[]) => v.length > 0 && v.length <= 20, "Order must contain 1–20 items"] },
  subtotal: { type: Number, required: true, min: 0 },
  deliveryFee: { type: Number, required: true, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["pending", "confirmed", "processing", "ready", "shipped", "delivered", "cancelled"], default: "pending", index: true },
  paymentStatus: { type: String, enum: ["unpaid", "paid", "refunded"], default: "unpaid" },
  paymentMethod: { type: String, enum: ["pay-at-store", "cash-on-delivery"], default: "pay-at-store" },
  customerNote: { type: String, trim: true, maxlength: 500 },
}, { timestamps: true, versionKey: false });

OrderSchema.index({ "customer.phone": 1, createdAt: -1 });
export type OrderDocument = InferSchemaType<typeof OrderSchema>;
const Order = (mongoose.models.Order as Model<OrderDocument>) || mongoose.model<OrderDocument>("Order", OrderSchema);
export default Order;
