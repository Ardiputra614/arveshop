import { Geist, Geist_Mono } from "next/font/google";
import Header from "../../components/home/header";
import Footer from "../../components/home/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function HomeLayout({ children }) {
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#37353E]`}
    >
      <Header />
      <div className="container mx-auto">{children}</div>
      <Footer />
    </div>
  );
}
