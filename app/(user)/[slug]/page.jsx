"use client";

import React, { useState, useEffect, useRef } from "react";
import FormatRupiah from "../../../components/home/FormatRupiah";
import axios from "axios";
import { useParams } from "next/navigation";
import Image from "next/image";

const GamesTopup = ({ payment, appUrl, game, formatConfig, exampleFormat }) => {
  const url = process.env.NEXT_PUBLIC_GOLANG_URL;
  const params = useParams();
  const slug = params.slug; // "aga"

  console.log("Slug:", slug);

  // === COLOR PALETTE DARK THEME ===
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

  // FETCH DATA DARI API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log("Fetching from:", `${url}/api/products/${slug}`);

        const response = await axios.get(`${url}/api/products/${slug}`);
        console.log("API Response:", response.data);

        // Data dari API adalah array products
        const productsData = response.data.data || [];
        setProducts(productsData);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProducts();
    }
  }, [slug, url]);

  // === BUILD GAME OBJECT DARI DATA PRODUCT PERTAMA ===
  const buildGameObject = () => {
    if (!products || products.length === 0) {
      // Return default game object jika tidak ada data
      return {
        id: 0,
        name: slug || "Game",
        logo: "",
        category: "game",
        description: `Top up ${slug || "game"}`,
        customer_no_format: "satu_input",
        field1_label: "ID Game",
        field1_placeholder: "Masukkan ID Game",
        field2_label: "",
        field2_placeholder: "",
        separator: "",
        how_to_topup: `
          <ol class="list-decimal pl-5 space-y-2">
            <li>Masukkan ID Game</li>
            <li>Pilih nominal yang diinginkan</li>
            <li>Pilih metode pembayaran</li>
            <li>Isi nomor WhatsApp untuk notifikasi</li>
            <li>Bayar dan tunggu proses</li>
          </ol>
        `,
      };
    }

    // Gunakan product pertama sebagai referensi game
    const firstProduct = products[0];

    // Tentukan format input berdasarkan category atau product_type
    let customerNoFormat = "satu_input";
    let field1Label = "ID Game";
    let field1Placeholder = "Masukkan ID Game";
    let field2Label = "";
    let field2Placeholder = "";

    // Cek apakah ini produk PLN
    const isPln =
      firstProduct.product_name?.toLowerCase().includes("pln") ||
      firstProduct.category === "pln" ||
      slug?.toLowerCase() === "pln";

    if (isPln) {
      customerNoFormat = "satu_input";
      field1Label = "Nomor Meteran PLN";
      field1Placeholder = "Contoh: 12345678901";
    } else if (
      firstProduct.category === "pulsa" ||
      firstProduct.product_type === "pulsa"
    ) {
      customerNoFormat = "satu_input";
      field1Label = "Nomor HP";
      field1Placeholder = "Contoh: 081234567890";
    } else if (
      firstProduct.category === "data" ||
      firstProduct.product_type === "data"
    ) {
      customerNoFormat = "satu_input";
      field1Label = "Nomor HP";
      field1Placeholder = "Contoh: 081234567890";
    }

    return {
      id: firstProduct.id,
      name: firstProduct.product_name || slug || "Game",
      logo: "", // API tidak punya logo, bisa pakai default
      category: firstProduct.category || "game",
      description:
        firstProduct.desc || `Top up ${firstProduct.product_name || "game"}`,
      customer_no_format: customerNoFormat,
      field1_label: field1Label,
      field1_placeholder: field1Placeholder,
      field2_label: field2Label,
      field2_placeholder: field2Placeholder,
      separator: "",
      how_to_topup: `
        <ol class="list-decimal pl-5 space-y-2">
          <li>Masukkan ${field1Label}</li>
          <li>Pilih nominal yang diinginkan</li>
          <li>Pilih metode pembayaran</li>
          <li>Isi nomor WhatsApp untuk notifikasi</li>
          <li>Bayar dan tunggu proses</li>
        </ol>
      `,
    };
  };

  // Build game object dari data products
  const finalGame = buildGameObject();

  // Cek apakah ini produk PLN
  const isPlnProduct =
    finalGame.name?.toLowerCase().includes("pln") ||
    slug?.toLowerCase() === "pln";

  // === DATA DUMMY UNTUK PAYMENT (sementara) ===
  const dummyPayment = [
    {
      id: 1,
      name: "QRIS",
      logo: "payment/qris.png",
      percentase_fee: 1,
      nominal_fee: 0,
      payment_type: "qris",
    },
    {
      id: 2,
      name: "BANK BCA",
      logo: "payment/bca.png",
      percentase_fee: 0,
      nominal_fee: 1500,
      payment_type: "bank_transfer",
    },
    {
      id: 3,
      name: "DANA",
      logo: "payment/dana.png",
      percentase_fee: 0.5,
      nominal_fee: 0,
      payment_type: "ewallet",
    },
  ];

  const finalPayment = payment || dummyPayment;
  const finalAppUrl = appUrl || "http://localhost:3000";

  // State untuk data akun
  const [accountData, setAccountData] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [waPembeli, setWaPembeli] = useState("");
  const [activeStep, setActiveStep] = useState(1);
  const [activeCategory, setActiveCategory] = useState("all");
  const [isCheckingPln, setIsCheckingPln] = useState(false);
  const [plnData, setPlnData] = useState(null);
  const [plnError, setPlnError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  // Format customer number
  const formatCustomerNo = () => {
    if (!finalGame) return "";

    if (finalGame.customer_no_format === "satu_input") {
      return accountData.field1 || "";
    }

    if (finalGame.customer_no_format === "dua_input") {
      const field1 = accountData.field1 || "";
      const field2 = accountData.field2 || "";
      const separator = finalGame.separator || "";

      if (field1 && !field2) return field1;
      if (!field1 && field2) return field2;
      if (field1 && field2) {
        return `${field1}${separator}${field2}`;
      }
      return "";
    }

    return "";
  };

  // Cek apakah akun sudah lengkap
  const isAccountComplete = () => {
    if (!finalGame) return false;

    if (finalGame.customer_no_format === "satu_input") {
      return accountData.field1 && accountData.field1.trim() !== "";
    }

    if (finalGame.customer_no_format === "dua_input") {
      return (
        accountData.field1 &&
        accountData.field1.trim() !== "" &&
        accountData.field2 &&
        accountData.field2.trim() !== ""
      );
    }

    return false;
  };

  // Handle perubahan input akun
  const handleAccountChange = (fieldKey, value) => {
    const cleanedValue = value.replace(/\s+/g, "");
    setAccountData((prev) => ({
      ...prev,
      [fieldKey]: cleanedValue,
    }));
  };

  // Render input fields
  const renderAccountInputs = () => {
    return (
      <div className="space-y-4">
        {/* Preview jika sudah ada data */}
        {isAccountComplete() && (
          <div
            className="mb-6 rounded-xl p-4"
            style={{
              backgroundColor: COLORS.success + "20",
              border: `1px solid ${COLORS.success}40`,
            }}
          >
            <div className="flex items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
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
              <div>
                <p className="font-semibold text-gray-100">Data sudah terisi</p>
                <p className="text-gray-300 text-sm font-mono break-all">
                  {formatCustomerNo()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Field 1 */}
        <div className="space-y-2">
          <label
            className="block text-sm font-medium text-gray-200"
            htmlFor="field1"
          >
            {finalGame.field1_label || "Field 1"} *
          </label>
          <div className="relative">
            <input
              type="text"
              id="field1"
              className="w-full px-4 py-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 transition bg-gray-800 text-gray-100 border-gray-700 focus:border-blue-500 focus:ring-blue-500/30"
              placeholder={finalGame.field1_placeholder || `Masukkan data`}
              value={accountData.field1 || ""}
              onChange={(e) => handleAccountChange("field1", e.target.value)}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
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

        {/* Field 2 jika ada */}
        {finalGame.customer_no_format === "dua_input" &&
          finalGame.field2_label && (
            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-gray-200"
                htmlFor="field2"
              >
                {finalGame.field2_label} *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="field2"
                  className="w-full px-4 py-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 transition bg-gray-800 text-gray-100 border-gray-700 focus:border-blue-500 focus:ring-blue-500/30"
                  placeholder={finalGame.field2_placeholder || `Masukkan data`}
                  value={accountData.field2 || ""}
                  onChange={(e) =>
                    handleAccountChange("field2", e.target.value)
                  }
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
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
      </div>
    );
  };

  // Cek form complete
  useEffect(() => {
    let isValid = false;

    isValid =
      isAccountComplete() && selectedProduct && paymentMethod && waPembeli;

    setIsFormComplete(isValid);
  }, [accountData, selectedProduct, paymentMethod, waPembeli]);

  // Product Card Component
  const ProductCard = ({ product, selectedProduct, onSelect, color }) => {
    const isSelected = selectedProduct?.id === product.id;

    // Cek apakah produk aktif
    const isActive =
      product.buyer_product_status === true &&
      product.seller_product_status === true;

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
            ? "shadow-lg scale-105 border-opacity-100"
            : "border-gray-700 hover:border-gray-500 border-opacity-50"
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

  // Render produk
  const renderProducts = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-gray-400 mt-4">Memuat produk...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12 text-red-400">
          <p>Error: {error}</p>
        </div>
      );
    }

    if (!products || products.length === 0) {
      return (
        <div className="text-center py-12 text-gray-400">
          <p>Tidak ada produk tersedia untuk {slug}</p>
        </div>
      );
    }

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

  // Calculate total payment
  const calculateTotalPayment = () => {
    if (!selectedProduct) return 0;

    const productPrice = Number(selectedProduct.selling_price) || 0;
    let totalFee = 0;

    if (paymentMethod) {
      if (paymentMethod.percentase_fee > 0) {
        totalFee += (productPrice * paymentMethod.percentase_fee) / 100;
      }
      totalFee += Number(paymentMethod.nominal_fee) || 0;
    }

    return productPrice + totalFee;
  };

  // Calculate total fee
  const calculateTotalFee = () => {
    if (!paymentMethod || !selectedProduct) return 0;

    const productPrice = Number(selectedProduct.selling_price) || 0;
    let totalFee = 0;

    if (paymentMethod.percentase_fee > 0) {
      totalFee += (productPrice * paymentMethod.percentase_fee) / 100;
    }
    totalFee += Number(paymentMethod.nominal_fee) || 0;

    return totalFee;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isFormComplete) {
      alert("Mohon lengkapi semua data terlebih dahulu.");
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
      paymentMethod: paymentMethod.name,
      customer_no: customerNo,
      payment_type: paymentMethod.payment_type,
      wa_pembeli: waPembeli,
    };

    console.log("Data yang dikirim:", data);
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-[#37353E] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#37353E]">
      <div className="container mx-auto px-4 max-w-7xl py-6">
        {/* Header dengan Game Info */}
        <div
          className="rounded-2xl shadow-xl overflow-hidden mb-6 transform transition duration-300 hover:shadow-2xl"
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
                  src={`${finalGame.logo}`}
                  alt={`${finalGame.name} Logo`}
                  className="w-24 h-24 md:w-28 md:h-28 rounded-xl shadow-2xl object-cover border-4 border-white/20 transform rotate-3 hover:rotate-0 transition-transform duration-300"
                />
                <div
                  className="absolute -bottom-2 -right-2 text-white text-xs font-bold px-3 py-1 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.warning}, ${COLORS.accent})`,
                  }}
                >
                  TOP UP
                </div>
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {finalGame.name}
                </h1>
                <p className="text-gray-300 text-lg">
                  {isPlnProduct
                    ? "Bayar tagihan listrik dengan mudah"
                    : finalGame.description ||
                      "Top up dengan cepat, aman, dan terpercaya"}
                </p>
                {/* Real-time indicator (dikomentari sementara) */}
                {/* <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-700/30">
                                        <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
                                        Real-time Product Updates
                                    </div> */}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="lg:flex lg:space-x-6">
            {/* Left Column */}
            <div className="lg:w-8/12">
              {/* Account Data */}
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
                  <div className="space-y-6">{renderAccountInputs()}</div>
                </div>
              </div>

              {/* Select Product */}
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

              {/* Payment Method */}
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
                    {finalPayment.map((method) => (
                      <div
                        key={method.id}
                        className={`border-2 rounded-xl p-4 flex items-center cursor-pointer transition-all duration-300 hover:shadow-lg hover:transform hover:-translate-y-1 ${
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
                        <div className="flex-grow">
                          <div className="font-semibold text-gray-100 uppercase">
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

              {/* WhatsApp */}
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

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-200">
                        Nomor WhatsApp
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
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
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Payment Confirmation */}
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
                          style={{
                            backgroundColor: COLORS.secondary,
                          }}
                        >
                          <h4 className="font-bold text-gray-100">
                            {selectedProduct.product_name}
                          </h4>
                        </div>

                        <div className="p-4 space-y-3">
                          {isAccountComplete() && (
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
                            <div>
                              <span className="text-lg font-bold text-gray-100">
                                Total
                              </span>
                            </div>
                            <div className="text-right">
                              <div
                                className="text-xl font-bold"
                                style={{ color: COLORS.success }}
                              >
                                <FormatRupiah value={calculateTotalPayment()} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <button
                          type="submit"
                          disabled={!isFormComplete}
                          className={`w-full py-3 rounded-xl transition-all duration-300 transform font-bold text-lg ${
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
                          {isFormComplete ? "Bayar Sekarang" : "Lengkapi Data"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div
                      className="rounded-xl border border-dashed p-6 text-center"
                      style={{
                        borderLeft: `2px solid ${COLORS.secondary}`,
                      }}
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
      </div>
    </div>
  );
};

export default GamesTopup;
