import mongoose, { Schema, type Model } from "mongoose";

const StockMovementSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  productName: { type: String, required: true, trim: true, maxlength: 160 },
  type: { type: String, enum: ["restock", "sale", "adjustment", "order_rollback"], required: true, index: true },
  quantity: { type: Number, required: true },
  beforeStock: { type: Number, required: true, min: 0 },
  afterStock: { type: Number, required: true, min: 0 },
  reference: { type: String, trim: true, maxlength: 80, default: "" },
  note: { type: String, trim: true, maxlength: 300, default: "" },
}, { timestamps: true, versionKey: false });
StockMovementSchema.index({ createdAt: -1 });
const StockMovement = (mongoose.models.StockMovement as Model<any>) || mongoose.model("StockMovement", StockMovementSchema);
export default StockMovement;
