import mongoose from "mongoose";
import {NextRequest,NextResponse} from "next/server";
import {connectToDatabase} from "@/lib/mongodb";
import {readUserSession} from "@/lib/user-auth";
import {isAdminRequest} from "@/lib/admin-auth";
import Order from "@/models/Order";
import InvoiceSettings from "@/models/InvoiceSettings";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const clean=(v:unknown)=>String(v??"").normalize("NFKD").replace(/[^\x20-\x7E]/g," ").replace(/[()\\]/g,"\\$&").slice(0,180);
function makePdf(lines:string[]){
 const commands=["BT","/F1 9 Tf","48 790 Td","14 TL"];
 lines.slice(0,50).forEach((line,i)=>{if(i)commands.push("T*");commands.push("("+clean(line)+") Tj")});
 commands.push("ET");const stream=commands.join("\n");
 const objects=["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [3 0 R] /Count 1 >>","<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>","<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>","<< /Length "+Buffer.byteLength(stream)+" >>\nstream\n"+stream+"\nendstream"];
 let pdf="%PDF-1.4\n";const offsets=[0];for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(pdf));pdf+=(i+1)+" 0 obj\n"+objects[i]+"\nendobj\n"}
 const xref=Buffer.byteLength(pdf);pdf+="xref\n0 "+(objects.length+1)+"\n0000000000 65535 f \n";for(let i=1;i<offsets.length;i++)pdf+=String(offsets[i]).padStart(10,"0")+" 00000 n \n";
 pdf+="trailer\n<< /Size "+(objects.length+1)+" /Root 1 0 R >>\nstartxref\n"+xref+"\n%%EOF";return Buffer.from(pdf,"binary");
}
export async function GET(request:NextRequest,context:{params:Promise<{id:string}>}){
 const session=await readUserSession(request);const admin=await isAdminRequest(request);
 if(!admin&&(!session||session.role!=="customer"))return NextResponse.json({ok:false,error:"Please sign in"},{status:401});
 const {id}=await context.params;if(!mongoose.isValidObjectId(id))return NextResponse.json({ok:false,error:"Invalid order"},{status:400});
 try{
  await connectToDatabase();const filter:any={_id:id};if(!admin)filter.customerUserId=session!.id;
  const order=await Order.findOne(filter).lean();if(!order)return NextResponse.json({ok:false,error:"Order not found"},{status:404});
  const settings=await InvoiceSettings.findOne({key:"default"}).lean()||{legalName:"PINAKK",gstin:"",address:"",state:"Madhya Pradesh",stateCode:"23",phone:"",email:"",invoicePrefix:"PIN",defaultGstRate:0,pricesIncludeGst:true};
  const invoiceNo=(order as any).invoiceNumber||settings.invoicePrefix+"-"+new Date(order.createdAt).getFullYear()+"-"+String(order.orderNumber).slice(-8);
  if(!(order as any).invoiceNumber)await Order.updateOne({_id:id,invoiceNumber:{$exists:false}},{$set:{invoiceNumber:invoiceNo}});
  const sameState=String(order.address?.state||"").trim().toLowerCase()===String(settings.state||"").trim().toLowerCase();
  let taxable=0,cgst=0,sgst=0,igst=0;
  const lines=["TAX INVOICE",settings.legalName||"PINAKK",settings.address||"Seller address not configured","GSTIN: "+(settings.gstin||"Not configured"),"State: "+settings.state+"  Code: "+settings.stateCode,"Invoice: "+invoiceNo,"Date: "+new Date(order.createdAt).toLocaleDateString("en-IN"),"","BILL TO",order.customer?.name||"Customer",order.customer?.phone||"",order.customer?.email||"",order.fulfillmentMethod==="delivery"?(order.address?.line1||""):"Store pickup",order.fulfillmentMethod==="delivery"?((order.address?.city||"")+", "+(order.address?.state||"")+" - "+(order.address?.postalCode||"")):"","", "ITEM | QTY | RATE | TAXABLE | HSN | GST"];
  for(const item of order.items){
   const rate=Number((item as any).gstRate??settings.defaultGstRate??0);const gross=Number(item.unitPrice)*Number(item.quantity);const share=order.subtotal>0?Number(order.discount||0)*gross/Number(order.subtotal):0;const net=Math.max(0,gross-share);
   const base=settings.pricesIncludeGst?net/(1+rate/100):net;const tax=settings.pricesIncludeGst?net-base:base*rate/100;
   taxable+=base;if(sameState){cgst+=tax/2;sgst+=tax/2}else igst+=tax;
   lines.push(item.name+" | "+item.quantity+" | INR "+Number(item.unitPrice).toFixed(2)+" | "+base.toFixed(2)+" | "+((item as any).hsnCode||"-")+" | "+rate+"%");
  }
  const delivery=Number(order.deliveryFee||0);const grand=Number(order.total||0)+(settings.pricesIncludeGst?0:cgst+sgst+igst);
  lines.push("","TAX SUMMARY","Taxable value: INR "+taxable.toFixed(2),"CGST: INR "+cgst.toFixed(2),"SGST: INR "+sgst.toFixed(2),"IGST: INR "+igst.toFixed(2),"Delivery fee: INR "+delivery.toFixed(2),"Discount: INR "+Number(order.discount||0).toFixed(2),"TOTAL: INR "+grand.toFixed(2),"","Order: "+order.orderNumber+" | Payment: "+order.paymentStatus,"Seller GSTIN: "+(settings.gstin||"Not configured"),"Verify GST registration, HSN and tax applicability before issuing.");
  const pdf=makePdf(lines);return new NextResponse(new Uint8Array(pdf),{status:200,headers:{"Content-Type":"application/pdf","Content-Disposition":'attachment; filename="PINAKK-'+invoiceNo.replace(/[^A-Za-z0-9-]/g,"-")+'.pdf"',"Cache-Control":"private, no-store"}});
 }catch(e){console.error("Invoice generation failed:",e);return NextResponse.json({ok:false,error:"Could not generate invoice"},{status:503})}
}
