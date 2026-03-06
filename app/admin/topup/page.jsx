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

  const getFormatBadge = (service) => {
    if (!service.customer_no_format) return null;
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          service.customer_no_format === "satu_input"
            ? "bg-blue-500/20 text-blue-400"
            : "bg-purple-500/20 text-purple-400"
        }`}
      >
        {service.customer_no_format === "satu_input"
          ? "Single Input"
          : "Dual Input"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">Memuat data layanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with Welcome Message */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                Admin Topup Panel
              </h1>
              <p className="text-gray-400 text-lg">
                Kelola dan lakukan topup untuk semua layanan dengan mudah
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-blue-500 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-blue-500 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Layanan</p>
                <p className="text-3xl font-bold text-white">
                  {stats.totalServices}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Semua layanan tersedia
                </p>
              </div>
              <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                <Package className="w-7 h-7 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Kategori</p>
                <p className="text-3xl font-bold text-white">
                  {stats.totalCategories}
                </p>
                <p className="text-xs text-gray-500 mt-2">Kelompok layanan</p>
              </div>
              <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                <Filter className="w-7 h-7 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-green-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Layanan Aktif</p>
                <p className="text-3xl font-bold text-white">
                  {stats.activeServices}
                </p>
                <p className="text-xs text-green-400 mt-2">Siap digunakan</p>
              </div>
              <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-yellow-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Populer</p>
                <p className="text-3xl font-bold text-white">
                  {stats.popularServices}
                </p>
                <p className="text-xs text-yellow-400 mt-2">Sering digunakan</p>
              </div>
              <div className="w-14 h-14 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
                <Users className="w-7 h-7 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 mb-8 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari layanan berdasarkan nama, deskripsi, atau slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  ×
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="md:w-72 relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <p className="text-gray-400">
              Menampilkan{" "}
              <span className="text-white font-semibold">
                {filteredServices.length}
              </span>{" "}
              dari{" "}
              <span className="text-white font-semibold">
                {services.length}
              </span>{" "}
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
                className="group bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 cursor-pointer hover:bg-gray-800 transition-all border border-gray-700 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10"
              >
                {/* Header with Image */}
                <div className="flex items-start space-x-4 mb-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-700 flex-shrink-0 group-hover:scale-105 transition-transform">
                    {service.logo ? (
                      <img
                        src={service.logo}
                        alt={service.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://via.placeholder.com/64?text=No+Image";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                        <Package className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate group-hover:text-blue-400 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-xs text-gray-400 truncate">
                      {service.slug}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-400 mb-4 line-clamp-2 min-h-[40px]">
                  {service.description || "Tidak ada deskripsi"}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {getStatusBadge(service)}
                  {getFormatBadge(service)}
                  {service.is_popular && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
                      Popular
                    </span>
                  )}
                </div>

                {/* Category & Action */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                  <span className="text-xs text-gray-500">
                    {categories.find(
                      (c) => String(c.id) === String(service.category_id),
                    )?.name || "Unknown"}
                  </span>
                  <div className="flex items-center text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Topup</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>

                {/* Hover Effect Indicator */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </div>
            ))}

            {filteredServices.length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="bg-gray-800/30 rounded-2xl p-8 max-w-md mx-auto">
                  <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl text-white mb-2">Tidak ada layanan</h3>
                  <p className="text-gray-400 mb-4">
                    Tidak ditemukan layanan dengan kata kunci "{searchTerm}"
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("all");
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden"
              >
                {/* Category Header */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-700/50 px-6 py-4 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {category.name}
                      </h2>
                      <p className="text-sm text-gray-400">
                        {category.services.length} layanan
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        ID: {category.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Services List */}
                <div className="divide-y divide-gray-700">
                  {category.services.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => handleTopupClick(service)}
                      className="flex items-center px-6 py-4 hover:bg-gray-700/50 cursor-pointer transition-colors group"
                    >
                      {/* Service Logo */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0 mr-4">
                        {service.logo ? (
                          <img
                            src={service.logo}
                            alt={service.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                      </div>

                      {/* Service Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-1">
                          <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors">
                            {service.name}
                          </h3>
                          {service.is_popular && (
                            <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                              Popular
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-400 truncate max-w-2xl">
                          {service.description || "Tidak ada deskripsi"}
                        </p>

                        {/* Meta Info */}
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-gray-500">
                            Slug: {service.slug}
                          </span>
                          {service.customer_no_format && (
                            <span className="text-xs text-gray-500">
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
                            <span className="text-xs text-gray-500">
                              {service.field1_label}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {servicesByCategory.length === 0 && (
              <div className="text-center py-16 bg-gray-800/30 rounded-2xl">
                <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl text-white mb-2">Tidak ada layanan</h3>
                <p className="text-gray-400">
                  Tidak ditemukan layanan dengan filter yang dipilih
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats Footer */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/30 rounded-xl p-3 text-center">
            <Clock className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <p className="text-xs text-gray-400">Last Updated</p>
            <p className="text-sm text-white">
              {new Date().toLocaleDateString("id-ID")}
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-3 text-center">
            <DollarSign className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <p className="text-xs text-gray-400">Avg. Price</p>
            <p className="text-sm text-white">Rp 25.000 - 500.000</p>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-3 text-center">
            <Users className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <p className="text-xs text-gray-400">Today Topup</p>
            <p className="text-sm text-white">0</p>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-3 text-center">
            <Package className="w-4 h-4 text-gray-500 mx-auto mb-1" />
            <p className="text-xs text-gray-400">Products Total</p>
            <p className="text-sm text-white">-</p>
          </div>
        </div>
      </div>
    </div>
  );
}
