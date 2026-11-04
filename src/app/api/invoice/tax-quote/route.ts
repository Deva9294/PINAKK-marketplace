import mongoose from "mongoose";
import {NextRequest,NextResponse} from "next/server";
import {connectToDatabase} from "@/lib/mongodb";
import {readUserSession} from "@/lib/user-auth";
import Product from "@/models/Product";
import InvoiceSettings from "@/models/InvoiceSettings";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 const session=await readUserSession(request);
 if(!session||session.role!=="customer")return NextResponse.json({ok:false,error:"Sign in to calculate invoice taxes"},{status:401});
 try{
  const body=await request.json();if(!Array.isArray(body.items)||body.items.length<1||body.items.length>20)return NextResponse.json({ok:false,error:"Invalid cart"},{status:400});
  const ids=body.items.map((x:any)=>String(x.productId||""));
  if(ids.some((id:string)=>!mongoose.isValidObjectId(id)))return NextResponse.json({ok:false,error:"Invalid product"},{status:400});
  const products=await Product.find({_id:{$in:ids},active:true}).lean();if(products.length!==new Set(ids).size)return NextResponse.json({ok:false,error:"A product is unavailable"},{status:409});
  const qty=new Map<string,number>();for(const x of body.items){const q=Number(x.quantity);if(!Number.isInteger(q)||q<1||q>20)return NextResponse.json({ok:false,error:"Invalid quantity"},{status:400});qty.set(String(x.productId),(qty.get(String(x.productId))||0)+q)}
  const settings=await InvoiceSettings.findOne({key:"default"}).lean()||{defaultGstRate:0,pricesIncludeGst:true,stateCode:"23"};
  const subtotal=products.reduce((sum,p)=>sum+p.price*(qty.get(String(p._id))||0),0);
  const discount=Math.max(0,Math.min(subtotal,Number(body.discount)||0));
  let taxTotal=0,taxableValue=0;
  const breakdown=products.map(p=>{const gross=p.price*(qty.get(String(p._id))||0);const net=Math.max(0,gross-discount*gross/Math.max(subtotal,1));const rate=Number((p as any).gstRate??settings.defaultGstRate??0);const taxable=settings.pricesIncludeGst?net/(1+rate/100):net;const tax=settings.pricesIncludeGst?net-taxable:taxable*rate/100;taxableValue+=taxable;taxTotal+=tax;return {productId:String(p._id),quantity:qty.get(String(p._id))||0,hsnCode:(p as any).hsnCode||"",gstRate:rate,taxableValue:Math.round(taxable*100)/100,taxAmount:Math.round(tax*100)/100}});
  return NextResponse.json({ok:true,taxableValue:Math.round(taxableValue*100)/100,taxTotal:Math.round(taxTotal*100)/100,pricesIncludeGst:settings.pricesIncludeGst,breakdown});
 }catch(e){console.error("GST quote failed:",e);return NextResponse.json({ok:false,error:"Could not calculate GST"},{status:503})}
}
