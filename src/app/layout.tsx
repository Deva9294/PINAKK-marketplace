import type {Metadata} from "next";
import "./globals.css";

export const metadata:Metadata={
 title:"PINAKK — Shop Smart · Live Better",
 description:"Shop stationery, notebooks, school and office essentials, printing supplies and everyday products at PINAKK, Ashish Stationery & Photocopy, Rehti.",
};

export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en"><body>{children}</body></html>;
}
