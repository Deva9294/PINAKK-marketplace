"use client";
import Link from "next/link";
import Image from "next/image";
import {useEffect,useMemo,useState} from "react";
import type {FormEvent} from "react";
import {ShoppingBag,Search,ArrowRight,Truck,ShieldCheck,Headphones,Plus,CheckCircle2,Menu,UserRound,Heart,Star,BookOpen,Pencil,Ruler,Briefcase,Home,Gift,PackageCheck,ChevronLeft,ChevronRight,Mail,Phone,Instagram,Facebook} from "lucide-react";
import {products as demoProducts,categories,Product} from "@/lib/products";

type CartItem={id:string;qty:number};
const slides=[
 {eyebrow:"THE NEW ACADEMIC SEASON",title:"Back to School",highlight:"KG to Class 12",copy:"School bags, course books, Pariksha Bodh and everyday learning essentials — all in one place.",cta:"Explore School Essentials",image:"https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=1800&q=85",alt:"Students with books and backpacks in a classroom",tag:"LEARN · GROW · ACHIEVE"},
 {eyebrow:"MADE FOR YOUR WORKSPACE",title:"Stationery Pro",highlight:"Paper. Pens. Possibilities.",copy:"Premium copy paper, glossy sheets, fine writing pens and desk essentials for work that feels effortless.",cta:"Shop Stationery",image:"https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=1800&q=85",alt:"Premium pens and stationery on a desk",tag:"QUALITY YOU CAN FEEL"},
 {eyebrow:"EVERYDAY STYLE & PROTECTION",title:"Lifestyle & Care",highlight:"The little things, better.",copy:"Belts, fragrances, umbrellas and outdoor protection essentials for every season and every day.",cta:"Discover Lifestyle",image:"https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=1800&q=85",alt:"Umbrellas on a rainy day",tag:"STYLE · COMFORT · CARE"}
];
const categoryTiles=[
 {title:"Private School Courses",sub:"KG – Class 12",filter:"School Essentials",image:"https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=700&q=80",icon:BookOpen},
 {title:"Pariksha Bodh & Guides",sub:"Books & practicals",filter:"Notebooks",image:"https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=700&q=80",icon:BookOpen},
 {title:"Premium Paper",sub:"Copy & glossy paper",filter:"Paper & Printing",image:"https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=700&q=80",icon:PackageCheck},
 {title:"Pens & Desk Essentials",sub:"Write. Organise. Create.",filter:"Pens & Writing",image:"https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=700&q=80",icon:Pencil},
 {title:"Men's Accessories",sub:"Belts & perfumes",filter:"Accessories",image:"https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=700&q=80",icon:Briefcase},
 {title:"Outdoor Protection",sub:"Tarpaulin, nets & umbrellas",filter:"General Items",image:"https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=700&q=80",icon:Home},
 {title:"Pooja & Festival Needs",sub:"Books & festive essentials",filter:"Notebooks",image:"https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=700&q=80",icon:Gift},
 {title:"General Home Items",sub:"Useful everyday finds",filter:"General Items",image:"https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=700&q=80",icon:Home}
];
export default function Storefront(){
 const [cart,setCart]=useState<CartItem[]>([]);
 const [query,setQuery]=useState("");
 const [category,setCategory]=useState("All");
 const [notice,setNotice]=useState("");
 const [catalogue,setCatalogue]=useState<Product[]>(demoProducts);
 const [catalogueSource,setCatalogueSource]=useState<"demo"|"database">("demo");
 const [slide,setSlide]=useState(0);
 const [mobileMenu,setMobileMenu]=useState(false);
 const [newsletter,setNewsletter]=useState("");
 const [newsletterMessage,setNewsletterMessage]=useState("");
 useEffect(()=>{try{setCart(JSON.parse(localStorage.getItem("pinakk-cart")||"[]"))}catch{};fetch("/api/products").then(r=>r.ok?r.json():Promise.reject()).then(data=>{if(Array.isArray(data.products)&&data.products.length){setCatalogue(data.products.map((p:any)=>({id:String(p._id),name:p.name,category:p.category,price:p.price,oldPrice:p.compareAtPrice,description:p.description,image:p.image||"/placeholder-product.png",stock:p.stock,badge:undefined})));setCatalogueSource("database")}}).catch(()=>setCatalogueSource("demo"))},[]);
 useEffect(()=>{localStorage.setItem("pinakk-cart",JSON.stringify(cart))},[cart]);
 useEffect(()=>{const timer=setInterval(()=>setSlide(s=>(s+1)%slides.length),6000);return()=>clearInterval(timer)},[]);
 const count=cart.reduce((s,x)=>s+x.qty,0);
 const availableCategories=useMemo(()=>Array.from(new Set(["All",...categories.filter(c=>c!=="All"),...catalogue.map(p=>p.category)])),[catalogue]);
 const filtered=useMemo(()=>catalogue.filter(p=>(category==="All"||p.category===category)&&(p.name.toLowerCase().includes(query.toLowerCase())||p.category.toLowerCase().includes(query.toLowerCase()))),[query,category,catalogue]);
 function add(p:Product){setCart(old=>{const found=old.find(x=>x.id===p.id);return found?old.map(x=>x.id===p.id?{...x,qty:x.qty+1}:x):[...old,{id:p.id,qty:1}]});setNotice(p.name+" added to cart");setTimeout(()=>setNotice(""),2200)}
 function chooseCategory(value:string){setCategory(value);document.getElementById("products")?.scrollIntoView({behavior:"smooth"})}
 function newsletterSubmit(e:FormEvent<HTMLFormElement>){e.preventDefault();setNewsletterMessage("Newsletter signup will be available soon. Thanks for your interest!");setNewsletter("")}
 const active=slides[slide];
 return <main className="pinakk-redesign">
  <div className="pr-topbar"><span><Phone size={13}/> Support: <a href="tel:9685535343">96855 35343</a></span><span className="pr-top-message">ASHISH STATIONERY & PHOTOCOPY · REHTI</span><div><button onClick={()=>setNotice("Customer accounts are coming soon.")}><UserRound size={14}/> My Account</button><Link href="/cart"><ShoppingBag size={14}/> Cart <b>{count}</b></Link></div></div>
  <header className="pr-header">
   <button className="pr-mobile-menu" onClick={()=>setMobileMenu(!mobileMenu)} aria-label="Toggle navigation"><Menu/></button>
   <Link href="/" className="pr-logo"><span className="pr-logo-mark">P</span><span><b>PINAKK</b><small>SHOP SMART, LIVE BETTER</small></span></Link>
   <div className="pr-search"><Search size={18}/><input aria-label="Search products" placeholder="Search stationery, books, lifestyle & more..." value={query} onChange={e=>setQuery(e.target.value)}/><button onClick={()=>document.getElementById("products")?.scrollIntoView({behavior:"smooth"})}>SEARCH</button></div>
   <Link href="/cart" className="pr-cart"><ShoppingBag/><span>My Cart<small>{count} items</small></span><b>{count}</b></Link>
  </header>
  <nav className={mobileMenu?"pr-nav open":"pr-nav"}>{["STATIONERY","BOOKS","LIFESTYLE","GENERAL ITEMS","DEPARTMENTS"].map((n,i)=><a key={n} href={i===0?"#categories":"#products"} onClick={()=>setMobileMenu(false)}>{n}</a>)}</nav>
  <section className="pr-hero" aria-label="Promotional offers">
   <div className="pr-hero-image"><Image key={active.image} src={active.image} alt={active.alt} fill priority sizes="100vw"/><div className="pr-hero-overlay"/>
    <div className="pr-hero-copy"><span className="pr-eyebrow">{active.eyebrow}</span><h1>{active.title}<i>{active.highlight}</i></h1><p>{active.copy}</p><a href="#categories">{active.cta}<ArrowRight size={17}/></a><small>{active.tag}</small></div>
    <button className="pr-slide-arrow prev" onClick={()=>setSlide((slide+slides.length-1)%slides.length)} aria-label="Previous banner"><ChevronLeft/></button><button className="pr-slide-arrow next" onClick={()=>setSlide((slide+1)%slides.length)} aria-label="Next banner"><ChevronRight/></button>
    <div className="pr-dots">{slides.map((s,i)=><button key={s.title} className={i===slide?"active":""} onClick={()=>setSlide(i)} aria-label={"Show banner "+(i+1)}/>)}</div>
   </div>
  </section>
  <div className="pr-trust"><div><ShieldCheck/><span><b>Quality You Can Trust</b><small>Carefully selected essentials</small></span></div><div><Truck/><span><b>Local Convenience</b><small>Pickup & delivery options</small></span></div><div><Headphones/><span><b>Friendly Support</b><small>Here when you need us</small></span></div><div><ShoppingBag/><span><b>Shop With Ease</b><small>Simple cart & checkout</small></span></div></div>
  <section id="categories" className="pr-section"><div className="pr-section-head"><div><span className="pr-kicker">CURATED FOR EVERYDAY</span><h2>Explore Our Collections</h2><p>Thoughtful picks for school, work, home and everything in between.</p></div><a href="#products">SHOP ALL <ArrowRight size={15}/></a></div>
   <div className="pr-category-grid">{categoryTiles.map((c)=>{const Icon=c.icon;return <button className="pr-category" key={c.title} onClick={()=>chooseCategory(c.filter)}><span className="pr-category-photo"><Image src={c.image} alt={c.title} fill sizes="(max-width:650px) 45vw, 25vw"/><i><Icon size={18}/></i></span><span className="pr-category-text"><b>{c.title}</b><small>{c.sub}</small><em>EXPLORE <ArrowRight size={12}/></em></span></button>})}</div>
  </section>
  <section id="products" className="pr-section pr-products"><div className="pr-section-head"><div><span className="pr-kicker">THE PINAKK EDIT</span><h2>Featured Products</h2><p>Everyday favourites, picked for quality and value.</p></div><span className="pr-product-count">{catalogueSource==="database"?"LIVE STORE CATALOGUE":"STORE PICKS"} · {filtered.length} ITEMS</span></div>
   <div className="pr-filters"><button className={category==="All"?"active":""} onClick={()=>setCategory("All")}>All Products</button>{availableCategories.filter(c=>c!=="All").slice(0,7).map(c=><button key={c} className={category===c?"active":""} onClick={()=>setCategory(c)}>{c}</button>)}</div>
   <div className="pr-product-grid">{filtered.slice(0,8).map((p,i)=><article className="pr-product" key={p.id}><div className="pr-product-photo"><Image src={p.image} alt={p.name} fill sizes="(max-width:650px) 45vw, 22vw"/>{p.badge&&<span>{p.badge}</span>}<button aria-label="Add to wishlist" onClick={()=>setNotice("Wishlist is coming soon.")}><Heart size={17}/></button></div><div className="pr-product-info"><small>{p.category}</small><h3>{p.name}</h3><p>{p.description}</p><div className="pr-product-bottom"><strong>₹{p.price.toLocaleString("en-IN")}</strong>{p.oldPrice&&p.oldPrice>p.price?<del>₹{p.oldPrice.toLocaleString("en-IN")}</del>:null}<button onClick={()=>add(p)}><Plus size={14}/> Add to Cart</button></div></div></article>)}</div>
   {filtered.length===0&&<p className="pr-empty">No products found. Try another search or category.</p>}
  </section>
  <section className="pr-brand-promo"><div><span className="pr-kicker">THE PINAKK PROMISE</span><h2>Little things.<br/><i>Better everyday.</i></h2><p>From the first page of a notebook to the finishing touch of your everyday style, find the essentials that make life smoother.</p><a href="#categories">DISCOVER PINAKK <ArrowRight size={16}/></a></div><div className="pr-promo-photo"><Image src="https://images.unsplash.com/photo-1710031407576-135a680d6e10?auto=format&fit=crop&w=1100&q=85" alt="Backpack, notebooks and daily essentials arranged together" fill sizes="(max-width:700px) 90vw, 45vw"/></div><div className="pr-promo-seal">SHOP SMART<br/><b>LIVE BETTER</b></div></section>
  <footer className="pr-footer" id="contact"><div className="pr-footer-main"><div className="pr-footer-about"><Link href="/" className="pr-logo"><span className="pr-logo-mark">P</span><span><b>PINAKK</b><small>SHOP SMART, LIVE BETTER</small></span></Link><p>Your everyday destination for stationery, books, lifestyle essentials and more. Proudly serving Rehti and nearby communities.</p><div className="pr-social"><a href="https://www.instagram.com/" aria-label="Instagram"><Instagram/></a><a href="https://www.facebook.com/" aria-label="Facebook"><Facebook/></a><a href="https://wa.me/919685535343" aria-label="WhatsApp">WA</a></div></div>
   <div><b className="pr-footer-title">QUICK LINKS</b><a href="#contact">About Us</a><a href="#contact">Contact</a><a href="#contact">Shipping Policy</a><a href="#contact">Privacy Policy</a><a href="#contact">Terms & Conditions</a></div>
   <div><b className="pr-footer-title">SHOP BY CATEGORY</b><a href="#categories">Stationery</a><a href="#categories">Books & Guides</a><a href="#categories">Lifestyle</a><a href="#categories">General Items</a><a href="#products">Featured Products</a></div>
   <div className="pr-newsletter"><b className="pr-footer-title">THE PINAKK LETTER</b><p>Get store updates, new arrivals and special offers.</p><form onSubmit={newsletterSubmit}><label className="sr-only" htmlFor="pr-newsletter-email">Email address</label><input id="pr-newsletter-email" type="email" required placeholder="Your email address" value={newsletter} onChange={e=>setNewsletter(e.target.value)}/><button aria-label="Join newsletter"><ArrowRight/></button></form>{newsletterMessage&&<small className="pr-newsletter-note">{newsletterMessage}</small>}<a className="pr-footer-contact" href="tel:9685535343"><Phone size={14}/> 96855 35343</a></div>
  </div><div className="pr-footer-bottom"><span>© {new Date().getFullYear()} PINAKK. All rights reserved.</span><span>Design & Developed By <b>DevaCore</b></span><span>Ashish Stationery & Photocopy · Main Road, Rehti</span></div></footer>
  {notice&&<div className="pr-toast"><CheckCircle2 size={17}/>{notice}<button onClick={()=>setNotice("")}>×</button></div>}
 </main>;
}
