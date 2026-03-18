"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Search,
  Filter,
  Package,
  Grid,
  List,
  ChevronRight,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";

export default function AdminTopupList() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // grid atau list
  const [stats, setStats] = useState({
    totalServices: 0,
    totalCategories: 0,
    activeServices: 0,
    popularServices: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const url = process.env.NEXT_PUBLIC_GOLANG_URL || "http://localhost:8080";

      const [categoriesRes, servicesRes] = await Promise.all([
        axios.get(`${url}/api/categories`),
        axios.get(`${url}/api/services`),
      ]);

      const categoriesData = categoriesRes.data.data || [];
      const servicesData = servicesRes.data.data || [];

      setCategories(categoriesData);
      setServices(servicesData);

      // Hitung stats
      const activeCount = servicesData.filter(
        (s) => s.buyer_product_status && s.seller_product_status,
      ).length;

      setStats({
        totalServices: servicesData.length,
        totalCategories: categoriesData.length,
        activeServices: activeCount,
        popularServices:
          servicesData.filter((s) => s.is_popular).length ||
          Math.floor(servicesData.length * 0.3),
      });
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter services
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.slug?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      String(service.category_id) === String(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  // Group by category untuk list view
  const servicesByCategory = categories.reduce((acc, category) => {
    const catServices = filteredServices.filter(
      (s) => String(s.category_id) === String(category.id),
    );
    if (catServices.length > 0) {
      acc.push({
        ...category,
        services: catServices,
      });
    }
    return acc;
  }, []);

  const handleTopupClick = (service) => {
    router.push(`/admin/topup/${service.slug}`);
  };

  const getStatusBadge = (service) => {
    const isActive =
      service.buyer_product_status && service.seller_product_status;
    return isActive ? (
      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
        Active
      </span>
    ) : (
      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
        Inactive
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="">Memuat data layanan...</p>
        </div>
      </div>
    );
  }

  // ✅ Buat komponen terpisah supaya bisa pakai useState
  const ServiceLogo = ({ service }) => {
    const [imgSrc, setImgSrc] = useState(service.logo || null);

    if (!imgSrc) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
          <Package className="w-8 h-8" />
        </div>
      );
    }

    return (
      <Image
        src={imgSrc}
        alt={service.name}
        width={64}
        height={64}
        unoptimized
        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
        onError={() => setImgSrc(null)}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with Welcome Message */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold  mb-2">Admin Topup Panel</h1>
              <p className=" text-lg">
                Kelola dan lakukan topup untuk semua layanan dengan mudah
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className=" backdrop-blur-sm rounded-2xl p-4 mb-8 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2  w-5 h-5" />
              <input
                type="text"
                placeholder="Cari layanan berdasarkan nama, deskripsi, atau slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3  border border-gray-600 rounded-xl  placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2  hover:"
                >
                  ×
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="md:w-72 relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2  w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-12 pr-4 py-3  border border-gray-600 rounded-xl  appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} (
                    {
                      services.filter(
                        (s) => String(s.category_id) === String(cat.id),
                      ).length
                    }
                    )
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Results Info */}
          <div className="mt-3 flex items-center justify-between text-sm">
            <p className="">
              Menampilkan{" "}
              <span className=" font-semibold">{filteredServices.length}</span>{" "}
              dari <span className=" font-semibold">{services.length}</span>{" "}
              layanan
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-blue-400 hover:text-blue-300"
              >
                Reset pencarian
              </button>
            )}
          </div>
        </div>

        {/* Content - Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                onClick={() => handleTopupClick(service)}
                className="group  backdrop-blur-sm rounded-2xl p-5 cursor-pointer  transition-all border border-gray-700 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10"
              >
                {/* Header with Image */}
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                    <ServiceLogo service={service} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className=" font-semibold truncate group-hover:text-blue-400 transition-colors">
                      {service.name}
                    </h3>
                  </div>
                </div>
              </div>
            ))}

            {filteredServices.length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className=" rounded-2xl p-8 max-w-md mx-auto">
                  <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl  mb-2">Tidak ada layanan</h3>
                  <p className=" mb-4">
                    {/* Tidak ditemukan layanan dengan kata kunci "{searchTerm}" */}
                    Tidak ditemukan layanan dengan kata kunci &quot;{searchTerm}
                    &quot;
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("all");
                    }}
                    className="px-4 py-2 bg-blue-500  rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Reset Filter
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content - List View by Category */}
        {viewMode === "list" && (
          <div className="space-y-6">
            {servicesByCategory.map((category) => (
              <div
                key={category.id}
                className=" backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden"
              >
                {/* Category Header */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-700/50 px-6 py-4 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold ">{category.name}</h2>
                      <p className="text-sm ">
                        {category.services.length} layanan
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs ">ID: {category.id}</span>
                    </div>
                  </div>
                </div>

                {/* Services List */}
                <div className="divide-y divide-gray-700">
                  {category.services.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => handleTopupClick(service)}
                      className="flex items-center px-6 py-4 hover: cursor-pointer transition-colors group"
                    >
                      {/* Service Logo */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden  flex-shrink-0 mr-4">
                        {service.logo ? (
                          <Image
                            src={service.logo}
                            alt={service.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 " />
                          </div>
                        )}
                      </div>

                      {/* Service Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-1">
                          <h3 className=" font-semibold group-hover:text-blue-400 transition-colors">
                            {service.name}
                          </h3>
                          {service.is_popular && (
                            <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                              Popular
                            </span>
                          )}
                        </div>

                        <p className="text-sm  truncate max-w-2xl">
                          {service.description || "Tidak ada deskripsi"}
                        </p>

                        {/* Meta Info */}
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs ">Slug: {service.slug}</span>
                          {service.customer_no_format && (
                            <span className="text-xs ">
                              Format:{" "}
                              {service.customer_no_format === "satu_input"
                                ? "Single"
                                : "Dual"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Badges & Action */}
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col items-end space-y-1">
                          {getStatusBadge(service)}
                          {service.field1_label && (
                            <span className="text-xs ">
                              {service.field1_label}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5  group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {servicesByCategory.length === 0 && (
              <div className="text-center py-16  rounded-2xl">
                <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl  mb-2">Tidak ada layanan</h3>
                <p className="">
                  Tidak ditemukan layanan dengan filter yang dipilih
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
