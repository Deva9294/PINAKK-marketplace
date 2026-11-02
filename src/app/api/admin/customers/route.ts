import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Order from "@/models/Order";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 if(!(await isAdminRequest(request)))return NextResponse.json({ok:false,error:"Unauthorized"},{status:401});
 try{
  await connectToDatabase();
  const q=request.nextUrl.searchParams.get("q")?.trim().slice(0,80)||"";
  const filter:any={role:"customer"};
  if(q){const escaped=q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");filter.$or=[{name:{$regex:escaped,$options:"i"}},{phone:{$regex:escaped,$options:"i"}},{email:{$regex:escaped,$options:"i"}}]}
  const users=await User.find(filter).select("name phone email active createdAt").sort({createdAt:-1}).limit(200).lean();
  const phones=users.map((u:any)=>u.phone);
  const counts=await Order.aggregate([{$match:{"customer.phone":{$in:phones}}},{$group:{_id:"$customer.phone",orders:{$sum:1},spent:{$sum:{$cond:[{$ne:["$status","cancelled"]},"$total",0]}}}}]);
  const stats=new Map(counts.map((x:any)=>[x._id,{orders:x.orders,spent:x.spent}]));
  return NextResponse.json({ok:true,customers:users.map((u:any)=>({...u,stats:stats.get(u.phone)||{orders:0,spent:0}}))});
 }catch(error){console.error("GET /api/admin/customers failed:",error);return NextResponse.json({ok:false,error:"Could not load customers"},{status:503})}
}
