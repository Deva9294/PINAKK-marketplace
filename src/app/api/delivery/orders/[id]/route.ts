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
  const current=await Order.findOne({_id:id,deliveryBoyId:session.id}).select("status paymentMethod").lean();
  if(!current)return NextResponse.json({ok:false,error:"Delivery not assigned to this account"},{status:404});
  const allowed:Record<string,string[]>={ready:["shipped"],shipped:["delivered"]};
  if(!allowed[current.status]?.includes(body.status))return NextResponse.json({ok:false,error:"This delivery update is not allowed"},{status:409});
  if(body.status==="delivered"&&current.paymentMethod==="cash-on-delivery"&&body.cashCollected!==true)return NextResponse.json({ok:false,error:"Confirm that the COD cash has been collected before completing delivery."},{status:400});
  const update:any={status:body.status};
  if(body.status==="delivered"&&current.paymentMethod==="cash-on-delivery")update.paymentStatus="paid";
  const updated=await Order.findOneAndUpdate(
   {_id:id,deliveryBoyId:session.id,status:current.status},
   {$set:update},
   {new:true,runValidators:true}
  ).select("status").lean();
  if(!updated)return NextResponse.json({ok:false,error:"Delivery status changed in another session. Refresh your assigned orders."},{status:409});
  return NextResponse.json({ok:true,status:updated.status});
 }catch{return NextResponse.json({ok:false,error:"Could not update delivery"},{status:503})}
}
