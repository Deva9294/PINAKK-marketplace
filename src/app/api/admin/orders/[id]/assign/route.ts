import mongoose from "mongoose";
import {NextRequest,NextResponse} from "next/server";
import {isAdminRequest} from "@/lib/admin-auth";
import {connectToDatabase} from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User";
export const runtime="nodejs";
export async function PATCH(request:NextRequest,context:{params:Promise<{id:string}>}){
 if(!(await isAdminRequest(request)))return NextResponse.json({ok:false,error:"Unauthorized"},{status:401});
 const {id}=await context.params;
 if(!mongoose.isValidObjectId(id))return NextResponse.json({ok:false,error:"Invalid order ID"},{status:400});
 let body:any;try{body=await request.json()}catch{return NextResponse.json({ok:false,error:"Invalid request"},{status:400})}
 if(typeof body?.deliveryBoyId!=="string"||!mongoose.isValidObjectId(body.deliveryBoyId))return NextResponse.json({ok:false,error:"Valid delivery account is required"},{status:400});
 try{
  await connectToDatabase();
  const [order,staff]=await Promise.all([Order.findById(id),User.findOne({_id:body.deliveryBoyId,role:"delivery",active:true}).select("_id").lean()]);
  if(!order)return NextResponse.json({ok:false,error:"Order not found"},{status:404});
  if(!staff)return NextResponse.json({ok:false,error:"Active delivery account not found"},{status:404});
  if(!["ready","shipped"].includes(order.status))return NextResponse.json({ok:false,error:"Order must be ready for dispatch before assigning delivery"},{status:409});
  order.deliveryBoyId=staff._id;await order.save();
  return NextResponse.json({ok:true,orderNumber:order.orderNumber,deliveryBoyId:String(staff._id)});
 }catch{return NextResponse.json({ok:false,error:"Could not assign delivery"},{status:503})}
}
