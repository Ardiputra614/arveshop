// app/history/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import axios from "axios";
import {
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Gamepad2,
  Zap,
  Phone,
  Wifi,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Copy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

// URL API
const API_URL = process.env.NEXT_PUBLIC_GOLANG_URL || "http://localhost:8080";

// Bikin axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default function HistoryPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter state
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    product_type: "",
    payment_status: "",
    search: "",
    start_date: "",
    end_date: "",
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });

      const queryString = params.toString() ? `?${params.toString()}` : "";

      const response = await api.get(`/api/history${queryString}`);
      const data = response.data;

      setTransactions(data.data || []);
      setPagination({
        total: data.total || 0,
        page: data.page || 1,
        limit: data.limit || 10,
        totalPages: data.total_pages || 1,
      });

      try {
        const summaryRes = await api.get("/api/history/summary");
        setSummary(summaryRes.data);
      } catch (summaryErr) {
        console.log("Summary error:", summaryErr);
      }
    } catch (err) {
      console.error("Error:", err);
      setError(
        err.response?.data?.error || err.message || "Gagal mengambil data",
      );

      if (err.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTransactions();
  }, [
    filters.page,
    filters.product_type,
    filters.payment_status,
    filters.start_date,
    filters.end_date,
    filters.search,
    fetchTransactions,
  ]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      product_type: "",
      payment_status: "",
      search: "",
      start_date: "",
      end_date: "",
    });
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: {
        color: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
        icon: Clock,
        text: "Menunggu",
      },
      settlement: {
        color: "bg-green-500/20 text-green-400 border border-green-500/30",
        icon: CheckCircle,
        text: "Berhasil",
      },
      success: {
        color: "bg-green-500/20 text-green-400 border border-green-500/30",
        icon: CheckCircle,
        text: "Berhasil",
      },
      failed: {
        color: "bg-red-500/20 text-red-400 border border-red-500/30",
        icon: XCircle,
        text: "Gagal",
      },
      expired: {
        color: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
        icon: XCircle,
        text: "Kadaluarsa",
      },
      deny: {
        color: "bg-red-500/20 text-red-400 border border-red-500/30",
        icon: XCircle,
        text: "Ditolak",
      },
      processing: {
        color: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
        icon: RefreshCw,
        text: "Diproses",
      },
    };

    const config = statusMap[status?.toLowerCase()] || statusMap.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getProductIcon = (productType) => {
    const type = productType?.toLowerCase() || "";
    if (type.includes("game"))
      return <Gamepad2 className="w-5 h-5 text-purple-400" />;
    if (type.includes("listrik") || type.includes("pln"))
      return <Zap className="w-5 h-5 text-yellow-400" />;
    if (type.includes("pulsa"))
      return <Phone className="w-5 h-5 text-blue-400" />;
    if (type.includes("data") || type.includes("internet"))
      return <Wifi className="w-5 h-5 text-green-400" />;
    return <DollarSign className="w-5 h-5 text-gray-400" />;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Order ID berhasil disalin!");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: id });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen text-gray-200">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-semibold text-gray-100">
            Riwayat Transaksi
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Lihat semua transaksi pembelian produk digital Anda
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Cards - lebih kecil */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-2 rounded-md">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Transaksi</p>
                  <p className="text-base font-semibold text-gray-200">
                    {summary.total_transactions || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 p-2 rounded-md">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Berhasil</p>
                  <p className="text-base font-semibold text-gray-200">
                    {summary.success_count || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-500/20 p-2 rounded-md">
                  <Clock className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Menunggu</p>
                  <p className="text-base font-semibold text-gray-200">
                    {summary.pending_count || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/20 p-2 rounded-md">
                  <Gamepad2 className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Belanja</p>
                  <p className="text-base font-semibold text-gray-200">
                    {formatPrice(summary.total_selling_price)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters - lebih compact */}
        <div className="bg-gray-900/30 rounded-lg border border-gray-800 mb-6">
          <div className="p-3 border-b border-gray-800">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-medium text-gray-300">Filter</h2>
              <button
                onClick={resetFilters}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Filter className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>

          <div className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {/* Search */}
              <div className="col-span-2">
                <form onSubmit={handleSearch} className="flex">
                  <input
                    type="text"
                    placeholder="Cari order ID, produk, nomor..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-l-md px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 bg-gray-800 border border-l-0 border-gray-700 rounded-r-md text-gray-400 hover:text-gray-300"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              {/* Product Type */}
              <select
                value={filters.product_type}
                onChange={(e) =>
                  handleFilterChange("product_type", e.target.value)
                }
                className="bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Semua Kategori</option>
                <option value="game">Game</option>
                <option value="pln">Token Listrik</option>
                <option value="pulsa">Pulsa</option>
                <option value="data">Paket Data</option>
              </select>

              {/* Status */}
              <select
                value={filters.payment_status}
                onChange={(e) =>
                  handleFilterChange("payment_status", e.target.value)
                }
                className="bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Semua Status</option>
                <option value="settlement">Berhasil</option>
                <option value="pending">Menunggu</option>
                <option value="processing">Diproses</option>
                <option value="failed">Gagal</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) =>
                    handleFilterChange("start_date", e.target.value)
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
                  placeholder="Dari"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) =>
                    handleFilterChange("end_date", e.target.value)
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
                  placeholder="Sampai"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-gray-900/30 rounded-lg border border-gray-800">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent"></div>
              <p className="text-xs text-gray-500 mt-2">Loading...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <XCircle className="mx-auto h-8 w-8 text-red-500/50" />
              <p className="text-xs text-red-400 mt-2">{error}</p>
              <button
                onClick={fetchTransactions}
                className="mt-3 px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-md text-xs border border-indigo-500/30"
              >
                <RefreshCw className="w-3 h-3 mr-1 inline" />
                Coba Lagi
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-white">Tidak ada transaksi</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {transactions.map((transaction, index) => (
                <div
                  key={transaction.id}
                  className="p-4 hover:bg-gray-800/50 transition-colors"
                >
                  {/* Label Terbaru */}
                  {index === 0 && (
                    <div className="mb-2">
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
                        🆕 Terbaru
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between gap-4">
                    <div className="flex gap-3 min-w-0">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getProductIcon(transaction.product_type)}
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-200 truncate">
                            {transaction.product_name || "Produk Digital"}
                          </h3>
                          <button
                            onClick={() =>
                              copyToClipboard(transaction.order_id)
                            }
                            className="text-white hover:text-gray-400 flex-shrink-0"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-[11px] text-white mt-0.5 flex flex-wrap items-center gap-x-2">
                          <span className="font-mono">
                            {transaction.order_id}
                          </span>
                          <span>•</span>
                          <span>{formatDate(transaction.created_at)}</span>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded text-gray-400 border border-gray-700">
                            {transaction.customer_no}
                          </span>

                          {transaction.meter_no && (
                            <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded text-gray-400 border border-gray-700">
                              Meter: {transaction.meter_no}
                            </span>
                          )}

                          {transaction.kwh && (
                            <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded text-gray-400 border border-gray-700">
                              {transaction.kwh} kWh
                            </span>
                          )}

                          {transaction.voucher_code && (
                            <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/30">
                              {transaction.voucher_code}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-gray-200">
                        {formatPrice(transaction.selling_price)}
                      </p>
                      <div className="mt-1">
                        {getStatusBadge(transaction.payment_status)}
                      </div>

                      {/* Actions */}
                      <div className="mt-2 flex justify-end gap-1.5">
                        <button
                          onClick={() =>
                            router.push(`/history/${transaction.order_id}`)
                          }
                          className="text-[10px] bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded border border-gray-700 text-gray-300"
                        >
                          <Eye className="w-3 h-3 inline mr-1" />
                          Detail
                        </button>

                        {transaction.url &&
                          transaction.payment_status === "pending" && (
                            <Link
                              href={`/history/${transaction.order_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] bg-indigo-500/20 hover:bg-indigo-500/30 px-2 py-1 rounded border border-indigo-500/30 text-indigo-400"
                            >
                              Bayar
                            </Link>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Status Message */}
                  {transaction.status_message && (
                    <div className="mt-2 text-[10px] text-white bg-gray-800/50 p-2 rounded border border-gray-800">
                      {transaction.status_message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination - lebih kecil */}
          {!loading && transactions.length > 0 && (
            <div className="p-3 border-t border-gray-800">
              <div className="flex justify-between items-center">
                <p className="text-[11px] text-white">
                  {Math.min(
                    (pagination.page - 1) * pagination.limit + 1,
                    pagination.total,
                  )}
                  -
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}{" "}
                  dari {pagination.total}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                    }
                    disabled={pagination.page === 1}
                    className="p-1 bg-gray-800 rounded border border-gray-700 disabled:opacity-50 hover:bg-gray-700"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                    }
                    disabled={pagination.page === pagination.totalPages}
                    className="p-1 bg-gray-800 rounded border border-gray-700 disabled:opacity-50 hover:bg-gray-700"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
