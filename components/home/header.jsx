"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";

export default function Navbar({ user }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const menuClass = (path) =>
    isActive(path)
      ? "text-white border-b-2 border-blue-500 pb-1"
      : "text-gray-300 hover:text-white pb-1";

  return (
    <nav className="bg-[#1a191d] border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* LOGO */}
          <Link href="/" className="text-white text-xl font-bold">
            <img src="/logo.png" className="w-32" alt="ARVE SHOP" />
          </Link>

          {/* MENU DESKTOP */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className={menuClass("/")}>
              Top Up
            </Link>

            <Link href="/cek-transaksi" className={menuClass("/cek-transaksi")}>
              Cek Transaksi
            </Link>
          </div>

          {/* AUTH DESKTOP */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-white transition"
              >
                Dashboard
              </Link>
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

          {/* HAMBURGER */}
          <button
            className="md:hidden text-white"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="md:hidden bg-[#1a191d] border-t border-gray-800">
          <div className="px-4 py-4 space-y-4">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className={
                isActive("/")
                  ? "block text-white font-semibold"
                  : "block text-gray-300"
              }
            >
              Top Up
            </Link>

            <Link
              href="/cek-transaksi"
              onClick={() => setOpen(false)}
              className={
                isActive("/cek-transaksi")
                  ? "block text-white font-semibold"
                  : "block text-gray-300"
              }
            >
              Cek Transaksi
            </Link>

            <div className="border-t border-gray-700 pt-4 space-y-3">
              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="block text-white bg-gray-700 px-4 py-2 rounded-lg"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 text-gray-300 hover:text-white"
                  >
                    <LogIn size={18} />
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white"
                  >
                    <UserPlus size={18} />
                    Daftar
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
