"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Trophy, ShoppingBag } from "lucide-react";
import Service from "../../components/home/service";
import axios from "axios";

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [activePromo, setActivePromo] = useState(0);
  const [kategori, setKategori] = useState(null);
  const [loading, setLoading] = useState(true);
  const promoRef = useRef(null);
  const url = process.env.NEXT_PUBLIC_GOLANG_URL;

  // Cache untuk menghindari fetch berulang di development
  const cache = useMemo(() => new Map(), []);

  const fetchData = useCallback(async () => {
    if (cache.has("categories") && cache.has("services")) {
      setCategories(cache.get("categories"));
      setServices(cache.get("services"));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [categoriesRes, servicesRes] = await Promise.all([
        axios.get(`${url}/api/categories`),
        axios.get(`${url}/api/services`),
      ]);

      const categoriesData = categoriesRes.data.data || [];
      const servicesData = servicesRes.data.data || [];

      cache.set("categories", categoriesData);
      cache.set("services", servicesData);

      setCategories(categoriesData);
      setServices(servicesData);
    } catch (err) {
      // console.error("Error fetching data:", err);
      return;
    } finally {
      setLoading(false);
    }
  }, [cache, url]); // ✅ hapus kategori dari sini

  // ✅ Set kategori awal terpisah, hanya jalan sekali setelah categories loaded
  useEffect(() => {
    if (categories.length > 0 && !kategori) {
      setKategori(categories[0].id);
    }
  }, [categories]); // ← hanya bergantung pada categories

  useEffect(() => {
    fetchData();
  }, [fetchData]); // ← sekarang hanya jalan sekali

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter services dengan useMemo
  const servicesData = useMemo(() => {
    if (!kategori || !services.length) return [];

    // console.log("Filtering services for kategori:", kategori);

    return services.filter((service) => {
      return String(service.category_id) === String(kategori);
    });
  }, [services, kategori]);

  // Promos data - static, tidak perlu re-render
  const promos = useMemo(
    () => [
      {
        id: 1,
        title: "DISKON SPESIAL 50%",
        description: "Top up Mobile Legends diskon besar!",
        bgColor: "bg-gradient-to-r from-purple-800 via-pink-800 to-rose-900",
        icon: <Trophy className="text-yellow-400" size={32} />,
      },
    ],
    [],
  );

  // AUTO SLIDE
  useEffect(() => {
    if (!promos.length) return;

    const interval = setInterval(() => {
      setActivePromo((prev) => (prev + 1) % promos.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [promos.length]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#37353E] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-white">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* HERO / PROMO */}
      <div className="relative overflow-hidden bg-[#37353E]">
        <div className="container mx-auto px-4 py-10 relative">
          <div ref={promoRef} className="mb-12">
            <div className="relative h-64 rounded-3xl overflow-hidden border border-gray-700/50">
              {promos.map((promo, idx) => (
                <div
                  key={promo.id}
                  className={`absolute inset-0 transition-all duration-700 ${
                    promo.bgColor
                  } ${
                    idx === activePromo ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
                >
                  <div className="absolute inset-0 bg-black/40"></div>
                  <div className="absolute top-6 right-8">{promo.icon}</div>
                  <div className="absolute bottom-8 left-8 right-8">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {promo.title}
                    </h3>
                    <p className="text-gray-200">{promo.description}</p>
                  </div>
                </div>
              ))}

              {/* Promo Indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
                {promos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePromo(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === activePromo
                        ? "bg-white w-4"
                        : "bg-white/50 hover:bg-white/80"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-4 bg-[#37353E] pb-12">
        {/* KATEGORI */}
        {categories.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-[#D3DAD9] mb-4">
              Kategori Layanan
            </h2>

            <div className="flex overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setKategori(category.id)}
                  className={`${
                    category.id === kategori
                      ? "bg-black text-white border-blue-500"
                      : "bg-transparent text-gray-300 hover:bg-gray-700 border-gray-600"
                  } px-6 py-2.5 mx-2 rounded-2xl border cursor-pointer transition-all duration-200 font-medium`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SERVICES */}
        <div className="mb-12">
          {servicesData && servicesData.length > 0 ? (
            <Service
              games={servicesData}
              title={(() => {
                const selectedCategory = categories.find(
                  (c) => c.id === kategori,
                );
                return selectedCategory
                  ? selectedCategory.name
                  : "Layanan Populer";
              })()}
              layout="grid"
              columns={4}
            />
          ) : (
            <div className="text-center py-16 bg-[#44444E] rounded-3xl">
              <ShoppingBag className="w-20 h-20 text-gray-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                {categories.length === 0
                  ? "Tidak ada kategori"
                  : "Belum ada layanan untuk kategori ini"}
              </h3>
              <p className="text-gray-400 text-lg">
                {categories.length === 0
                  ? "Silahkan tambahkan kategori terlebih dahulu"
                  : "Silahkan pilih kategori lain"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CSS untuk hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
