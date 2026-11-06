"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ShoppingBag, Search, ArrowUpRight, Truck, ShieldCheck, Headphones,
  Plus, CheckCircle2, Menu, UserRound, Heart, BookOpen, Pencil,
  Briefcase, Gift, Home, PackageCheck, Phone, MapPin, Tag, Grid3X3,
  Store, X, Sparkles, ArrowRight, Mail
} from "lucide-react";
import type { Product } from "@/lib/products";
import { catalogueCategories, type CatalogueCategory } from "@/lib/catalogue";

type CartItem = { id: string; qty: number };

const slides = [
  {
    eyebrow: "MADE FOR EVERYDAY DISCOVERIES",
    title: "Small things. Big possibilities.",
    copy: "Thoughtful essentials for school, work and home — all in one easy-to-shop place.",
    cta: "Explore the collection",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1800&q=85",
    alt: "Students learning together in a bright classroom",
    tone: "sand"
  },
  {
    eyebrow: "PAPER, PRINT & CREATE",
    title: "Bring every idea to life.",
    copy: "Find A4 copier paper, glossy sheets, notebooks and useful office supplies.",
    cta: "Shop paper essentials",
    image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=1800&q=85",
    alt: "Paper and stationery arranged on a desk",
    tone: "lavender"
  },
  {
    eyebrow: "READY FOR THE EVERYDAY",
    title: "Useful finds, chosen well.",
    copy: "From school bags and accessories to tarpaulin, nets and daily-use products.",
    cta: "Find your essentials",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1800&q=85",
    alt: "Backpack and everyday carry essentials",
    tone: "mint"
  }
];

const categoryIconMap: Record<string, typeof Pencil> = {
  "Stationery": Pencil,
  "Copy & Notebook": BookOpen,
  "School Courses & Books": BookOpen,
  "General Items": Store,
  "Perfume & Fragrance": Gift,
  "Belt & Fashion Accessories": Briefcase,
  "Net Products": Grid3X3,
  "Tirpal & Tarpaulin": Home
};


function Brand() {
  return (
    <Link href="/" className="pk-brand" aria-label="PINAKK home">
      <span className="pk-brand-mark">P<span>✦</span></span>
      <span className="pk-brand-copy"><b>PINAKK</b><small>Shop Smart, Live Better</small></span>
    </Link>
  );
}

export default function Storefront() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [notice, setNotice] = useState("");
  const [catalogue, setCatalogue] = useState<Product[]>([]);
  const [categoryRecords, setCategoryRecords] = useState<CatalogueCategory[]>(catalogueCategories);
  const [catalogueSource, setCatalogueSource] = useState<"unavailable" | "database">("unavailable");
  const [slide, setSlide] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem("pinakk-cart") || "[]"));
      setWishlist(JSON.parse(localStorage.getItem("pinakk-wishlist") || "[]"));
    } catch {}
    fetch("/api/categories", { cache: "no-store" }).then(r => r.ok ? r.json() : Promise.reject()).then(data => { if (Array.isArray(data.categories)) setCategoryRecords(data.categories.filter((c: CatalogueCategory) => c.active !== false)); }).catch(() => setCategoryRecords(catalogueCategories));
    fetch("/api/products")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (Array.isArray(data.products)) {
          setCatalogue(data.products.map((p: any) => ({
            id: String(p._id), name: p.name, category: p.category, price: p.price,
            oldPrice: p.compareAtPrice, description: p.description,
            image: p.image || "/pinakk-logo.svg",
            stock: p.stock, subcategory: p.subcategory || "", badge: undefined
          })));
          setCatalogueSource("database");
        }
      })
      .catch(() => setCatalogueSource("unavailable"));
  }, []);

  useEffect(() => { localStorage.setItem("pinakk-cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("pinakk-wishlist", JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => {
    const timer = setInterval(() => setSlide(s => (s + 1) % slides.length), 7000);
    return () => clearInterval(timer);
  }, []);

  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const availableCategories = ["All", ...categoryRecords.map(item => item.name)];
  const filtered = useMemo(
    () => catalogue.filter(p =>
      (category === "All" || p.category === category) &&
      (p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(query.toLowerCase()) ||
        (p.subcategory || "").toLowerCase().includes(query.toLowerCase()))
    ),
    [query, category, catalogue]
  );
  const suggestions = useMemo(
    () => query.trim() ? catalogue.filter(p => (p.name + " " + (p.subcategory || "")).toLowerCase().includes(query.toLowerCase())).slice(0, 5) : [],
    [query, catalogue]
  );

  function add(p: Product) {
    setCart(old => {
      const found = old.find(x => x.id === p.id);
      return found ? old.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x) : [...old, { id: p.id, qty: 1 }];
    });
    setNotice(p.name + " added to your bag");
    setTimeout(() => setNotice(""), 2200);
  }
  function chooseCategory(value: string) {
    setCategory(value);
    setQuery("");
    setMobileMenu(false);
    document.getElementById("pk-products")?.scrollIntoView({ behavior: "smooth" });
  }
  function toggleWish(id: string) {
    setWishlist(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
    setNotice(wishlist.includes(id) ? "Removed from wishlist" : "Saved to wishlist");
    setTimeout(() => setNotice(""), 1800);
  }

  const active = slides[slide];
  const activeCategory = categoryRecords.find(item => item.name === category);
  const categoryTiles = categoryRecords.map(item => ({ title: item.name, sub: item.description, filter: item.name, image: item.image, icon: categoryIconMap[item.name] || PackageCheck }));

  return (
    <main className="pinakk-store">
      <div className="pk-announcement">
        <div><Sparkles size={13} /><span>Everyday essentials, thoughtfully brought together</span></div>
        <div className="pk-announcement-links"><a href="tel:9685535343">Need help? 96855 35343</a><span>Serving Rehti & nearby areas</span></div>
      </div>

      <header className="pk-header">
        <button className="pk-menu-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle navigation">
          {mobileMenu ? <X /> : <Menu />}
        </button>
        <Brand />
        <div className="pk-search-area">
          <form className="pk-search" role="search" onSubmit={e => {
            e.preventDefault();
            document.getElementById("pk-products")?.scrollIntoView({ behavior: "smooth" });
            setSearchFocused(false);
          }}>
            <Search size={19} />
            <input value={query} onFocus={() => setSearchFocused(true)} onChange={e => setQuery(e.target.value)} placeholder="What are you looking for today?" aria-label="Search products" />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={16} /></button>}
            <button type="submit" aria-label="Submit search"><ArrowUpRight size={19} /></button>
          </form>
          {searchFocused && suggestions.length > 0 && (
            <div className="pk-suggestions">
              {suggestions.map(p => <button key={p.id} onClick={() => {
                setQuery(p.name); setSearchFocused(false);
                document.getElementById("pk-products")?.scrollIntoView({ behavior: "smooth" });
              }}><Search size={14} />{p.name}<span>₹{p.price.toLocaleString("en-IN")}</span></button>)}
            </div>
          )}
        </div>
        <Link className="pk-action-link" href="/customer"><UserRound /><span>Account</span></Link>
        <Link className="pk-action-link pk-wishlist-link" href="/customer"><Heart /><span>Saved</span>{wishlist.length > 0 && <b>{wishlist.length}</b>}</Link>
        <Link className="pk-bag-link" href="/cart"><ShoppingBag /><span>Bag</span><b>{count}</b></Link>
      </header>

      <nav className={mobileMenu ? "pk-navigation is-open" : "pk-navigation"} aria-label="Main navigation">
        <div className="pk-nav-inner">
          <button onClick={() => chooseCategory("All")}><Grid3X3 size={15} /> Explore all</button>
          {categoryRecords.map(item =>
            <button key={item.slug} onClick={() => chooseCategory(item.name)}>{item.name}</button>
          )}
          <button className="pk-offers-link" onClick={() => chooseCategory("All")}><Tag size={14} /> Just arrived</button>
        </div>
      </nav>

      <section className="pk-hero" aria-label="Featured collections">
        <div className={"pk-hero-copy " + active.tone}>
          <span className="pk-eyebrow"><i />{active.eyebrow}</span>
          <h1>{active.title}</h1>
          <p>{active.copy}</p>
          <button onClick={() => chooseCategory("All")}>{active.cta}<ArrowRight size={17} /></button>
          <div className="pk-hero-pagination">
            {slides.map((item, i) => <button key={item.title} onClick={() => setSlide(i)} className={i === slide ? "active" : ""} aria-label={"Show feature " + (i + 1)} />)}
            <span>0{slide + 1} <i>/</i> 0{slides.length}</span>
          </div>
        </div>
        <div className="pk-hero-visual">
          <Image key={active.image} src={active.image} alt={active.alt} fill priority sizes="(max-width: 700px) 100vw, 58vw" />
          <div className="pk-hero-sticker"><span>PINAKK</span><b>Good finds<br />live here.</b><Sparkles size={20} /></div>
        </div>
      </section>

      <section className="pk-promise-row" aria-label="Shopping benefits">
        <div><ShieldCheck /><span><b>Selected with care</b><small>Useful products for real life</small></span></div>
        <div><Truck /><span><b>Local convenience</b><small>Pickup and delivery options</small></span></div>
        <div><Headphones /><span><b>Friendly support</b><small>Talk to our team when needed</small></span></div>
        <div><PackageCheck /><span><b>Easy checkout</b><small>Simple and secure ordering</small></span></div>
      </section>

      <section className="pk-section pk-categories" aria-labelledby="pk-category-title">
        <div className="pk-section-heading">
          <div><span className="pk-kicker">A GOOD PLACE TO START</span><h2 id="pk-category-title">Find your kind of useful.</h2><p>Explore the things you need, all in one place.</p></div>
          <button onClick={() => chooseCategory("All")}>All collections <ArrowUpRight size={17} /></button>
        </div>
        <div className="pk-category-grid">
          {categoryTiles.map((item, i) => {
            const Icon = item.icon;
            return <button className={"pk-category-card pk-cat-" + (i % 4)} key={item.title} onClick={() => chooseCategory(item.filter)}>
              <span className="pk-category-photo"><Image src={item.image} alt="" fill sizes="(max-width: 700px) 42vw, 22vw" /><i><Icon size={16} /></i></span>
              <span className="pk-category-info"><b>{item.title}</b><small>{item.sub}</small></span><ArrowUpRight className="pk-category-arrow" size={18} />
            </button>;
          })}
        </div>
        {activeCategory && (
          <div className="pk-subcategory-panel">
            <div className="pk-subcategory-heading"><b>Browse {activeCategory.name}</b><span>{activeCategory.subcategories.length} subcategories</span></div>
            <div className="pk-subcategory-list">
              {activeCategory.subcategories.map(item => (
                <button key={item} onClick={() => { setQuery(item); document.getElementById("pk-products")?.scrollIntoView({ behavior: "smooth" }); }}>
                  <span><Image src={activeCategory.image} alt={activeCategory.name + " illustrative category"} fill sizes="64px" /></span>
                  <b>{item}</b><ArrowUpRight size={14} />
                </button>
              ))}
            </div>
            {!!activeCategory.items?.length && <div className="pk-category-item-list"><b>Item list</b><div>{activeCategory.items.map(item => <button key={item} onClick={() => { setQuery(item); document.getElementById("pk-products")?.scrollIntoView({ behavior: "smooth" }); }}>{item}</button>)}</div></div>}
            <div className="pk-category-filters"><b>Popular filters</b>{activeCategory.filters.map(item => <span key={item}>{item}</span>)}</div>
          </div>
        )}
      </section>

      <section className="pk-products-section" id="pk-products" aria-labelledby="pk-products-title">
        <div className="pk-section pk-products-inner">
          <div className="pk-section-heading">
            <div><span className="pk-kicker">{catalogueSource === "database" ? "FROM THE PINAKK STORE" : "CATALOGUE TEMPORARILY UNAVAILABLE"}</span><h2 id="pk-products-title">{query ? "Your search results" : category === "All" ? "Worth a closer look." : category + " collection"}</h2><p>Everyday essentials at prices you'll love.</p></div>
            <span className="pk-result-count">{filtered.length} items</span>
          </div>
          <div className="pk-filter-row">
            {availableCategories.slice(0, 9).map(item => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
          <div className="pk-product-grid">
            {filtered.slice(0, 12).map(p => <article className="pk-product-card" key={p.id}>
              <div className="pk-product-image">
                <Link href={"/product/" + p.id} aria-label={"View " + p.name}><Image src={p.image} alt={p.name} fill sizes="(max-width: 650px) 45vw, 22vw" /></Link>
                {p.badge && <span className="pk-product-badge">{p.badge}</span>}
                <button className={wishlist.includes(p.id) ? "is-saved" : ""} onClick={() => toggleWish(p.id)} aria-label="Save to wishlist"><Heart size={18} /></button>
              </div>
              <div className="pk-product-details">
                <small className="pk-product-category">{p.category}</small>
                <Link href={"/product/" + p.id} className="pk-product-name">{p.name}</Link>
                <div className="pk-price-row"><b>₹{p.price.toLocaleString("en-IN")}</b>{p.oldPrice && p.oldPrice > p.price && <del>₹{p.oldPrice.toLocaleString("en-IN")}</del>}{p.oldPrice && p.oldPrice > p.price && <em>{Math.round((1 - p.price / p.oldPrice) * 100)}% off</em>}</div>
                <small className={p.stock > 0 ? "pk-stock" : "pk-out-stock"}>{p.stock > 0 ? "Available to order" : "Currently unavailable"}</small>
                <button className="pk-add-button" disabled={p.stock === 0} onClick={() => add(p)}><Plus size={15} /> Add to bag</button>
                <Link href={"/product/" + p.id} className="pk-product-detail-link">View full details <ArrowUpRight size={14} /></Link>
              </div>
            </article>)}
          </div>
          {filtered.length === 0 && <div className="pk-empty"><Search size={30} /><b>Nothing found just yet</b><span>Try another product name or browse all collections.</span><button onClick={() => { setQuery(""); setCategory("All"); }}>Show all products</button></div>}
        </div>
      </section>

      <section className="pk-story-banner">
        <div className="pk-story-image"><Image src="https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=85" alt="Warm everyday home and lifestyle essentials" fill sizes="(max-width: 700px) 100vw, 50vw" /></div>
        <div className="pk-story-copy"><span className="pk-kicker">THE PINAKK WAY</span><h2>More of what matters.<br />Less of what doesn't.</h2><p>School, office, home and outdoor essentials — brought together to make everyday shopping a little simpler.</p><button onClick={() => chooseCategory("All")}>Discover PINAKK <ArrowUpRight size={17} /></button></div>
      </section>

      <footer className="pk-footer" id="pk-support">
        <div className="pk-footer-main">
          <div className="pk-footer-about"><Brand /><p>Your everyday destination for stationery, school books, printing paper, bags, tarpaulin, nets and useful lifestyle essentials. Proudly serving Rehti and nearby communities.</p><a href="tel:9685535343"><Phone size={15} /> +91 96855 35343</a><a href="https://wa.me/919685535343" target="_blank" rel="noreferrer"><Mail size={15} /> Message us on WhatsApp</a></div>
          <div><b>DISCOVER</b><button onClick={() => chooseCategory("All")}>Shop all products</button><button onClick={() => chooseCategory("Stationery")}>Stationery</button><button onClick={() => chooseCategory("Copy & Notebook")}>Copy & Notebook</button><button onClick={() => chooseCategory("School Courses & Books")}>School Courses & Books</button><button onClick={() => chooseCategory("General Items")}>General Items</button></div>
          <div><b>WE'RE HERE TO HELP</b><a href="tel:9685535343">Customer support</a><a href="https://wa.me/919685535343" target="_blank" rel="noreferrer">Order assistance on WhatsApp</a><a href="#pk-support">Shipping information</a><a href="#pk-support">Returns & refunds</a></div>
          <div className="pk-footer-note"><b>SHOP WITH CONFIDENCE</b><span><ShieldCheck size={17} /> Secure checkout</span><span><PackageCheck size={17} /> Clear order updates</span><span><Headphones size={17} /> Human support</span><a href="https://wa.me/919685535343" target="_blank" rel="noreferrer"><Phone size={17} /> WhatsApp support</a></div>
        </div>
        <div className="pk-footer-bottom"><span>© {new Date().getFullYear()} PINAKK. All rights reserved.</span><span>Powered by <b>DevaCore</b></span><span>Ashish Stationery & Photocopy · Main Road, Rehti</span></div>
      </footer>

      <nav className="pk-mobile-nav" aria-label="Mobile navigation">
        <Link href="/"><Home /><small>Home</small></Link>
        <button onClick={() => setMobileMenu(!mobileMenu)}><Grid3X3 /><small>Explore</small></button>
        <Link href="/customer"><Heart /><small>Saved</small></Link>
        <Link href="/cart"><ShoppingBag /><small>Bag {count > 0 && <b>{count}</b>}</small></Link>
        <Link href="/customer"><UserRound /><small>Account</small></Link>
      </nav>
      {notice && <div className="pk-toast"><CheckCircle2 size={17} />{notice}<button onClick={() => setNotice("")}>×</button></div>}
    </main>
  );
}
