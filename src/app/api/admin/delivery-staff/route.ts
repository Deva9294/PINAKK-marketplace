import {NextRequest,NextResponse} from "next/server";
import {connectToDatabase} from "@/lib/mongodb";
import {isAdminRequest} from "@/lib/admin-auth";
import {hashPassword} from "@/lib/user-auth";
import User from "@/models/User";
export const runtime="nodejs";
export async function GET(request:NextRequest){
 if(!(await isAdminRequest(request)))return NextResponse.json({ok:false,error:"Unauthorized"},{status:401});
 try{await connectToDatabase();const staff=await User.find({role:"delivery"}).select("name phone email active createdAt").sort({createdAt:-1}).lean();return NextResponse.json({ok:true,staff})}
 catch{return NextResponse.json({ok:false,error:"Could not load delivery staff"},{status:503})}
}
export async function POST(request:NextRequest){
 if(!(await isAdminRequest(request)))return NextResponse.json({ok:false,error:"Unauthorized"},{status:401});
 let body:any;try{body=await request.json()}catch{return NextResponse.json({ok:false,error:"Invalid request"},{status:400})}
 const name=typeof body?.name==="string"?body.name.trim():"",phone=typeof body?.phone==="string"?body.phone.replace(/[\s-]/g,""):"",password=typeof body?.password==="string"?body.password:"";
 if(name.length<2||name.length>100||! /^(?:\+91)?[6-9]\d{9}$/.test(phone)||password.length<10||password.length>128)return NextResponse.json({ok:false,error:"Name, valid mobile and password (10+ characters) are required"},{status:400});
 try{await connectToDatabase();if(await User.findOne({phone}).lean())return NextResponse.json({ok:false,error:"Mobile number already registered"},{status:409});const user=await User.create({name,phone,passwordHash:await hashPassword(password),role:"delivery"});return NextResponse.json({ok:true,staff:{id:user.id,name:user.name,phone:user.phone,role:user.role}},{status:201})}
 catch{return NextResponse.json({ok:false,error:"Could not create delivery account"},{status:503})}
}
