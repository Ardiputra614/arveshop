"use client";

import { useState, useEffect, useRef } from "react";
import {
  TrendingUp,
  Trophy,
  Gift,
  ShoppingBag,
  Users,
  CheckCircle,
  Clock,
  Award,
} from "lucide-react";
import Service from "../../components/home/service";
import axios from "axios";

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [kategori, setKategori] = useState(null);
  const [activePromo, setActivePromo] = useState(0);
  const promoRef = useRef(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, servicesRes] = await Promise.all([
          axios.get("http://localhost:8080/api/categories"),
          axios.get("http://localhost:8080/api/services"),
        ]);

        console.log("Categories response:", categoriesRes.data);
        console.log("Services response:", servicesRes.data);

        setCategories(categoriesRes.data.data || []);
        setServices(servicesRes.data.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  // Set kategori default
  useEffect(() => {
    if (categories.length > 0 && kategori === null) {
      setKategori(categories[0].id);
    }
  }, [categories, kategori]);

  // FILTER SERVICES
  const servicesData = services.filter((service) => {
    return String(service.category_id) === String(kategori);
  });

  console.log("Kategori dipilih:", kategori);
  console.log("Services data:", servicesData);

  const promos = [
    {
      id: 1,
      title: "DISKON SPESIAL 50%",
      description: "Top up Mobile Legends diskon besar!",
      bgColor: "bg-gradient-to-r from-purple-800 via-pink-800 to-rose-900",
      icon: <Trophy className="text-yellow-400" size={32} />,
    },
  ];

  // AUTO SLIDE
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePromo((prev) => (prev + 1) % promos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [promos.length]);

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
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-4 bg-[#37353E]">
        {/* KATEGORI */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#D3DAD9] mb-4">
            Kategori Layanan
          </h2>

          <div className="flex overflow-auto whitespace-nowrap pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setKategori(category.id)}
                className={`${
                  category.id === kategori
                    ? "bg-black text-white"
                    : "bg-transparent text-gray-300 hover:bg-gray-700"
                } px-4 py-2 mx-2 rounded-2xl border border-gray-600 cursor-pointer transition-colors`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* SERVICES */}
        <div className="mb-12">
          {servicesData && servicesData.length > 0 ? (
            <Service
              games={servicesData}
              title="Game Populer"
              layout="grid"
              columns={4}
            />
          ) : (
            <div className="text-center py-12 bg-[#44444E] rounded-3xl">
              <ShoppingBag className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                Belum ada layanan untuk kategori ini
              </h3>
              <p className="text-gray-400">Silahkan pilih kategori lain</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
