import type { Metadata } from "next";
import "./globals.css";
import ScrollTop from "@/components/Helper/ScrollTop";
import { AuthProvider } from "@/context/AuthContext";
//const geistSans = Geist({
//  variable: "--font-geist-sans",
 // subsets: ["latin"],
//});

//const geistMono = Geist_Mono({
 // variable: "--font-geist-mono",
 // subsets: ["latin"],
//});

export const metadata: Metadata = {
  title: "Tourasya",
  description: "Travel Recommendation System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        
        <ScrollTop/>
      </body>
    </html>
  );
}
