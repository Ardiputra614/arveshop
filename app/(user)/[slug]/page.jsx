"use client";

import React, { useState, useEffect, useCallback } from "react";
import FormatRupiah from "../../../components/home/FormatRupiah";
import axios from "axios";
import { useParams } from "next/navigation";
import Image from "next/image";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

// =============================================
// KOMPONEN: PLN Inquiry Result Card
// =============================================
const PLNResultCard = ({ data, onReset }) => (
  <div className="rounded-xl p-4 border border-green-500/40 bg-green-500/10 mt-3">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center shrink-0">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div>
          <p className="text-green-400 text-xs font-semibold uppercase tracking-wide mb-1">
            Data Pelanggan Ditemukan
          </p>
          <p className="text-white font-bold text-lg">{data.name}</p>
          <div className="mt-1 space-y-0.5">
            <p className="text-gray-300 text-sm">
              No. Pelanggan:{" "}
              <span className="font-mono text-gray-100">
                {data.customer_no}
              </span>
            </p>
            <p className="text-gray-300 text-sm">
              No. Meter:{" "}
              <span className="font-mono text-gray-100">{data.meter_no}</span>
            </p>
            <p className="text-gray-300 text-sm">
              Daya:{" "}
              <span className="text-yellow-400 font-semibold">
                {data.segment_power}
              </span>
            </p>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="text-gray-400 hover:text-white transition text-xs mt-1 shrink-0 ml-2"
      >
        Ubah
      </button>
    </div>
  </div>
);

// =============================================
// KOMPONEN: PLN Inquiry Error Card
// =============================================
const PLNErrorCard = ({ message }) => (
  <div className="rounded-xl p-4 border border-red-500/40 bg-red-500/10 mt-3">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center shrink-0">
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
      <div>
        <p className="text-red-400 text-xs font-semibold uppercase tracking-wide">
          Tidak Ditemukan
        </p>
        <p className="text-gray-300 text-sm mt-0.5">{message}</p>
      </div>
    </div>
  </div>
);

// =============================================
// MAIN COMPONENT
// =============================================
const GamesTopup = ({ payment, appUrl }) => {
  const url = process.env.NEXT_PUBLIC_GOLANG_URL;
  const params = useParams();
  const slug = params.slug;
  const router = useRouter();

  const COLORS = {
    primary: "#1F2937",
    secondary: "#374151",
    accent: "#4B5563",
    surface: "#111827",
    light: "#F9FAFB",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
    purple: "#8B5CF6",
    pink: "#EC4899",
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [service, setService] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);

  // PLN Inquiry State
  const [plnData, setPlnData] = useState(null); // hasil sukses
  const [plnError, setPlnError] = useState(null); // pesan error
  const [plnLoading, setPlnLoading] = useState(false); // loading cek

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsRes, serviceRes, paymentRes] = await Promise.all([
          axios.get(`${url}/api/products/${slug}`),
          axios.get(`${url}/api/service/${slug}`),
          axios.get(`${url}/api/payment-method`),
        ]);
        setProducts(productsRes.data.data || []);
        setService(serviceRes.data.data || null);
        setPaymentMethods(paymentRes.data.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchData();
  }, [slug, url]);

  const [accountData, setAccountData] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [waPembeli, setWaPembeli] = useState("");
  const [loadingOrder, setLoadingOrder] = useState(false);

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
    const cleaned = value.replace(/\s+/g, "");
    setAccountData((prev) => ({ ...prev, [fieldKey]: cleaned }));

    // Reset PLN result kalau user ubah input
    if (isPlnProduct) {
      setPlnData(null);
      setPlnError(null);
    }
  };

  // =============================================
  // PLN INQUIRY — hit backend kita sendiri
  // =============================================
  const handlePLNInquiry = async () => {
    const customerNo = accountData.field1?.trim();
    if (!customerNo) return;

    setPlnLoading(true);
    setPlnData(null);
    setPlnError(null);

    try {
      const response = await axios.post(`${url}/api/inquiry-pln`, {
        customer_no: customerNo,
      });

      if (response.data.success) {
        setPlnData(response.data);
        toast.success(`Pelanggan ditemukan: ${response.data.name}`);
      } else {
        setPlnError(response.data.message || "Nomor tidak ditemukan");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menghubungi server";
      setPlnError(msg);
      toast.error(msg);
    } finally {
      setPlnLoading(false);
    }
  };

  const resetPLN = () => {
    setPlnData(null);
    setPlnError(null);
    setAccountData({});
  };

  // Form complete check
  // Khusus PLN: harus ada plnData (inquiry sukses) sebelum bisa lanjut
  useEffect(() => {
    const accountOk = isAccountComplete();
    const plnOk = isPlnProduct ? !!plnData : true;
    const isValid =
      accountOk && plnOk && selectedProduct && paymentMethod && waPembeli;
    setIsFormComplete(isValid);
  }, [
    accountData,
    selectedProduct,
    paymentMethod,
    waPembeli,
    plnData,
    isPlnProduct,
  ]);

  // =============================================
  // RENDER INPUT AKUN
  // =============================================
  const renderAccountInputs = () => {
    if (!service) return null;

    return (
      <div className="space-y-4">
        {/* Field 1 */}
        <div className="space-y-2">
          <label
            className="block text-sm font-medium text-gray-200"
            htmlFor="field1"
          >
            {service.field1_label || "Field 1"} *
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                id="field1"
                className="w-full px-4 py-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 transition bg-gray-800 text-gray-100 border-gray-700 focus:border-blue-500 focus:ring-blue-500/30"
                placeholder={service.field1_placeholder || "Masukkan data"}
                value={accountData.field1 || ""}
                onChange={(e) => handleAccountChange("field1", e.target.value)}
                // Kalau PLN sudah dapat data, disable input
                disabled={isPlnProduct && !!plnData}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>

            {/* Tombol Cek khusus PLN */}
            {isPlnProduct && !plnData && (
              <button
                type="button"
                onClick={handlePLNInquiry}
                disabled={!accountData.field1?.trim() || plnLoading}
                className="px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: accountData.field1?.trim()
                    ? `linear-gradient(135deg, ${COLORS.info}, ${COLORS.purple})`
                    : COLORS.secondary,
                  color: "white",
                  minWidth: "80px",
                }}
              >
                {plnLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Cek...</span>
                  </div>
                ) : (
                  "Cek PLN"
                )}
              </button>
            )}
          </div>

          {service.example_format && (
            <p className="text-xs text-gray-400">
              Contoh: {service.example_format}
            </p>
          )}
        </div>

        {/* Hasil Inquiry PLN */}
        {isPlnProduct && plnData && (
          <PLNResultCard data={plnData} onReset={resetPLN} />
        )}
        {isPlnProduct && plnError && !plnData && (
          <PLNErrorCard message={plnError} />
        )}

        {/* Field 2 - hanya untuk dua_input & bukan PLN (PLN selalu satu input) */}
        {!isPlnProduct &&
          service.customer_no_format === "dua_input" &&
          service.field2_label && (
            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-gray-200"
                htmlFor="field2"
              >
                {service.field2_label} *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="field2"
                  className="w-full px-4 py-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 transition bg-gray-800 text-gray-100 border-gray-700 focus:border-blue-500 focus:ring-blue-500/30"
                  placeholder={service.field2_placeholder || "Masukkan data"}
                  value={accountData.field2 || ""}
                  onChange={(e) =>
                    handleAccountChange("field2", e.target.value)
                  }
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )}

        {/* Non-PLN: tampilkan preview data lengkap seperti sebelumnya */}
        {!isPlnProduct && isAccountComplete() && (
          <div className="rounded-xl p-4 border border-green-500/40 bg-green-500/10">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center mr-3">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-100">Data sudah terisi</p>
                <p className="text-gray-300 text-sm font-mono break-all">
                  {formatCustomerNo()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // =============================================
  // PRODUCT CARD
  // =============================================
  const ProductCard = ({ product, selectedProduct, onSelect, color }) => {
    const isSelected = selectedProduct?.id === product.id;
    const isActive =
      product.buyer_product_status && product.seller_product_status;

    if (!isActive) {
      return (
        <div
          className="relative border-2 rounded-xl p-4 cursor-not-allowed opacity-60"
          style={{
            backgroundColor: COLORS.secondary + "80",
            borderColor: COLORS.error + "40",
          }}
        >
          <div className="absolute top-2 right-2">
            <div
              className="text-xs px-2 py-1 rounded-full font-medium"
              style={{
                backgroundColor: COLORS.error + "30",
                color: COLORS.error,
              }}
            >
              TIDAK AKTIF
            </div>
          </div>
          <div className="font-bold text-gray-400 mb-2 line-clamp-2">
            {product.product_name}
          </div>
          <div className="text-lg font-bold text-gray-500">
            <FormatRupiah value={product.selling_price} />
          </div>
        </div>
      );
    }

    return (
      <div
        className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:transform hover:-translate-y-1 ${
          isSelected
            ? "shadow-lg scale-105"
            : "border-gray-700 hover:border-gray-500"
        }`}
        onClick={() => onSelect(product)}
        style={{
          backgroundColor: isSelected ? `${color}20` : COLORS.secondary,
          borderColor: isSelected ? color : "transparent",
        }}
      >
        {isSelected && (
          <div
            className="absolute -top-2 -right-2 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md"
            style={{ backgroundColor: color }}
          >
            ✓
          </div>
        )}
        <div className="font-bold text-gray-100 mb-2 line-clamp-2">
          {product.product_name}
        </div>
        <div className="text-lg font-bold text-white">
          <FormatRupiah value={product.selling_price} />
        </div>
      </div>
    );
  };

  const renderProducts = () => {
    if (loading)
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-gray-400 mt-4">Memuat produk...</p>
        </div>
      );

    if (error)
      return (
        <div className="text-center py-12 text-red-400">
          <p>Error: {error}</p>
        </div>
      );

    if (!products || products.length === 0)
      return (
        <div className="text-center py-12 text-gray-400">
          <p>Tidak ada produk tersedia untuk {slug}</p>
        </div>
      );

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            selectedProduct={selectedProduct}
            onSelect={setSelectedProduct}
            color={COLORS.accent}
          />
        ))}
      </div>
    );
  };

  const calculateTotalFee = () => {
    if (!paymentMethod || !selectedProduct) return 0;
    const price = Number(selectedProduct.selling_price) || 0;
    let fee = 0;
    if (paymentMethod.percentase_fee > 0)
      fee += (price * paymentMethod.percentase_fee) / 100;
    fee += Number(paymentMethod.nominal_fee) || 0;
    return fee;
  };

  const calculateTotalPayment = () => {
    const price = Number(selectedProduct?.selling_price) || 0;
    return price + calculateTotalFee();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormComplete) {
      alert("Mohon lengkapi semua data terlebih dahulu.");
      return;
    }

    // Khusus PLN — kalau belum cek inquiry, blokir
    if (isPlnProduct && !plnData) {
      toast.error("Mohon cek nomor PLN terlebih dahulu.");
      return;
    }

    const customerNo = formatCustomerNo();
    const data = {
      id: selectedProduct.id,
      buyer_sku_code: selectedProduct.buyer_sku_code,
      product_name: selectedProduct.product_name,
      selling_price: selectedProduct.selling_price,
      purchase_price: selectedProduct.price,
      product_type: selectedProduct.product_type,
      gross_amount: calculateTotalPayment(),
      fee: calculateTotalFee(),
      payment_method_id: paymentMethod.id,
      payment_method_name: paymentMethod.name,
      payment_type: paymentMethod.type,
      customer_no: customerNo,
      wa_pembeli: waPembeli,
      customer_no_format: service?.customer_no_format,
      // Kirim data PLN juga kalau ada (opsional, untuk disimpan di transaksi)
      ...(isPlnProduct &&
        plnData && {
          pln_name: plnData.name,
          pln_subscriber_id: plnData.subscriber_id,
          pln_segment_power: plnData.segment_power,
        }),
    };

    setLoadingOrder(true);
    try {
      const response = await axios.post(`${url}/api/create-transaction`, data);
      toast.success("Berhasil membuat transaksi");
      router.push(`/history/${response.data.data.transaction.order_id}`);
    } catch (error) {
      toast.error("Gagal membuat transaksi");
      console.error(error);
    } finally {
      setLoadingOrder(false);
    }
  };

  if (loading && products.length === 0 && !service) {
    return (
      <div className="min-h-screen bg-[#37353E] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-[#37353E] flex items-center justify-center">
        <div className="text-white">Service tidak ditemukan</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#37353E]">
      <div className="container mx-auto px-4 max-w-7xl py-6">
        {/* Header */}
        <div
          className="rounded-2xl shadow-xl overflow-hidden mb-6"
          style={{ backgroundColor: COLORS.primary }}
        >
          <div
            className="p-6 md:p-8"
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary}, ${COLORS.accent})`,
            }}
          >
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="relative">
                <Image
                  src={service.logo || "/default-game-logo.png"}
                  alt={`${service.name} Logo`}
                  className="w-24 h-24 md:w-28 md:h-28 rounded-xl shadow-2xl object-cover border-4 border-white/20"
                  width={112}
                  height={112}
                />
                <div
                  className="absolute -bottom-2 -right-2 text-white text-xs font-bold px-3 py-1 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.warning}, ${COLORS.accent})`,
                  }}
                >
                  {isPlnProduct ? "PLN" : "TOP UP"}
                </div>
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {service.name}
                </h1>
                <p className="text-gray-300 text-lg">
                  {service.description ||
                    (isPlnProduct
                      ? "Bayar tagihan listrik dengan mudah"
                      : "Top up dengan cepat, aman, dan terpercaya")}
                </p>
                {isPlnProduct && (
                  <p className="text-yellow-400 text-sm mt-2 font-medium">
                    ⚡ Masukkan nomor meter/ID pelanggan dan tekan "Cek PLN"
                    sebelum melanjutkan
                  </p>
                )}
                {service.notes && (
                  <p className="text-sm text-gray-400 mt-2">{service.notes}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="lg:flex lg:space-x-6">
            {/* Left Column */}
            <div className="lg:w-8/12">
              {/* Step 1: Data Akun */}
              <div
                className="rounded-2xl shadow-lg mb-6"
                style={{ backgroundColor: COLORS.primary }}
              >
                <div className="p-6 md:p-8">
                  <div className="flex items-center mb-6">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mr-4"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.info}, ${COLORS.secondary})`,
                      }}
                    >
                      <span className="text-white font-bold">1</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-100">
                      Data {isPlnProduct ? "PLN" : "Akun"}
                    </h2>
                  </div>
                  {renderAccountInputs()}
                </div>
              </div>

              {/* Step 2: Pilih Nominal */}
              <div
                className="rounded-2xl shadow-lg mb-6"
                style={{ backgroundColor: COLORS.primary }}
              >
                <div className="p-6 md:p-8">
                  <div className="flex items-center mb-6">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mr-4"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.secondary})`,
                      }}
                    >
                      <span className="text-white font-bold">2</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-100">
                      Pilih Nominal
                    </h2>
                    <div className="ml-auto text-sm text-gray-400">
                      {products.length} produk tersedia
                    </div>
                  </div>
                  {renderProducts()}
                </div>
              </div>

              {/* Step 3: Metode Pembayaran */}
              <div
                className="rounded-2xl shadow-lg mb-6"
                style={{ backgroundColor: COLORS.primary }}
              >
                <div className="p-6 md:p-8">
                  <div className="flex items-center mb-6">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mr-4"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.pink}, ${COLORS.secondary})`,
                      }}
                    >
                      <span className="text-white font-bold">3</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-100">
                      Pilih Metode Pembayaran
                    </h2>
                  </div>
                  <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-4">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`border-2 rounded-xl p-4 flex items-center cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                          paymentMethod?.id === method.id
                            ? "shadow-lg scale-105"
                            : ""
                        }`}
                        onClick={() => setPaymentMethod(method)}
                        style={{
                          backgroundColor:
                            paymentMethod?.id === method.id
                              ? COLORS.secondary
                              : COLORS.primary,
                          borderColor:
                            paymentMethod?.id === method.id
                              ? COLORS.success
                              : COLORS.accent,
                        }}
                      >
                        {method.logo && (
                          <Image
                            src={method.logo}
                            alt={method.name}
                            width={32}
                            height={32}
                            className="object-contain mr-3"
                          />
                        )}
                        <div className="flex-grow">
                          <div className="font-semibold text-gray-100">
                            {method.name}
                          </div>
                        </div>
                        {paymentMethod?.id === method.id && (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: COLORS.success }}
                          >
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 4: WhatsApp */}
              <div
                className="rounded-2xl shadow-lg mb-6"
                style={{ backgroundColor: COLORS.primary }}
              >
                <div className="p-6 md:p-8">
                  <div className="flex items-center mb-6">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mr-4"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.warning}, ${COLORS.secondary})`,
                      }}
                    >
                      <span className="text-white font-bold">4</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-100">
                      Data Pembeli
                    </h2>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-200">
                      Nomor WhatsApp (untuk notifikasi)
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <span className="text-gray-400">+62</span>
                      </div>
                      <input
                        type="tel"
                        className="w-full px-4 py-3 pl-16 border rounded-lg focus:outline-none focus:ring-2 transition bg-gray-800 text-gray-100 border-gray-700 focus:border-green-500 focus:ring-green-500/30"
                        placeholder="81234567890"
                        value={waPembeli}
                        onChange={(e) => setWaPembeli(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      Nomor akan digunakan untuk mengirim notifikasi status
                      transaksi
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Konfirmasi Pembayaran */}
            <div className="lg:w-4/12">
              <div
                className="rounded-2xl shadow-lg overflow-hidden sticky top-6"
                style={{ backgroundColor: COLORS.primary }}
              >
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-100 mb-4">
                    Konfirmasi Pembayaran
                  </h3>

                  {selectedProduct ? (
                    <>
                      <div
                        className="border rounded-lg overflow-hidden"
                        style={{ borderColor: COLORS.secondary }}
                      >
                        <div
                          className="p-4 border-b"
                          style={{ backgroundColor: COLORS.secondary }}
                        >
                          <h4 className="font-bold text-gray-100">
                            {selectedProduct.product_name}
                          </h4>
                          <p className="text-xs text-gray-400">
                            {selectedProduct.brand} - {selectedProduct.type}
                          </p>
                        </div>
                        <div className="p-4 space-y-3">
                          {/* Info PLN di summary */}
                          {isPlnProduct && plnData && (
                            <div
                              className="pb-3 border-b"
                              style={{ borderColor: COLORS.secondary }}
                            >
                              <p className="text-xs text-gray-400 mb-1">
                                Pelanggan PLN
                              </p>
                              <p className="text-sm font-semibold text-green-400">
                                {plnData.name}
                              </p>
                              <p className="text-xs font-mono text-gray-300">
                                {plnData.customer_no}
                              </p>
                              <p className="text-xs text-yellow-400">
                                {plnData.segment_power}
                              </p>
                            </div>
                          )}

                          {/* Info akun non-PLN */}
                          {!isPlnProduct && isAccountComplete() && (
                            <div
                              className="pb-3 border-b"
                              style={{ borderColor: COLORS.secondary }}
                            >
                              <p className="text-xs text-gray-400 mb-1">
                                Data Akun
                              </p>
                              <p className="text-sm font-mono font-semibold break-all text-gray-200">
                                {formatCustomerNo()}
                              </p>
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Harga</span>
                            <span className="font-semibold text-white">
                              <FormatRupiah
                                value={Number(
                                  selectedProduct.selling_price || 0,
                                )}
                              />
                            </span>
                          </div>

                          {paymentMethod && calculateTotalFee() > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-400">
                                Biaya Layanan
                              </span>
                              <span
                                className="font-semibold"
                                style={{ color: COLORS.error }}
                              >
                                <FormatRupiah value={calculateTotalFee()} />
                              </span>
                            </div>
                          )}

                          <div
                            className="flex justify-between items-center pt-3 border-t"
                            style={{ borderColor: COLORS.secondary }}
                          >
                            <span className="text-lg font-bold text-gray-100">
                              Total
                            </span>
                            <div
                              className="text-xl font-bold"
                              style={{ color: COLORS.success }}
                            >
                              <FormatRupiah value={calculateTotalPayment()} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Warning PLN belum cek */}
                      {isPlnProduct && !plnData && (
                        <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                          <p className="text-yellow-400 text-xs text-center">
                            ⚡ Cek nomor PLN terlebih dahulu untuk melanjutkan
                          </p>
                        </div>
                      )}

                      <div className="mt-4">
                        <button
                          type="submit"
                          disabled={!isFormComplete || loadingOrder}
                          className={`w-full py-3 rounded-xl transition-all duration-300 font-bold text-lg ${
                            isFormComplete
                              ? "text-white hover:scale-[1.02] shadow-lg hover:shadow-xl cursor-pointer"
                              : "bg-gray-700 text-gray-500 cursor-not-allowed"
                          }`}
                          style={
                            isFormComplete
                              ? {
                                  background: `linear-gradient(135deg, ${COLORS.success}, ${COLORS.info})`,
                                }
                              : {}
                          }
                        >
                          {loadingOrder ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Memproses...</span>
                            </div>
                          ) : isFormComplete ? (
                            "Pesan Sekarang"
                          ) : (
                            "Lengkapi Data"
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div
                      className="rounded-xl border border-dashed p-6 text-center"
                      style={{ borderColor: COLORS.secondary }}
                    >
                      <p className="text-gray-400">
                        Pilih produk terlebih dahulu
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* How to Top Up */}
        {service.how_to_topup && (
          <div
            className="rounded-2xl shadow-lg mt-6 p-6"
            style={{ backgroundColor: COLORS.primary }}
          >
            <h3 className="text-xl font-bold text-gray-100 mb-4">
              {isPlnProduct ? "Cara Bayar PLN" : "Cara Top Up"}
            </h3>
            <div
              className="text-gray-300 prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: service.how_to_topup }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GamesTopup;
