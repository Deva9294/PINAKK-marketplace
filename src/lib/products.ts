export type Product = { id:string; name:string; category:string; price:number; oldPrice?:number; badge?:string; description:string; image:string; stock:number };
// Production catalogue is sourced from MongoDB. Do not seed fictitious products here.
export const products: Product[] = [];
export const categories = ["All","Stationery","Copy & Notebook","School Courses & Books","General Items","Perfume & Fragrance","Belt & Fashion Accessories","Net Products","Tirpal & Tarpaulin"];
