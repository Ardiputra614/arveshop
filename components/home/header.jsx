"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogIn, UserPlus, ChevronDown } from "lucide-react";
import { useState } from "react";
import api from "@/lib/api"; // axios instance withCredentials true

export default function Navbar({ user }) {
  const url = process.env.NEXT_PUBLIC_GOLANG_URL;
  const [open, setOpen] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const menuClass = (path) =>
    isActive(path)
      ? "text-white border-b-2 border-blue-500 pb-1"
      : "text-gray-300 hover:text-white pb-1";

  const getInitial = (name) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await api.post(`/api/auth/logout`);
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const dashboardPath =
    user?.role === "superadmin" ? "/admin/dashboard" : "/riwayat";

  return (
    <nav className="bg-[#1a191d] border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          {/* LOGO */}
          <Link href="/" className="text-white font-bold">
            <img src="/logo.png" className="w-32" alt="ARVE SHOP" />
          </Link>

          {/* MENU */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className={menuClass("/")}>
              Top Up
            </Link>
            <Link href="/cek-transaksi" className={menuClass("/cek-transaksi")}>
              Cek Transaksi
            </Link>
          </div>

          {/* AUTH DESKTOP */}
          <div className="hidden md:flex items-center gap-4 relative">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdown(!dropdown)}
                  className="flex items-center gap-3 bg-gray-700 px-3 py-2 rounded-lg text-white hover:bg-gray-600 transition"
                >
                  <div className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-full text-sm font-bold">
                    {getInitial(user.name)}
                  </div>
                  <span className="text-sm">{user.name}</span>
                  <ChevronDown size={16} />
                </button>

                {dropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#222] border border-gray-700 rounded-lg shadow-lg overflow-hidden">
                    <Link
                      href={dashboardPath}
                      className="block px-4 py-3 text-sm text-gray-300 hover:bg-gray-700"
                      onClick={() => setDropdown(false)}
                    >
                      Dashboard
                    </Link>

                    <Link
                      href="/riwayat"
                      className="block px-4 py-3 text-sm text-gray-300 hover:bg-gray-700"
                      onClick={() => setDropdown(false)}
                    >
                      History
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-700"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-300 hover:text-white transition"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white transition"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>

          {/* MOBILE */}
          <button
            className="md:hidden text-white"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
          {/* MOBILE MENU */}
          {open && (
            <div className="md:hidden bg-[#1a191d] border-t border-gray-800">
              <div className="px-4 py-4 space-y-4">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="block text-gray-300"
                >
                  Top Up
                </Link>

                <Link
                  href="/cek-transaksi"
                  onClick={() => setOpen(false)}
                  className="block text-gray-300"
                >
                  Cek Transaksi
                </Link>

                <div className="border-t border-gray-700 pt-4 space-y-3">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 text-white">
                        <div className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-full text-sm font-bold">
                          {getInitial(user.name)}
                        </div>
                        <span>{user.name}</span>
                      </div>

                      <Link
                        href={dashboardPath}
                        onClick={() => setOpen(false)}
                        className="block text-gray-300"
                      >
                        Dashboard
                      </Link>

                      <Link
                        href="/riwayat"
                        onClick={() => setOpen(false)}
                        className="block text-gray-300"
                      >
                        History
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="block text-red-400"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setOpen(false)}
                        className="block text-gray-300"
                      >
                        Masuk
                      </Link>

                      <Link
                        href="/register"
                        onClick={() => setOpen(false)}
                        className="block text-white bg-blue-600 px-4 py-2 rounded-lg"
                      >
                        Daftar
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
