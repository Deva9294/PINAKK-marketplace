export type Product = { id:string; name:string; category:string; price:number; oldPrice?:number; badge?:string; description:string; image:string; stock:number };
export const products:Product[] = [
{id:"p1",name:"Premium A4 Copier Paper – 500 Sheets",category:"Paper & Printing",price:285,oldPrice:320,badge:"Bestseller",description:"Smooth, bright A4 paper for everyday printing and photocopy work.",image:"https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=900",stock:35},
{id:"p2",name:"Hardcover Premium Notebook",category:"Notebooks",price:149,oldPrice:180,description:"Durable hard-cover notebook for school, college and office.",image:"https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=900",stock:24},
{id:"p3",name:"Artist Colour Pen Set",category:"Art & Craft",price:199,badge:"Popular",description:"Vibrant colours for notes, drawing and creative projects.",image:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=900",stock:18},
{id:"p4",name:"Executive Ball Pen Pack",category:"Pens & Writing",price:99,description:"Comfortable everyday writing pens in a value pack.",image:"https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=900",stock:50},
{id:"p5",name:"Office Desk Organizer",category:"Office Supplies",price:349,oldPrice:399,description:"Keep stationery and your workspace neatly arranged.",image:"https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900",stock:12},
{id:"p6",name:"Glossy Photo Paper – 20 Sheets",category:"Paper & Printing",price:120,description:"Glossy finish photo paper for vivid photo prints.",image:"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=900",stock:20},
{id:"p7",name:"School Geometry Box",category:"School Essentials",price:89,description:"Essential geometry tools for school students.",image:"https://images.unsplash.com/photo-1453738773917-9c3eff1db985?w=900",stock:16},
{id:"p8",name:"Everyday Utility Pouch",category:"Accessories",price:159,description:"Compact pouch for stationery and daily essentials.",image:"https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=900",stock:9}
];
export const categories = ["All","Paper & Printing","Notebooks","Pens & Writing","School Essentials","Art & Craft","Office Supplies","Accessories"];
