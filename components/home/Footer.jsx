"use client";

import React from "react";
import Link from "next/link";
import {
  Facebook,
  Instagram,
  Twitter,
  Mail,
  PhoneCall,
  MapPin,
  Shield,
  CreditCard,
  Zap,
  Users,
} from "lucide-react";

const Footer = ({ aplikasi }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#44444E] border-t border-gray-700/50 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#44444E] flex items-center justify-center">
                <Zap className="text-white" size={20} />
              </div>
              <div>
                <img src="/logo.png" className="w-20" alt="ARVE SHOP" />
                <p className="text-sm text-gray-400 -mt-2">Top Up & Payment</p>
              </div>
            </div>

            <p className="text-gray-300">
              Platform top up terpercaya dengan layanan lengkap dan proses
              instan.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <PhoneCall size={14} className="text-gray-400" />
                <span className="text-gray-300">+62 878-6470-5664</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={14} className="text-gray-400" />
                <span className="text-gray-300">arfenaz@gmail.com</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={14} className="text-gray-400" />
                <span className="text-gray-300">Purbalingga, Central Java</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[#D3DAD9] flex items-center gap-2">
              <Shield size={18} className="text-teal-400" />
              Informasi
            </h3>
            <ul className="space-y-3">
              {[
                {
                  name: "Syarat & Ketentuan",
                  href: "/term-condition",
                },
                {
                  name: "Kebijakan Privasi",
                  href: "/privacy-policy",
                },
                { name: "Kontak", href: "/contact" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-teal-400 transition"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[#D3DAD9] flex items-center gap-2">
              <Users size={18} className="text-cyan-400" />
              Terhubung Dengan Kami
            </h3>

            <div className="flex gap-3">
              <a className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <Facebook size={18} />
              </a>
              <a className="w-10 h-10 rounded-xl bg-pink-600 flex items-center justify-center text-white">
                <Instagram size={18} />
              </a>
              <a className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white">
                <Twitter size={18} />
              </a>
            </div>

            <div className="pt-6 border-t border-gray-700/50">
              <p className="text-gray-400 text-sm mb-3">Metode Pembayaran</p>
              <div className="flex gap-2">
                {["💳", "🏦", "📱", "💰"].map((m, i) => (
                  <div
                    key={i}
                    className="w-10 h-8 bg-gray-800 rounded-lg flex items-center justify-center"
                  >
                    {m}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-700/50 text-center">
          <p className="text-gray-400 text-sm">
            © {currentYear}{" "}
            <span className="text-purple-400 font-semibold">ARVENAZ</span>. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
