import mongoose, { Schema, type Model } from "mongoose";

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, trim: true, lowercase: true, maxlength: 254, sparse: true, unique: true },
  phone: { type: String, required: true, trim: true, unique: true, maxlength: 16 },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["customer", "delivery"], default: "customer", index: true },
  active: { type: Boolean, default: true },
  addresses: [{ label: String, line1: String, line2: String, city: String, state: String, postalCode: String, isDefault: Boolean }],
}, { timestamps: true, versionKey: false });

const User = (mongoose.models.User as Model<any>) || mongoose.model("User", UserSchema);
export default User;
