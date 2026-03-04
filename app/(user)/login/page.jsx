"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function LoginPage() {
  const [focused, setFocused] = useState(null);
  const router = useRouter();
  const url = process.env.NEXT_PUBLIC_GOLANG_URL;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await api.post(`${url}/api/auth/login`, { email, password });

      router.push("/"); // redirect
      router.refresh();
    } catch (error) {
      alert(error.response?.data?.message || "Login gagal");
    }
  }

  return (
    <div className="min-h-screen  flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Heading */}
        <div className="mb-10">
          <h1
            className="text-white text-3xl font-light mb-2"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Sign In
          </h1>
          <p
            className="text-gray-500 text-sm"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            Enter your credentials to continue.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6 ">
          <div>
            <label
              className="block text-xs mb-2 tracking-widest uppercase text-white"
              style={{ fontFamily: "'Courier New', monospace" }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              placeholder="you@example.com"
              className="w-full border-b py-3 text-sm bg-gray-500 rounded-lg outline-none transition-colors duration-200 text-white placeholder-gray-700"
              style={{
                fontFamily: "'Courier New', monospace",
                borderColor: focused === "email" ? "#fff" : "#333",
              }}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label
                className="text-xs tracking-widest uppercase text-white"
                style={{ fontFamily: "'Courier New', monospace" }}
              >
                Password
              </label>
              <button
                className="text-xs text-white hover:text-white transition-colors duration-200"
                style={{ fontFamily: "'Courier New', monospace" }}
              >
                Forgot?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
              placeholder="••••••••"
              className="w-full border-b py-3 text-sm bg-gray-500 rounded-lg outline-none transition-colors duration-200 text-white placeholder-gray-700"
              style={{
                fontFamily: "'Courier New', monospace",
                borderColor: focused === "password" ? "#fff" : "#333",
              }}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full mt-10 py-4 bg-white text-black text-sm tracking-widest uppercase transition-all duration-200 hover:bg-gray-100 active:scale-95"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          Sign In →
        </button>

        {/* Switch */}
        <p
          className="text-center text-xs text-gray-600 mt-8"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-white underline underline-offset-2 hover:no-underline transition-all"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
