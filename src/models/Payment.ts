import mongoose, { Schema, type Model } from "mongoose";

const PaymentSchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
  orderNumber: { type: String, required: true, trim: true, index: true },
  customerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  provider: { type: String, enum: ["razorpay"], default: "razorpay" },
  razorpayOrderId: { type: String, required: true, unique: true, index: true },
  razorpayPaymentId: { type: String, default: "", index: true },
  signature: { type: String, default: "" },
  amount: { type: Number, required: true, min: 1 },
  currency: { type: String, enum: ["INR"], default: "INR" },
  status: { type: String, enum: ["created", "paid", "failed"], default: "created", index: true },
}, { timestamps: true, versionKey: false });

const Payment = (mongoose.models.Payment as Model<any>) || mongoose.model("Payment", PaymentSchema);
export default Payment;
