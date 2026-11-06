export type CatalogueCategory = {
  name: string; slug: string; description: string; image: string; icon: string;
  seoTitle: string; seoDescription: string; displayOrder: number; active: boolean;
  subcategories: string[]; filters?: string[];
};

const image = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=85`;

export const catalogueCategories: CatalogueCategory[] = [
  { name:"Stationery", slug:"stationery", description:"Pens, pencils, art supplies and everyday school and office stationery.", image:image("photo-1455390582262-044c1c7a7b1b"), icon:"pencil", seoTitle:"Stationery Online | PINAKK", seoDescription:"Shop pens, pencils, geometry, files, office stationery and art supplies at PINAKK.", displayOrder:1, active:true,
    subcategories:["Pen","Pencil","Eraser","Sharpener","Scale","Marker","Sketch & Colours","Geometry","Adhesive","Office Stationery","Files","Art & Craft"],
    filters:["Brand","Price","Colour","Pack Size","Material"] },
  { name:"Copy & Notebook", slug:"copy-notebook", description:"School copies, notebooks, registers, diaries and office record books.", image:image("photo-1531346878377-a5be20888e57"), icon:"notebook", seoTitle:"Copies & Notebooks Online | PINAKK", seoDescription:"Find school copies, notebooks, practical books, registers and diaries at PINAKK.", displayOrder:2, active:true,
    subcategories:["School Copy","Long Notebook","Small Notebook","Practical Copy","Drawing Copy","Rough Copy","Register","Spiral Notebook","Hardbound Notebook","Softbound Notebook","Homework Diary","Assignment Notebook","Graph Book","Lab Record Book","Project File","Pocket Diary","Attendance Register","Cash Book","Ledger Book","Stock Register","Receipt Book","Bill Book","Voucher Book"],
    filters:["Line Type","Size","Pages","Paper GSM","Binding Type","Brand","Price"] },
  { name:"School Courses & Books", slug:"school-courses-books", description:"School books and course material by board, class, medium, stream and academic session.", image:image("photo-1503676260728-1c00da094a0b"), icon:"book-open", seoTitle:"School Courses & Books | PINAKK", seoDescription:"Find MP Board, NCERT, CBSE books, school courses, guides and Pariksha Bodh by class and medium.", displayOrder:3, active:true,
    subcategories:["Official Textbook","NCERT Textbook","MP Board Textbook","Pariksha Bodh","Guide Book","Question Bank","Model Paper","Solved Paper","Previous Year Paper","Sample Paper","Practice Set","Workbook","Lab Manual","Exemplar","Objective Questions","Important Questions"],
    filters:["Board","Class","Medium","Stream","Academic Session","Subject","Publisher","Price"] },
  { name:"General Items", slug:"general-items", description:"Useful home, kitchen, cleaning, electrical, mobile, travel, gift, toy and seasonal products.", image:image("photo-1600210492486-724fe5c67fb0"), icon:"shopping-basket", seoTitle:"General Items & Daily Essentials | PINAKK", seoDescription:"Shop kitchen, home, cleaning, electrical, mobile, travel, gift, toy and seasonal essentials.", displayOrder:4, active:true,
    subcategories:["Kitchen","Home","Cleaning","Electrical","Mobile Accessories","Personal Use","Travel","Gift Items","Toys","Seasonal","Sports","Accessories"],
    filters:["Brand","Material","Colour","Size","Price"] },
  { name:"Perfume & Fragrance", slug:"perfume-fragrance", description:"Men's, women's and unisex perfumes, attar, body sprays and fragrance gift sets.", image:image("photo-1594035910387-fea47794261f"), icon:"spray-can", seoTitle:"Perfume & Fragrance Online | PINAKK", seoDescription:"Explore perfumes, attar, body spray, deodorant, body mist and fragrance gift sets.", displayOrder:5, active:true,
    subcategories:["Men's Perfume","Women's Perfume","Unisex Perfume","Body Spray","Deodorant","Body Mist","Attar","Roll-On Perfume","Pocket Perfume","Perfume Gift Set","Eau De Parfum","Eau De Toilette","Oud Perfume","Floral Fragrance","Fresh Fragrance","Woody Fragrance"],
    filters:["Brand","Fragrance","Gender","Size","Price","Rating"] },
  { name:"Belt & Fashion Accessories", slug:"belt-fashion-accessories", description:"Belts, wallets, card holders, sunglasses, watches and everyday fashion accessories.", image:image("photo-1627123424574-724758594e93"), icon:"watch", seoTitle:"Belts & Fashion Accessories | PINAKK", seoDescription:"Shop formal, casual and school belts, wallets, sunglasses, watches and accessories.", displayOrder:6, active:true,
    subcategories:["Men's Leather Belt","Formal Belt","Casual Belt","Reversible Belt","Automatic Buckle Belt","Canvas Belt","Nylon Belt","School Belt","Kids Belt","Women's Belt","Wallet","Card Holder","Keychain","Sunglasses","Watch","Tie","Socks","Handkerchief","Cap","Bracelet","Fashion Accessories"],
    filters:["Brand","Size","Colour","Material","Gender","Price"] },
  { name:"Net Products", slug:"net-products", description:"Agriculture, shade, safety, garden, bird, insect and other utility nets with custom dimensions.", image:image("photo-1500382017468-9049fed747ef"), icon:"grid-3x3", seoTitle:"Net Products & Shade Nets | PINAKK", seoDescription:"Shop shade nets, agriculture nets, anti-bird nets, safety nets and custom-size net products.", displayOrder:7, active:true,
    subcategories:["Agriculture Shade Net","Green Shade Net","White Shade Net","Black Shade Net","Anti Bird Net","Anti Insect Net","Mosquito Net","Fishing Net","Construction Safety Net","Balcony Safety Net","Cricket Practice Net","Garden Net","Poultry Net","HDPE Net","Nylon Net","Monofilament Net","Knitted Net","Fencing Net","Plant Support Net","Fruit Protection Net"],
    filters:["GSM","Mesh Size","Colour","Width","Length","Material","Shade Percentage","Brand","Price"] },
  { name:"Tirpal & Tarpaulin", slug:"tirpal-tarpaulin", description:"Waterproof HDPE, LDPE, PVC and heavy-duty tarpaulin for agriculture, transport and construction.", image:image("photo-1500530855697-b586d89ba3ee"), icon:"tent", seoTitle:"Tirpal & Tarpaulin Online | PINAKK", seoDescription:"Shop waterproof HDPE, LDPE and PVC tarpaulin in standard and custom sizes.", displayOrder:8, active:true,
    subcategories:["HDPE Tirpal","LDPE Tirpal","PVC Tirpal","Waterproof Tirpal","Heavy Duty Tirpal","Agriculture Tirpal","Truck Cover Tirpal","Tractor Cover Tirpal","Tent Tirpal","Construction Tirpal","Industrial Tirpal","Swimming Pool Cover","Monsoon Cover","Ground Sheet","Canvas Tarpaulin","Green Tirpal","Blue Tirpal","Silver Tirpal","Black Tirpal","Transparent Tirpal"],
    filters:["GSM","Length","Width","Colour","Thickness","Material","Waterproof Rating","Brand","Price"] }
];

export const stationeryProducts: Record<string,string[]> = {
  "Pen":["Ball Pen","Gel Pen","Fountain Pen","Ink Pen","Roller Pen","Refill Pen"],
  "Pencil":["HB Pencil","2B Pencil","4B Pencil","6B Pencil","Mechanical Pencil","Colour Pencil"],
  "Eraser":["White Eraser","Dust Free Eraser","Non-Dust Eraser","Fancy Eraser"],
  "Sharpener":["Single Hole Sharpener","Double Hole Sharpener","Container Sharpener"],
  "Scale":["6 Inch Scale","12 Inch Scale","15 Inch Scale","30 CM Scale","Geometry Scale"],
  "Marker":["Permanent Marker","Whiteboard Marker","CD Marker","Highlighter"],
  "Sketch & Colours":["Sketch Pen","Brush Pen","Calligraphy Pen","Wax Crayon","Oil Pastel","Poster Colour","Water Colour","Acrylic Colour"],
  "Geometry":["Geometry Box","Compass","Divider","Protractor","Set Square"],
  "Adhesive":["Fevicol","Glue Stick","Gum","Adhesive Tape"],
  "Office Stationery":["Stapler","Stapler Pin","Punch Machine","Paper Clip","Binder Clip","Paper Weight"],
  "Files":["Box File","Spring File","L-File","Button File","Folder"],
  "Art & Craft":["Drawing Sheet","Chart Paper","Craft Paper","Glitter Sheet","Scissors","Cutter","Pencil Box","Exam Pad"]
};

export const schoolCourseOptions = {
  boards:["MP Board","NCERT","CBSE","Other Boards"],
  classes:["Nursery","LKG","UKG",...Array.from({length:12},(_,i)=>`Class ${i+1}`)],
  mediums:["Hindi","English"],
  streams:["Science","Commerce","Arts"],
  sessions:["2026-27","2027-28"],
  subjects:["Hindi","English","Mathematics","Science","Environmental Studies","Social Science","Sanskrit","Physics","Chemistry","Biology","History","Geography","Political Science","Economics","Sociology","Psychology","Accountancy","Business Studies","Computer Science","Informatics Practices","General Knowledge","Drawing","Information Technology"],
  bookTypes:["Official Textbook","NCERT Textbook","MP Board Textbook","Pariksha Bodh","Guide Book","Question Bank","Model Paper","Solved Paper","Previous Year Paper","Sample Paper","Practice Set","Workbook","Lab Manual","Exemplar","Objective Questions","Important Questions"],
  parikshaBodhClasses:["Class 9","Class 10","Class 11","Class 12"]
};

export const copyNotebookFilters = {
  lineTypes:["Single Line","Four Line","Double Line","Square Line","Plain","Interleaf"],
  sizes:["A4","A5","Long","Small"],
  pages:[40,80,100,120,160,200,300],
  bindingTypes:["Softbound","Hardbound","Spiral","Stitched","Stapled"]
};

export const netTarpaulinOptions = {
  gsm:[60,80,100,120,150,200,250,300],
  standardSizesFeet:["6x8","8x10","10x12","12x15","15x20","20x30"],
  units:["sq ft","sq m"],
  pricingModes:["per-square-foot","per-square-metre","fixed-variant"]
};

export const getCategoryByName = (name: string) =>
  catalogueCategories.find(category => category.name.toLowerCase() === name.toLowerCase() || category.slug === name);
