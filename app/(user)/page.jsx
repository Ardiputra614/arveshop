"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Trophy, ShoppingBag } from "lucide-react";
import Service from "../../components/home/service";
import axios from "axios";

// 🚀 Constants di luar komponen biar gak dibuat ulang
const CACHE_TTL = 5 * 60 * 1000; // 5 menit
const URL = process.env.NEXT_PUBLIC_GOLANG_URL;

// 🚀 Helper untuk cache dengan expiry
const cacheManager = {
  get: (key) => {
    const cached = sessionStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL) {
      sessionStorage.removeItem(key);
      return null;
    }
    return data;
  },
  set: (key, data) => {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      }),
    );
  },
};

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [activePromo, setActivePromo] = useState(0);
  const [kategori, setKategori] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const promoRef = useRef(null);
  const fetchedRef = useRef(false); // 🚀 Prevent double fetch

  // 🚀 Promos static - pindah ke luar atau pake useRef
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

  // 🚀 Fetch data dengan cache & error handling
  const fetchData = useCallback(async () => {
    // Cek cache dulu
    const cachedCategories = cacheManager.get("categories");
    const cachedServices = cacheManager.get("services");

    if (cachedCategories && cachedServices) {
      setCategories(cachedCategories);
      setServices(cachedServices);
      setLoading(false);
      // Set kategori awal kalau belum ada
      if (cachedCategories.length > 0 && !kategori) {
        setKategori(cachedCategories[0].id);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [categoriesRes, servicesRes] = await Promise.all([
        axios.get(`${URL}/api/categories`, { timeout: 10000 }),
        axios.get(`${URL}/api/services`, { timeout: 10000 }),
      ]);

      const categoriesData = categoriesRes.data?.data || [];
      const servicesData = servicesRes.data?.data || [];

      // Simpan ke cache
      cacheManager.set("categories", categoriesData);
      cacheManager.set("services", servicesData);

      setCategories(categoriesData);
      setServices(servicesData);

      // Set kategori awal
      if (categoriesData.length > 0) {
        setKategori(categoriesData[0].id);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Gagal memuat data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [kategori]); // 🚀 Hanya depend on kategori

  // 🚀 Single useEffect dengan ref guard
  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchData();
    }
  }, [fetchData]);

  // 🚀 Filter services optimized
  const servicesData = useMemo(() => {
    if (!kategori || !services.length) return [];
    return services.filter(
      (service) => String(service.category_id) === String(kategori),
    );
  }, [services, kategori]);

  // 🚀 Auto slide promo dengan cleanup
  useEffect(() => {
    if (promos.length <= 1) return;

    const interval = setInterval(() => {
      setActivePromo((prev) => (prev + 1) % promos.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [promos.length]);

  // 🚀 Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#37353E] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => fetchData()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // 🚀 Loading state dengan skeleton (lebih baik)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#37353E]">
        <div className="container mx-auto px-4 py-10">
          {/* Skeleton Hero */}
          <div className="h-64 rounded-3xl bg-gray-700 animate-pulse mb-12" />

          {/* Skeleton Categories */}
          <div className="flex gap-2 mb-12">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-12 w-24 bg-gray-700 rounded-2xl animate-pulse"
              />
            ))}
          </div>

          {/* Skeleton Services */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-48 bg-gray-700 rounded-xl animate-pulse"
              />
            ))}
          </div>
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
                  <div className="absolute inset-0 bg-black/40" />
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
