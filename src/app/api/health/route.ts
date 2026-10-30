import {NextResponse} from "next/server";export async function GET(){return NextResponse.json({ok:true,app:"PINAKK Marketplace",status:"starter-scaffold",timestamp:new Date().toISOString()})}
