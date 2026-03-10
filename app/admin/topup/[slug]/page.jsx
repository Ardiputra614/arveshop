"use client";

import React, { useState, useEffect } from "react";
import FormatRupiah from "../../../../components/home/FormatRupiah";
import axios from "axios";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
// import { useUser } from "../../../hooks/useUser";
import { useUser } from "@/hooks/useUser";
// =============================================
// MAIN COMPONENT - ADMIN TOPUP SIMPLE
// =============================================
export default function AdminTopupSimple() {
  const url = process.env.NEXT_PUBLIC_GOLANG_URL;
  const params = useParams();
  const slug = params.slug;
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState(null);

  // Form state
  const [accountData, setAccountData] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [loadingOrder, setLoadingOrder] = useState(false);
  const { user, loading: userLoading } = useUser();
  const [waPembeli] = useState("");

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Validasi URL
        if (!url) {
          throw new Error("URL API tidak dikonfigurasi");
        }

        const [productsRes, serviceRes] = await Promise.all([
          axios.get(`${url}/api/products/${slug}`),
          axios.get(`${url}/api/service/${slug}`),
        ]);

        setProducts(productsRes.data.data || []);
        setService(serviceRes.data.data || null);
      } catch (error) {
        // 1. LOG KE KONSOL (untuk development)
        console.error("Error fetching data:", {
          message: error.message,
          url: `${url}/api/products/${slug}`,
          status: error.response?.status,
          data: error.response?.data,
        });

        // 2. TAMPILKAN PESAN ERROR KE USER
        let errorMessage = "Gagal memuat data";

        if (error.response) {
          // Error dari server (4xx, 5xx)
          switch (error.response.status) {
            case 404:
              errorMessage = "Data tidak ditemukan";
              break;
            case 500:
              errorMessage = "Server error, silahkan coba lagi";
              break;
            default:
              errorMessage = error.response.data?.message || errorMessage;
          }
        } else if (error.request) {
          // Network error
          errorMessage = "Koneksi ke server gagal";
        } else {
          // Other errors
          errorMessage = error.message || errorMessage;
        }

        // 3. KIRIM KE ERROR TRACKING SERVICE (opsional tapi recommended)
        if (process.env.NODE_ENV === "production") {
          // Contoh: send to Sentry, LogRocket, etc.
          captureException(error, { extra: { slug, url } });
        }

        // 4. TAMPILKAN KE USER
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        // 5. SET STATE KOSONG
        setProducts([]);
        setService(null);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchData();
  }, [slug, url]);

  const isPlnProduct = service?.category?.name?.toLowerCase() === "pln";

  const formatCustomerNo = () => {
    if (!service) return "";
    if (service.customer_no_format === "satu_input")
      return accountData.field1 || "";
    if (service.customer_no_format === "dua_input") {
      const f1 = accountData.field1 || "";
      const f2 = accountData.field2 || "";
      return f1 && f2 ? `${f1}|${f2}` : f1 || f2 || "";
    }
    return "";
  };

  const isAccountComplete = () => {
    if (!service) return false;
    if (service.customer_no_format === "satu_input")
      return !!accountData.field1?.trim();
    if (service.customer_no_format === "dua_input")
      return !!(accountData.field1?.trim() && accountData.field2?.trim());
    return false;
  };

  const handleAccountChange = (fieldKey, value) => {
    setAccountData((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const isFormComplete = () => {
    return isAccountComplete() && selectedProduct && customerName.trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormComplete()) {
      toast.error("Lengkapi semua data terlebih dahulu");
      return;
    }

    setLoadingOrder(true);

    try {
      const customerNo = formatCustomerNo();
      const categoryId = service?.category?.id;
      const categoryName = service?.category?.name;

      const data = {
        // Basic Info
        id: selectedProduct.id,
        buyer_sku_code: selectedProduct.buyer_sku_code,
        product_name: selectedProduct.product_name,
        selling_price: selectedProduct.selling_price,
        purchase_price: selectedProduct.price,
        product_type: selectedProduct.product_type || "game",
        user_id: user?.id,
        is_admin: false,

        // Payment
        gross_amount: selectedProduct.selling_price || 0,
        fee: 0,
        payment_method_id: null,
        payment_method_name: "cash",
        payment_type: "cash",

        // Customer
        customer_no: customerNo,
        wa_pembeli: waPembeli || "87864705664",
        customer_name: isPlnProduct ? plnData?.name || "" : customerName,
        customer_note: customerNote,
        customer_no_format: service?.customer_no_format,

        // Category
        category_id: categoryId,
        category_name: categoryName,

        // Admin (default false untuk user)
        is_admin: true,

        // PLN Specific
        ...(isPlnProduct &&
          plnData && {
            meter_no: plnData.meter_no,
            subscriber_id: plnData.subscriber_id,
            kwh: plnData.kwh,
            pln_name: plnData.name,
            pln_subscriber_id: plnData.subscriber_id,
            pln_segment_power: plnData.segment_power,
          }),
      };

      await axios.post(`${url}/api/create-transaction`, data);

      toast.success("Topup berhasil!");
      setTimeout(() => {
        router.push("/admin/topup");
      }, 1500);
    } catch (error) {
      toast.error("Gagal melakukan topup");
      console.error(error);
    } finally {
      setLoadingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="">Loading...</div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="">Service tidak ditemukan</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto px-4 max-w-7xl py-6">
        {/* Header */}
        <div className="rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold ">
                Admin Topup: {service.name}
              </h1>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Form Input */}
            <div className="lg:col-span-2 space-y-6">
              {/* Data Akun */}
              <div className="rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold  mb-4">
                  Data {isPlnProduct ? "PLN" : "Akun"}
                </h2>

                {/* Field 1 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium  mb-2">
                    {service.field1_label || "ID Pelanggan"} *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg   border border-gray-700 focus:border-blue-500 focus:outline-none"
                    placeholder={service.field1_placeholder || "Masukkan data"}
                    value={accountData.field1 || ""}
                    onChange={(e) =>
                      handleAccountChange("field1", e.target.value)
                    }
                  />
                  {service.example_format && (
                    <p className="text-xs text-gray-400 mt-1">
                      Contoh: {service.example_format}
                    </p>
                  )}
                </div>

                {/* Field 2 (jika dual input) */}
                {service.customer_no_format === "dua_input" &&
                  service.field2_label && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium  mb-2">
                        {service.field2_label} *
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-lg   border border-gray-700 focus:border-blue-500 focus:outline-none"
                        placeholder={
                          service.field2_placeholder || "Masukkan data"
                        }
                        value={accountData.field2 || ""}
                        onChange={(e) =>
                          handleAccountChange("field2", e.target.value)
                        }
                      />
                    </div>
                  )}

                {/* Preview data (jika sudah lengkap) */}
                {isAccountComplete() && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 text-sm font-medium">
                      Data siap:
                    </p>
                    <p className=" font-mono text-sm break-all">
                      {formatCustomerNo()}
                    </p>
                  </div>
                )}
              </div>

              {/* Data Pelanggan */}
              <div className="rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold  mb-4">Data Pelanggan</h2>

                <div className="mb-4">
                  <label className="block text-sm font-medium  mb-2">
                    Nama Pelanggan *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg   border border-gray-700 focus:border-blue-500 focus:outline-none"
                    placeholder="Masukkan nama pelanggan"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium  mb-2">
                    Catatan (opsional)
                  </label>
                  <textarea
                    className="w-full px-4 py-3 rounded-lg   border border-gray-700 focus:border-blue-500 focus:outline-none"
                    placeholder="Tambahkan catatan jika perlu"
                    rows="3"
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Produk & Checkout */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl shadow-lg p-6 sticky top-6">
                <h2 className="text-xl font-bold  mb-4">Pilih Nominal</h2>

                {/* Daftar Produk */}
                <div className="grid grid-cols-2 gap-3 mb-6 max-h-96 overflow-y-auto">
                  {products.map((product) => {
                    const isActive =
                      product.buyer_product_status &&
                      product.seller_product_status;
                    const isSelected = selectedProduct?.id === product.id;

                    if (!isActive) return null;

                    return (
                      <div
                        key={product.id}
                        onClick={() => setSelectedProduct(product)}
                        className={`
                          p-4 rounded-xl border-2 cursor-pointer transition-all
                          ${
                            isSelected
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-gray-700 hover:border-gray-500"
                          }
                        `}
                      >
                        <div className="font-medium  mb-1">
                          {product.product_name}
                        </div>
                        <div className="text-lg font-bold text-green-400">
                          <FormatRupiah value={product.selling_price} />
                        </div>
                      </div>
                    );
                  })}

                  {products.length === 0 && (
                    <p className="text-gray-400 text-center py-4">
                      Tidak ada produk
                    </p>
                  )}
                </div>

                {/* Ringkasan */}
                {selectedProduct && (
                  <div className="border-t border-gray-700 pt-4 mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Harga</span>
                      <span className=" font-semibold">
                        <FormatRupiah value={selectedProduct.selling_price} />
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Biaya Admin</span>
                      <span className="text-green-400 font-semibold">Rp 0</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t border-gray-700">
                      <span className="">Total</span>
                      <span className="text-green-400">
                        <FormatRupiah value={selectedProduct.selling_price} />
                      </span>
                    </div>
                  </div>
                )}

                {/* Tombol Submit */}
                <button
                  type="submit"
                  disabled={!isFormComplete() || loadingOrder}
                  className={`
                    w-full py-3 rounded-xl font-bold text-lg transition-all
                    ${
                      isFormComplete() && !loadingOrder
                        ? "bg-blue-500  hover:scale-[1.02] cursor-pointer"
                        : "bg-gray-700 text-gray-500 cursor-not-allowed"
                    }
                  `}
                >
                  {loadingOrder ? (
                    <span>Memproses...</span>
                  ) : (
                    "Proses Topup Admin"
                  )}
                </button>

                {/* Info tambahan */}
                <p className="text-xs text-gray-400 text-center mt-3">
                  * Pembayaran CASH langsung
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
