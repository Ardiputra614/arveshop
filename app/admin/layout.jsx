"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  CreditCard,
  ShoppingCart,
  FolderTree,
  Settings,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

export default function AdminLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Dummy user data
  const user = {
    name: "Admin User",
    email: "admin@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
    role: "Super Admin",
  };

  // Navigation links dengan icon
  const navLinks = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: <Home className="w-5 h-5" />,
      exact: true,
    },
    {
      href: "/admin/payment-method",
      label: "Payment Method",
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      href: "/admin/transaction",
      label: "Transaction",
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    {
      href: "/admin/categories",
      label: "Category",
      icon: <FolderTree className="w-5 h-5" />,
    },
    {
      href: "/admin/services",
      label: "Service",
      icon: <Settings className="w-5 h-5" />,
    },
    {
      href: "/admin/whatsapp",
      label: "WhatsApp Engine",
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      href: "/admin/profil-aplikasi",
      label: "Profil Aplikasi",
      icon: <User className="w-5 h-5" />,
    },
  ];

  // Check if link is active
  const isActive = (href, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  // Handle logout
  const handleLogout = () => {
    // Simulate logout
    console.log("Logging out...");
    // Clear any stored tokens
    localStorage.removeItem("auth_token");
    // Redirect to login
    router.push("/login");
  };

  // Profile dropdown links
  const profileLinks = [
    {
      href: "/admin/profile",
      label: "My Profile",
      icon: <User className="w-4 h-4" />,
    },
    {
      href: "/admin/settings",
      label: "Settings",
      icon: <Settings className="w-4 h-4" />,
    },
    {
      type: "divider",
    },
    {
      type: "button",
      label: "Logout",
      icon: <LogOut className="w-4 h-4" />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-md"
            : "bg-white border-b border-gray-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center">
              <Link
                href="/admin/dashboard"
                className="flex items-center space-x-3"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <div className="hidden md:block">
                  <h1 className="text-xl font-bold text-gray-900">
                    AdminPanel
                  </h1>
                  <p className="text-xs text-gray-500">Management System</p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.slice(0, 5).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href, link.exact)
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}

              {/* More dropdown for extra links */}
              <div className="relative group">
                <button className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium">
                  <span className="mr-1">More</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  {navLinks.slice(5).map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center px-4 py-3 hover:bg-gray-50 text-sm ${
                        isActive(link.href)
                          ? "text-indigo-600 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      <span className="mr-3">{link.icon}</span>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side: User dropdown & Mobile menu button */}
            <div className="flex items-center space-x-4">
              {/* Notifications badge */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full absolute top-2 right-2"></div>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>

              {/* User dropdown */}
              <div className="relative">
                <button
                  onClick={() =>
                    setIsProfileDropdownOpen(!isProfileDropdownOpen)
                  }
                  className="flex items-center space-x-3 p-1 rounded-lg hover:bg-gray-100"
                >
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      isProfileDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>

                    {/* Links */}
                    {profileLinks.map((item, index) => {
                      if (item.type === "divider") {
                        return (
                          <div
                            key={index}
                            className="border-t border-gray-100 my-2"
                          />
                        );
                      }

                      if (item.type === "button") {
                        return (
                          <button
                            key={index}
                            onClick={item.onClick}
                            className={`flex items-center w-full px-4 py-3 text-sm hover:bg-gray-50 ${
                              item.danger ? "text-red-600" : "text-gray-700"
                            }`}
                          >
                            <span className="mr-3">{item.icon}</span>
                            {item.label}
                          </button>
                        );
                      }

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <span className="mr-3">{item.icon}</span>
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-lg ${
                    isActive(link.href, link.exact)
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-3">{link.icon}</span>
                  {link.label}
                </Link>
              ))}

              {/* Mobile profile links */}
              <div className="pt-4 border-t border-gray-100">
                {profileLinks.map((item, index) => {
                  if (item.type === "divider") return null;

                  if (item.type === "button") {
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          item.onClick?.();
                          setIsMobileMenuOpen(false);
                        }}
                        className={`flex items-center w-full px-4 py-3 rounded-lg text-sm ${
                          item.danger
                            ? "text-red-600 hover:bg-red-50"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <span className="mr-3">{item.icon}</span>
                        {item.label}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 text-sm"
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main content - with padding for fixed navbar */}
      <main className="pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Brand */}
            <div className="mb-6 md:mb-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    AdminPanel
                  </h3>
                  <p className="text-sm text-gray-500">Management Dashboard</p>
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center gap-6 mb-6 md:mb-0">
              <Link
                href="/admin/about"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                About
              </Link>
              <Link
                href="/admin/privacy"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                href="/admin/terms"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Terms of Service
              </Link>
              <Link
                href="/admin/contact"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Contact
              </Link>
              <Link
                href="/admin/help"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Help Center
              </Link>
            </div>

            {/* Social & Copyright */}
            <div className="text-center md:text-right">
              <div className="flex justify-center md:justify-end space-x-4 mb-3">
                <a href="#" className="text-gray-400 hover:text-gray-600">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} AdminPanel. All rights reserved.
                <span className="block md:inline md:ml-2">
                  v2.0.0 • Demo Mode
                </span>
              </p>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Made with ❤️ for better administration •
              <span className="ml-1">
                Last updated: {new Date().toLocaleDateString("id-ID")}
              </span>
            </p>
          </div>
        </div>
      </footer>

      {/* Close dropdown when clicking outside */}
      {isProfileDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsProfileDropdownOpen(false)}
        />
      )}
    </div>
  );
}
