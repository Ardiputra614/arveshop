"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Search, Zap, ShoppingBag } from "lucide-react";

const Service = ({
  games,
  title = "",
  layout = "grid",
  columns = 4,
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [activeCategory, setActiveCategory] = useState("all");

  // Ambil kategori unik (support object & string)
  const categories = ["all"];
  games.forEach((game) => {
    const catName = game.category?.name ?? game.category;
    if (catName && !categories.includes(catName)) {
      categories.push(catName);
    }
  });

  // Filter
  const filteredGames = games.filter((game) => {
    const catName = game.category?.name ?? game.category ?? "";
    const matchesSearch =
      searchQuery === "" ||
      game.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      catName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "all" || catName === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort
  const sortedGames = [...filteredGames].sort((a, b) => {
    if (sortBy === "alphabetical") return a.name.localeCompare(b.name);
    if (sortBy === "newest")
      return new Date(b.created_at) - new Date(a.created_at);
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return a.name.localeCompare(b.name);
  });

  if (!games.length) {
    return (
      <div className="text-center py-12 bg-[#44444E] rounded-3xl">
        <ShoppingBag className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">Belum ada layanan</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      {title && <h2 className="text-2xl font-bold text-[#D3DAD9]">{title}</h2>}

      {/* Search & Sort */}
      <div className="flex gap-4 flex-wrap items-center">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari layanan..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-gray-500"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-800 text-white px-4 py-2 rounded-xl border border-gray-700 focus:outline-none cursor-pointer"
        >
          <option value="popular">Populer</option>
          <option value="alphabetical">A-Z</option>
          <option value="newest">Terbaru</option>
        </select>
      </div>

      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="flex overflow-auto whitespace-nowrap gap-2 pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                activeCategory === cat
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-gray-300 border-gray-600 hover:bg-gray-700"
              }`}
            >
              {cat === "all" ? "Semua" : cat}
            </button>
          ))}
        </div>
      )}

      {/* Empty State setelah filter */}
      {sortedGames.length === 0 ? (
        <div className="text-center py-12 bg-[#44444E] rounded-3xl">
          <ShoppingBag className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            Tidak ada layanan ditemukan
          </h3>
          <p className="text-gray-400">Coba kata kunci lain</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sortedGames.map((game) => {
            // ✅ FIX: handle category sebagai object atau string
            const catName = game.category?.name ?? game.category ?? "";
            return (
              // ✅ FIX: href pakai kurung kurawal
              <Link key={game.id} href={`/${game.slug}`} className="group">
                <div className="relative overflow-hidden rounded-xl bg-black shadow-lg hover:-translate-y-1 transition-transform duration-200">
                  <div className="aspect-[3/4] overflow-hidden">
                    <img
                      src={game.logo}
                      alt={game.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <div className="absolute bottom-0 p-4">
                    <h3 className="text-white font-bold text-sm">
                      {game.name}
                    </h3>
                    {/* ✅ FIX: render catName (string), bukan game.category (object) */}
                    {catName && (
                      <span className="text-xs text-gray-300">{catName}</span>
                    )}
                  </div>
                  {game.is_featured && (
                    <div className="absolute top-3 right-3 bg-red-500 text-xs px-2 py-1 rounded-full text-white flex items-center gap-1">
                      <Zap size={12} />
                      HOT
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Service;
