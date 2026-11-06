import { categoryNames } from "@/lib/catalogue";

export type Product = {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  oldPrice?: number;
  badge?: string;
  description: string;
  image: string;
  stock: number;
};

// Products are loaded from MongoDB. No fabricated demo inventory is shown.
export const products: Product[] = [];
export const categories = ["All", ...categoryNames];
