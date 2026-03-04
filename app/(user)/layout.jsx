import { Geist, Geist_Mono } from "next/font/google";
import Header from "../../components/home/header";
import Footer from "../../components/home/Footer";
import { cookies } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ function harus async
async function getUser() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${process.env.NEXT_PUBLIC_GOLANG_URL}/api/me`, {
    headers: {
      Cookie: cookieHeader,
    },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.user;
}

// ✅ async di depan function
export default async function HomeLayout({ children }) {
  const user = await getUser(); // harus await

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#37353E]`}
    >
      <Header user={user} />
      <div className="container mx-auto">{children}</div>
      <Footer />
    </div>
  );
}
