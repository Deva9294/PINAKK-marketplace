import type {Metadata} from "next"; import "./globals.css";
export const metadata:Metadata={title:"PINAKK — Everyday, Made Easier",description:"Shop stationery, paper, school and office essentials at PINAKK, Ashish Stationery & Photocopy, Rehti."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
