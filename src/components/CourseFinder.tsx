"use client";
import Link from "next/link";
import { useState } from "react";
import { schoolCourseOptions } from "@/lib/catalogue";

type Book = { _id:string; name:string; price:number; image?:string; stock:number; subcategory?:string; schoolCourse?:{subject?:string;className?:string;publisher?:string;bookType?:string} };
const options=schoolCourseOptions;
export default function CourseFinder(){
 const [board,setBoard]=useState("MP Board"),[className,setClassName]=useState("Class 10"),[medium,setMedium]=useState("Hindi"),[stream,setStream]=useState(""),[session,setSession]=useState("2026-27"),[subject,setSubject]=useState("");
 const [books,setBooks]=useState<Book[]>([]),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 const senior=className==="Class 11"||className==="Class 12";
 async function findBooks(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");setMessage("");try{const params=new URLSearchParams({category:"School Courses & Books",board,className,medium,session});if(senior&&stream)params.set("stream",stream);if(subject)params.set("subject",subject);const r=await fetch("/api/products?"+params.toString(),{cache:"no-store"});const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||"Books could not be loaded");setBooks(d.products||[]);if(!(d.products||[]).length)setMessage("Is course selection ke liye abhi koi verified book listed nahi hai.");}catch(e){setError(e instanceof Error?e.message:"Course search failed")}finally{setBusy(false)}}
 function addAll(){try{const cart=JSON.parse(localStorage.getItem("pinakk-cart")||"[]") as {id:string;qty:number}[];for(const book of books.filter(x=>x.stock>0)){const id=String(book._id),found=cart.find(x=>x.id===id);if(found)found.qty+=1;else cart.push({id,qty:1})}localStorage.setItem("pinakk-cart",JSON.stringify(cart));window.location.href="/cart"}catch{setError("Could not add books to cart.")}}
 return <section style={{marginTop:28,padding:20,border:"1px solid #dbe4f0",borderRadius:18,background:"#f8fafc"}}>
  <p style={{fontSize:11,fontWeight:800,letterSpacing:1,color:"#1e40af",margin:0}}>PINAKK SCHOOL COURSE FINDER</p><h2 style={{fontSize:23,margin:"7px 0 5px"}}>Find books for your class</h2><p style={{fontSize:13,color:"#64748b",marginTop:0}}>Choose your board, class, medium and academic session to find matching books.</p>
  <form onSubmit={findBooks} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:12}}>
   <label style={{fontSize:12,fontWeight:700}}>Board<select value={board} onChange={e=>setBoard(e.target.value)} style={field}>{options.boards.map(x=><option key={x}>{x}</option>)}</select></label>
   <label style={{fontSize:12,fontWeight:700}}>Class<select value={className} onChange={e=>setClassName(e.target.value)} style={field}>{options.classes.map(x=><option key={x}>{x}</option>)}</select></label>
   <label style={{fontSize:12,fontWeight:700}}>Medium<select value={medium} onChange={e=>setMedium(e.target.value)} style={field}>{options.mediums.map(x=><option key={x}>{x}</option>)}</select></label>
   {senior&&<label style={{fontSize:12,fontWeight:700}}>Stream<select value={stream} onChange={e=>setStream(e.target.value)} style={field}><option value="">All streams</option>{options.streams.map(x=><option key={x}>{x}</option>)}</select></label>}
   <label style={{fontSize:12,fontWeight:700}}>Academic Session<select value={session} onChange={e=>setSession(e.target.value)} style={field}>{options.academicSessions.map(x=><option key={x}>{x}</option>)}</select></label>
   <label style={{fontSize:12,fontWeight:700}}>Subject (optional)<select value={subject} onChange={e=>setSubject(e.target.value)} style={field}><option value="">All subjects</option>{options.subjects.map(x=><option key={x}>{x}</option>)}</select></label>
   <div style={{display:"flex",alignItems:"end"}}><button disabled={busy} style={{width:"100%",padding:12,border:0,borderRadius:10,background:"#1e40af",color:"#fff",fontWeight:800,cursor:"pointer"}}>{busy?"Searching…":"Find matching books"}</button></div>
  </form>
  {error&&<p style={{color:"#b91c1c",fontSize:13}}>{error}</p>}{message&&<p style={{color:"#64748b",fontSize:13}}>{message}</p>}
  {!!books.length&&<div style={{marginTop:18}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}><b>{books.length} matching books</b><button onClick={addAll} disabled={!books.some(x=>x.stock>0)} style={{padding:"9px 13px",border:0,borderRadius:9,background:"#ff7a00",color:"#fff",fontWeight:800}}>Add available books to cart</button></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10,marginTop:12}}>{books.map(book=><Link key={book._id} href={"/product/"+book._id} style={{padding:12,border:"1px solid #e2e8f0",borderRadius:12,background:"#fff",color:"#111827",textDecoration:"none"}}><b style={{fontSize:12,display:"block"}}>{book.name}</b><small style={{display:"block",color:"#64748b",margin:"5px 0"}}>{book.schoolCourse?.subject||book.subcategory||"School book"} · {book.schoolCourse?.bookType||""}</small><strong>₹{Number(book.price).toLocaleString("en-IN")}</strong><small style={{display:"block",color:book.stock>0?"#15803d":"#b91c1c",marginTop:5}}>{book.stock>0?"In stock":"Out of stock"}</small></Link>)}</div></div>}
 </section>
}
const field:React.CSSProperties={display:"block",width:"100%",marginTop:6,padding:10,border:"1px solid #d8e0eb",borderRadius:9,background:"#fff",color:"#111827"};
