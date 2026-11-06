export type CatalogueCategory = {
  name: string;
  slug: string;
  description: string;
  image: string;
  icon: string;
  subcategories: string[];
  items: string[];
  filters: string[];
  seoTitle: string;
  seoDescription: string;
  displayOrder: number;
  active: boolean;
  courseOptions?: {
    boards: string[]; classes: string[]; mediums: string[]; streams: string[];
    subjects: string[]; bookTypes: string[]; academicSessions: string[];
    parikshaBodhClasses: string[];
  };
  customPricing?: { enabled: boolean; units: string[]; adminConfigured: boolean };
};

export const catalogueCategories: CatalogueCategory[] = [
  {
    name: "Stationery", slug: "stationery",
    description: "Pens, pencils, colours, geometry tools, office stationery and art supplies.",
    image: "/catalogue/category-01-stationery.svg", icon: "pencil",
    subcategories: ["Pen", "Pencil", "Eraser", "Sharpener", "Scale", "Marker", "Sketch & Colours", "Geometry", "Adhesive", "Office Stationery", "Files", "Art & Craft"],
    items: ["Ball Pen", "Gel Pen", "Fountain Pen", "Ink Pen", "Roller Pen", "Refill Pen", "HB Pencil", "2B Pencil", "4B Pencil", "6B Pencil", "Mechanical Pencil", "Colour Pencil", "White Eraser", "Dust Free Eraser", "Non-Dust Eraser", "Fancy Eraser", "Single Hole Sharpener", "Double Hole Sharpener", "Container Sharpener", "6 Inch Scale", "12 Inch Scale", "15 Inch Scale", "30 CM Scale", "Geometry Scale", "Permanent Marker", "Whiteboard Marker", "CD Marker", "Highlighter", "Sketch Pen", "Brush Pen", "Calligraphy Pen", "Wax Crayon", "Oil Pastel", "Poster Colour", "Water Colour", "Acrylic Colour", "Geometry Box", "Compass", "Divider", "Protractor", "Set Square", "Fevicol", "Glue Stick", "Gum", "Adhesive Tape", "Stapler", "Stapler Pin", "Punch Machine", "Paper Clip", "Binder Clip", "Paper Weight", "Box File", "Spring File", "L-File", "Button File", "Folder", "Drawing Sheet", "Chart Paper", "Craft Paper", "Glitter Sheet", "Scissors", "Cutter", "Pencil Box", "Exam Pad"],
    filters: ["Brand", "Price", "Colour", "Pack Size", "Product Type"],
    seoTitle: "Stationery Online | Pens, Pencils, Colours & Office Supplies | PINAKK",
    seoDescription: "Shop pens, pencils, erasers, sharpeners, geometry tools, markers, colours, files and art & craft stationery at PINAKK.",
    displayOrder: 1, active: true
  },
  {
    name: "Copy & Notebook", slug: "copy-notebook",
    description: "School copies, notebooks, registers, diaries and office record books.",
    image: "/catalogue/category-02-copy-notebook.svg", icon: "book-open",
    subcategories: ["School Copy", "Long Notebook", "Small Notebook", "Practical Copy", "Drawing Copy", "Rough Copy", "Register", "Spiral Notebook", "Hardbound Notebook", "Softbound Notebook", "Homework Diary", "Assignment Notebook", "Graph Book", "Lab Record Book", "Project File", "Pocket Diary", "Attendance Register", "Cash Book", "Ledger Book", "Stock Register", "Receipt Book", "Bill Book", "Voucher Book"],
    items: ["Single Line Copy", "Four Line Copy", "Double Line Copy", "Square Line Copy", "Plain Copy", "Interleaf Copy", "A4 Notebook", "A5 Notebook", "Long Notebook", "Small Notebook", "40 Pages", "80 Pages", "100 Pages", "120 Pages", "160 Pages", "200 Pages", "300 Pages", "Attendance Register", "Cash Book", "Ledger Book", "Stock Register", "Receipt Book", "Bill Book", "Voucher Book", "Calendar Diary"],
    filters: ["Line Type", "Size: A4, A5, Long, Small", "Pages: 40, 80, 100, 120, 160, 200, 300", "Paper GSM", "Binding Type", "Brand", "Price"],
    seoTitle: "School Copies, Notebooks & Registers Online | PINAKK",
    seoDescription: "Browse school copies, notebooks, practical books, diaries, registers, cash books and office record books.",
    displayOrder: 2, active: true
  },
  {
    name: "School Courses & Books", slug: "school-courses-books",
    description: "Find individual school books or build a complete course by board, class, medium and session.",
    image: "/catalogue/category-03-school-courses-books.svg", icon: "graduation-cap",
    subcategories: ["MP Board", "NCERT", "CBSE", "Other Boards", "Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "Pariksha Bodh", "Guide Books", "Question Banks", "Model Papers", "Workbooks", "Lab Manuals"],
    items: ["Official Textbook", "NCERT Textbook", "MP Board Textbook", "Pariksha Bodh", "Guide Book", "Question Bank", "Model Paper", "Solved Paper", "Previous Year Paper", "Sample Paper", "Practice Set", "Workbook", "Lab Manual", "Exemplar", "Objective Questions", "Important Questions"],
    filters: ["Board", "Class", "Medium", "Stream", "Academic Session", "Subject", "Publisher", "Price"],
    seoTitle: "MP Board, NCERT & School Course Books | PINAKK",
    seoDescription: "Find school books, MP Board and NCERT titles, Pariksha Bodh, guides and complete course bundles by class and medium.",
    displayOrder: 3, active: true,
    courseOptions: {
      boards: ["MP Board", "NCERT", "CBSE", "Other Boards"],
      classes: ["Nursery", "LKG", "UKG", ...Array.from({ length: 12 }, (_, i) => "Class " + (i + 1))],
      mediums: ["Hindi", "English"],
      streams: ["Science", "Commerce", "Arts"],
      subjects: ["Hindi", "English", "Mathematics", "Science", "Environmental Studies", "Social Science", "Sanskrit", "Physics", "Chemistry", "Biology", "History", "Geography", "Political Science", "Economics", "Sociology", "Psychology", "Accountancy", "Business Studies", "Computer Science", "Informatics Practices", "General Knowledge", "Drawing", "Information Technology"],
      bookTypes: ["Official Textbook", "NCERT Textbook", "MP Board Textbook", "Pariksha Bodh", "Guide Book", "Question Bank", "Model Paper", "Solved Paper", "Previous Year Paper", "Sample Paper", "Practice Set", "Workbook", "Lab Manual", "Exemplar", "Objective Questions", "Important Questions"],
      academicSessions: ["2026-27", "2027-28"],
      parikshaBodhClasses: ["Class 9", "Class 10", "Class 11", "Class 12"]
    }
  },
  {
    name: "General Items", slug: "general-items",
    description: "Useful home, kitchen, cleaning, electrical, mobile, travel, gift, toy and seasonal products.",
    image: "/catalogue/category-04-general-items.svg", icon: "house",
    subcategories: ["Kitchen", "Home", "Cleaning", "Electrical", "Mobile Accessories", "Personal Use", "Travel", "Gift Items", "Toys", "Seasonal", "Sports", "Accessories"],
    items: ["Water Bottle", "Lunch Box", "Tiffin", "Flask", "Water Jug", "Containers", "Bucket", "Mug", "Dustbin", "Hanger", "Basket", "Storage Box", "Broom", "Mop", "Brush", "Duster", "Cleaning Cloth", "LED Bulb", "Extension Board", "Torch", "Night Lamp", "Charger", "Cable", "Earphones", "Mobile Stand", "Holder", "Comb", "Mirror", "Nail Cutter", "Handkerchief", "Bag", "Pouch", "Travel Bottle", "Luggage Lock", "Gift Box", "Greeting Card", "Wrapping Paper", "Showpiece", "Toy Car", "Doll", "Puzzle", "Building Blocks", "Educational Toys", "Umbrella", "Raincoat", "Winter Cap", "Gloves", "Cricket Ball", "Bat", "Skipping Rope", "Badminton Equipment", "Keychain", "Wallet", "Sunglasses", "Watch"],
    filters: ["Brand", "Price", "Colour", "Material", "Product Type"],
    seoTitle: "General & Daily Use Items Online | PINAKK",
    seoDescription: "Shop kitchen, home, cleaning, electrical, mobile accessories, travel, gifts, toys, sports and everyday essentials.",
    displayOrder: 4, active: true
  },
  {
    name: "Perfume & Fragrance", slug: "perfume-fragrance",
    description: "Men's, women's and unisex perfumes, attars, body sprays and fragrance gift sets.",
    image: "/catalogue/category-05-perfume-fragrance.svg", icon: "spray-can",
    subcategories: ["Men's Perfume", "Women's Perfume", "Unisex Perfume", "Body Spray", "Deodorant", "Body Mist", "Attar", "Roll-On Perfume", "Pocket Perfume", "Perfume Gift Set", "Eau De Parfum", "Eau De Toilette", "Oud Perfume", "Floral Fragrance", "Fresh Fragrance", "Woody Fragrance"],
    items: ["Men's Perfume", "Women's Perfume", "Unisex Perfume", "Body Spray", "Deodorant", "Body Mist", "Attar", "Roll-On Perfume", "Pocket Perfume", "Perfume Gift Set", "Eau De Parfum (EDP)", "Eau De Toilette (EDT)", "Oud Perfume", "Floral Fragrance", "Fresh Fragrance", "Woody Fragrance"],
    filters: ["Brand", "Fragrance Family", "Gender", "Size: 10ml, 20ml, 30ml, 50ml, 100ml", "Price", "Rating"],
    seoTitle: "Perfume, Attar & Fragrance Online | PINAKK",
    seoDescription: "Explore men's, women's and unisex perfume, body spray, attar, body mist and fragrance gift sets.",
    displayOrder: 5, active: true
  },
  {
    name: "Belt & Fashion Accessories", slug: "belt-fashion-accessories",
    description: "Belts, wallets, card holders, sunglasses, watches and everyday fashion accessories.",
    image: "/catalogue/category-06-belt-fashion-accessories.svg", icon: "watch",
    subcategories: ["Men's Belts", "Formal Belts", "Casual Belts", "Reversible Belts", "Automatic Buckle Belts", "Canvas Belts", "Nylon Belts", "School Belts", "Kids Belts", "Women's Belts", "Wallets", "Card Holders", "Keychains", "Sunglasses", "Watches", "Ties", "Socks", "Handkerchiefs", "Caps", "Bracelets"],
    items: ["Men's Leather Belt", "Formal Belt", "Casual Belt", "Reversible Belt", "Automatic Buckle Belt", "Canvas Belt", "Nylon Belt", "School Belt", "Kids Belt", "Women's Belt", "Wallet", "Card Holder", "Keychain", "Sunglasses", "Watch", "Tie", "Socks", "Handkerchief", "Cap", "Bracelet", "Fashion Accessories"],
    filters: ["Brand", "Size", "Colour", "Material", "Gender", "Price"],
    seoTitle: "Belts, Wallets & Fashion Accessories Online | PINAKK",
    seoDescription: "Shop men's, women's and kids belts, wallets, card holders, sunglasses, watches, ties and fashion accessories.",
    displayOrder: 6, active: true
  },
  {
    name: "Net Products", slug: "net-products",
    description: "Agriculture shade nets, safety nets, garden nets, mosquito nets and custom-size net products.",
    image: "/catalogue/category-07-net-products.svg", icon: "grid-3x3",
    subcategories: ["Agriculture & Shade Net", "Bird & Insect Protection Net", "Mosquito Net", "Fishing Net", "Construction Safety Net", "Balcony Safety Net", "Cricket Practice Net", "Garden Net", "Poultry Net", "HDPE Net", "Nylon Net", "Monofilament Net", "Knitted Net", "Fencing Net", "Plant Support Net", "Fruit Protection Net"],
    items: ["Agriculture Shade Net", "Green Shade Net", "White Shade Net", "Black Shade Net", "Anti Bird Net", "Anti Insect Net", "Mosquito Net", "Fishing Net", "Construction Safety Net", "Balcony Safety Net", "Cricket Practice Net", "Garden Net", "Poultry Net", "HDPE Net", "Nylon Net", "Monofilament Net", "Knitted Net", "Fencing Net", "Plant Support Net", "Fruit Protection Net"],
    filters: ["GSM", "Mesh Size", "Colour", "Width", "Length", "Material", "Shade Percentage", "Brand", "Price"],
    seoTitle: "Agriculture Shade Net, Safety Net & Garden Net | PINAKK",
    seoDescription: "Browse shade nets, anti-bird nets, mosquito nets, safety nets, garden nets and custom-size net products.",
    displayOrder: 7, active: true,
    customPricing: { enabled: true, units: ["sq ft", "sq m"], adminConfigured: true }
  },
  {
    name: "Tirpal & Tarpaulin", slug: "tirpal-tarpaulin",
    description: "HDPE, LDPE and PVC tarpaulins, waterproof covers and custom-size tirpal.",
    image: "/catalogue/category-08-tirpal-tarpaulin.svg", icon: "tent",
    subcategories: ["HDPE Tirpal", "LDPE Tirpal", "PVC Tirpal", "Waterproof Tirpal", "Heavy Duty Tirpal", "Agriculture Tirpal", "Truck Cover Tirpal", "Tractor Cover Tirpal", "Tent Tirpal", "Construction Tirpal", "Industrial Tirpal", "Swimming Pool Cover", "Monsoon Cover", "Ground Sheet", "Canvas Tarpaulin"],
    items: ["HDPE Tirpal", "LDPE Tirpal", "PVC Tirpal", "Waterproof Tirpal", "Heavy Duty Tirpal", "Agriculture Tirpal", "Truck Cover Tirpal", "Tractor Cover Tirpal", "Tent Tirpal", "Construction Tirpal", "Industrial Tirpal", "Swimming Pool Cover", "Monsoon Cover", "Ground Sheet", "Canvas Tarpaulin", "Green Tirpal", "Blue Tirpal", "Silver Tirpal", "Black Tirpal", "Transparent Tirpal"],
    filters: ["GSM: 60, 80, 100, 120, 150, 200, 250, 300+", "Length", "Width", "Colour", "Thickness", "Material", "Waterproof Rating", "Brand", "Price", "Standard Sizes: 6x8, 8x10, 10x12, 12x15, 15x20, 20x30 ft"],
    seoTitle: "HDPE Tirpal & Waterproof Tarpaulin Online | PINAKK",
    seoDescription: "Shop HDPE, LDPE, PVC and heavy-duty tirpal, waterproof tarpaulin and custom-size covers.",
    displayOrder: 8, active: true,
    customPricing: { enabled: true, units: ["sq ft", "sq m"], adminConfigured: true }
  }
];

export const categoryNames = catalogueCategories.map(category => category.name);
