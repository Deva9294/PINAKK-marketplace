import mongoose from "mongoose";
import {NextRequest,NextResponse} from "next/server";
import {connectToDatabase} from "@/lib/mongodb";
import {readUserSession} from "@/lib/user-auth";
import Order from "@/models/Order";
export const runtime="nodejs";
export async function PATCH(request:NextRequest,context:{params:Promise<{id:string}>}){
 const session=await readUserSession(request);
 if(!session||session.role!=="delivery")return NextResponse.json({ok:false,error:"Delivery account required"},{status:401});
 const {id}=await context.params;
 if(!mongoose.isValidObjectId(id))return NextResponse.json({ok:false,error:"Invalid order"},{status:400});
 let body:any;try{body=await request.json()}catch{return NextResponse.json({ok:false,error:"Invalid request"},{status:400})}
 if(!["shipped","delivered"].includes(body?.status))return NextResponse.json({ok:false,error:"Invalid delivery status"},{status:400});
 try{
  await connectToDatabase();
  const order=await Order.findOne({_id:id,deliveryBoyId:session.id});
  if(!order)return NextResponse.json({ok:false,error:"Delivery not assigned to this account"},{status:404});
  const allowed:Record<string,string[]>={ready:["shipped"],shipped:["delivered"]};
  if(!allowed[order.status]?.includes(body.status))return NextResponse.json({ok:false,error:"This delivery update is not allowed"},{status:409});
  order.status=body.status;await order.save();
  return NextResponse.json({ok:true,status:order.status});
 }catch{return NextResponse.json({ok:false,error:"Could not update delivery"},{status:503})}
}
