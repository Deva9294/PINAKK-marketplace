import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
const InvoiceSettingsSchema = new Schema({
 key:{type:String,default:"default",unique:true,index:true},
 legalName:{type:String,default:"PINAKK",trim:true,maxlength:160},
 gstin:{type:String,default:"",trim:true,uppercase:true,maxlength:15},
 address:{type:String,default:"",trim:true,maxlength:500},
 state:{type:String,default:"Madhya Pradesh",trim:true,maxlength:100},
 stateCode:{type:String,default:"23",trim:true,maxlength:2},
 phone:{type:String,default:"",trim:true,maxlength:20},
 email:{type:String,default:"",trim:true,lowercase:true,maxlength:254},
 invoicePrefix:{type:String,default:"PIN",trim:true,uppercase:true,maxlength:10},
 defaultGstRate:{type:Number,default:0,min:0,max:100},
 pricesIncludeGst:{type:Boolean,default:true},
},{timestamps:true,versionKey:false});
export type InvoiceSettingsDocument=InferSchemaType<typeof InvoiceSettingsSchema>;
const InvoiceSettings=(mongoose.models.InvoiceSettings as Model<InvoiceSettingsDocument>)||mongoose.model<InvoiceSettingsDocument>("InvoiceSettings",InvoiceSettingsSchema);
export default InvoiceSettings;
