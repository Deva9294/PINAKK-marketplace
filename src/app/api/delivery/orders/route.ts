import {NextRequest,NextResponse} from "next/server";
import {connectToDatabase} from "@/lib/mongodb";
import {readUserSession} from "@/lib/user-auth";
import Order from "@/models/Order";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const session=await readUserSession(request);
 if(!session||session.role!=="delivery")return NextResponse.json({ok:false,error:"Delivery account required"},{status:401});
 try{await connectToDatabase();const orders=await Order.find({deliveryBoyId:session.id,status:{$in:["ready","shipped","delivered"]}}).sort({updatedAt:-1}).limit(100).lean();return NextResponse.json({ok:true,orders})}
 catch{return NextResponse.json({ok:false,error:"Could not load deliveries"},{status:503})}
}
