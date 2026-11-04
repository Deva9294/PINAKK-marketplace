import {NextRequest,NextResponse} from "next/server";
import {isAdminRequest} from "@/lib/admin-auth";
import {connectToDatabase} from "@/lib/mongodb";
import InvoiceSettings from "@/models/InvoiceSettings";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 if(!(await isAdminRequest(request)))return NextResponse.json({ok:false,error:"Unauthorized"},{status:401});
 try{await connectToDatabase();const s=await InvoiceSettings.findOne({key:"default"}).lean();return NextResponse.json({ok:true,settings:s||{legalName:"PINAKK",gstin:"",address:"",state:"Madhya Pradesh",stateCode:"23",phone:"",email:"",invoicePrefix:"PIN",defaultGstRate:0,pricesIncludeGst:true}})}
 catch(e){console.error("Invoice settings GET:",e);return NextResponse.json({ok:false,error:"Could not load invoice settings"},{status:503})}
}
export async function PUT(request:NextRequest){
 if(!(await isAdminRequest(request)))return NextResponse.json({ok:false,error:"Unauthorized"},{status:401});
 try{const b=await request.json();const s={legalName:String(b.legalName||"").trim(),gstin:String(b.gstin||"").trim().toUpperCase(),address:String(b.address||"").trim(),state:String(b.state||"").trim(),stateCode:String(b.stateCode||"").trim(),phone:String(b.phone||"").trim(),email:String(b.email||"").trim().toLowerCase(),invoicePrefix:String(b.invoicePrefix||"PIN").trim().toUpperCase(),defaultGstRate:Number(b.defaultGstRate),pricesIncludeGst:b.pricesIncludeGst};
 if(!s.legalName||s.legalName.length>160||s.address.length>500||!s.state||s.state.length>100||!/^[0-9]{2}$/.test(s.stateCode)||!/^[A-Z0-9]{0,15}$/.test(s.gstin)||(s.gstin&&s.gstin.length!==15)||!s.invoicePrefix||s.invoicePrefix.length>10||!Number.isFinite(s.defaultGstRate)||s.defaultGstRate<0||s.defaultGstRate>100||typeof s.pricesIncludeGst!=="boolean"||s.email.length>254||s.phone.length>20)return NextResponse.json({ok:false,error:"Check seller, GSTIN, state code and tax settings"},{status:400});
 await connectToDatabase();const settings=await InvoiceSettings.findOneAndUpdate({key:"default"},{$set:s,$setOnInsert:{key:"default"}},{new:true,upsert:true,runValidators:true});return NextResponse.json({ok:true,settings});
 }catch(e){console.error("Invoice settings PUT:",e);return NextResponse.json({ok:false,error:"Could not save invoice settings"},{status:503})}
}
