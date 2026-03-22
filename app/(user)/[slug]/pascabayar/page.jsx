"use client";

import { useState, useEffect, useCallback } from "react";
import DescDetail from "../../../../components/home/DescDetail";
import FormatRupiah from "../../../../components/home/FormatRupiah";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-toastify";
import { useUser } from "../../../../hooks/useUser";

const COLORS = {
  primary: "#1F2937",
  secondary: "#374151",
  accent: "#4B5563",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
  purple: "#8B5CF6",
  pink: "#EC4899",
};

const fmtRp = (val) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(val) || 0);

// ── BillDetailCard ─────────────────────────────────────────────────
const BillDetailCard = ({ data, onReset }) => (
  <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 overflow-hidden mt-3">
    <div className="flex items-center justify-between px-4 py-2.5 bg-blue-500/10 border-b border-blue-500/20">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        <span className="text-blue-300 text-xs font-semibold uppercase tracking-wide">
          Tagihan ditemukan
        </span>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="text-gray-400 hover:text-white text-xs transition-colors"
      >
        ← Ubah nomor
      </button>
    </div>
    <div className="px-4 py-4 border-b border-gray-700/50">
      <p className="text-gray-400 text-xs mb-1">Nama Pelanggan</p>
      <p className="text-white font-bold text-lg leading-tight">
        {data.customer_name}
      </p>
      <p className="text-gray-400 text-xs font-mono mt-0.5">
        {data.customer_no}
      </p>
      {data.periode && (
        <span className="inline-block mt-2 bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
          Periode: {data.periode}
        </span>
      )}
    </div>
    {data.raw_response && (
      <div className="px-2">
        <DescDetail data={data.raw_response} />
      </div>
    )}
    <div className="px-4 py-4 bg-gray-900/40 flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-xs mb-1">Total Tagihan</p>
        <p className="text-white font-bold text-xl">{fmtRp(data.price)}</p>
      </div>
      {Number(data.admin) > 0 && (
        <div className="text-right">
          <p className="text-gray-400 text-xs mb-1">Biaya Admin</p>
          <p className="text-yellow-400 font-semibold">+ {fmtRp(data.admin)}</p>
        </div>
      )}
    </div>
  </div>
);

const ErrorCard = ({ message, onReset }) => (
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
      <div className="flex-1">
        <p className="text-red-400 text-xs font-semibold uppercase tracking-wide">
          Tidak Ditemukan
        </p>
        <p className="text-gray-300 text-sm mt-0.5">{message}</p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="text-gray-400 hover:text-white text-xs shrink-0"
      >
        Coba lagi
      </button>
    </div>
  </div>
);

// ── MAIN ───────────────────────────────────────────────────────────
export default function PascabayarPage() {
  const url = process.env.NEXT_PUBLIC_GOLANG_URL;
  const params = useParams();
  const slug = params.slug;
  const router = useRouter();
  const { user } = useUser();

  const [service, setService] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [accountData, setAccountData] = useState({});
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [waPembeli, setWaPembeli] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [loadingOrder, setLoadingOrder] = useState(false);

  const [inquiryData, setInquiryData] = useState(null);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquiryError, setInquiryError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    const fetchAll = async () => {
      setPageLoading(true);
      try {
        const [svcRes, pmRes] = await Promise.all([
          axios.get(`${url}/api/service/${slug}`),
          axios.get(`${url}/api/payment-method`),
        ]);
        setService(svcRes.data.data);
        setPaymentMethods(pmRes.data.data || []);
      } catch {
        toast.error("Gagal memuat data");
      } finally {
        setPageLoading(false);
      }
    };
    fetchAll();
  }, [slug, url]);

  const formatCustomerNo = useCallback(() => {
    if (!service) return "";
    if (service.customer_no_format === "satu_input")
      return accountData.field1 || "";
    if (service.customer_no_format === "dua_input") {
      const f1 = accountData.field1 || "";
      const f2 = accountData.field2 || "";
      return f1 && f2 ? `${f1}${f2}` : f1 || f2;
    }
    return "";
  }, [service, accountData]);

  const isAccountComplete = useCallback(() => {
    if (!service) return false;
    if (service.customer_no_format === "satu_input")
      return !!accountData.field1?.trim();
    if (service.customer_no_format === "dua_input")
      return !!(accountData.field1?.trim() && accountData.field2?.trim());
    return false;
  }, [service, accountData]);

  const handleAccountChange = (key, value) => {
    setAccountData((prev) => ({ ...prev, [key]: value.replace(/\s+/g, "") }));
    setInquiryData(null);
    setInquiryError(null);
  };

  const resetInquiry = () => {
    setInquiryData(null);
    setInquiryError(null);
    setAccountData({});
  };

  console.log(service);

  const handleInquiry = async () => {
    const customerNo = formatCustomerNo();
    if (!customerNo || !service) return;
    setInquiryLoading(true);
    setInquiryData(null);
    setInquiryError(null);
    try {
      const res = await axios.post(
        `${url}/api/inquiry`,
        {
          customer_no: customerNo,
          buyer_sku_code: service.buyer_sku_code,
        },
        { withCredentials: true },
      );

      if (res.data.success && res.data.data) {
        const d = res.data.data;
        setInquiryData({
          customer_no: d.customer_no,
          customer_name: d.customer_name,
          price: d.price,
          admin: d.admin,
          selling_price: d.selling_price,
          periode: d.periode,
          raw_response: d,
        });
        toast.success(`Tagihan ditemukan: ${d.customer_name}`);
      } else {
        setInquiryError(res.data.message || "Tagihan tidak ditemukan");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal mengambil tagihan";
      setInquiryError(msg);
      toast.error(msg);
    } finally {
      setInquiryLoading(false);
    }
  };

  const basePrice = Number(
    inquiryData?.selling_price || inquiryData?.price || 0,
  );
  const totalFee = (() => {
    if (!paymentMethod || !basePrice) return 0;
    let fee = 0;
    if (paymentMethod.percentase_fee > 0)
      fee += (basePrice * paymentMethod.percentase_fee) / 100;
    fee += Number(paymentMethod.nominal_fee) || 0;
    return fee;
  })();
  const totalPayment = basePrice + totalFee;
  const isFormValid = !!inquiryData && !!paymentMethod && !!waPembeli.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error("Mohon lengkapi semua data terlebih dahulu.");
      return;
    }

    const body = {
      buyer_sku_code: service.buyer_sku_code,
      // buyer_sku_code: "pln",
      product_name: service.name,
      selling_price: inquiryData.selling_price || inquiryData.price,
      purchase_price: inquiryData.price,
      product_type: "pascabayar",
      user_id: user?.id || user?.user_id || null,
      is_admin: false,
      gross_amount: totalPayment,
      fee: totalFee,
      payment_method_id: paymentMethod.id,
      payment_method_name: paymentMethod.name,
      payment_type: paymentMethod.type,
      customer_no: inquiryData.customer_no,
      customer_name: inquiryData.customer_name,
      wa_pembeli: waPembeli,
      customer_note: customerNote,
      category_id: service.category?.id,
      category_name: service.category?.name,
      inquiry_data: inquiryData.raw_response,
    };

    setLoadingOrder(true);
    try {
      const res = await axios.post(`${url}/api/create-transaction`, body, {
        withCredentials: true,
      });
      toast.success("Berhasil membuat transaksi");
      router.push(`/history/${res.data.data.transaction.order_id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal membuat transaksi");
    } finally {
      setLoadingOrder(false);
    }
  };

  if (pageLoading && !service) {
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
        {/* ── Header ── */}
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
                  src={service.logo || "/default-logo.png"}
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
                  PASCABAYAR
                </div>
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {service.name}
                </h1>
                <p className="text-gray-300 text-lg">
                  {service.description || "Bayar tagihan dengan mudah & aman"}
                </p>
                {service.notes && (
                  <p className="text-sm text-gray-400 mt-2">{service.notes}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="lg:flex lg:space-x-6">
            {/* ── LEFT ── */}
            <div className="lg:w-8/12 space-y-6">
              {/* SECTION 1: Cek Tagihan */}
              <div
                className="rounded-2xl shadow-lg p-6"
                style={{ backgroundColor: COLORS.primary }}
              >
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
                    Cek Tagihan
                  </h2>
                </div>

                {!inquiryData && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-200">
                      {service.field1_label || "Nomor Pelanggan"} *
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          className="w-full px-4 py-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 transition bg-gray-800 text-gray-100 border-gray-700 focus:border-blue-500 focus:ring-blue-500/30"
                          placeholder={
                            service.field1_placeholder ||
                            "Masukkan nomor pelanggan"
                          }
                          value={accountData.field1 || ""}
                          onChange={(e) =>
                            handleAccountChange("field1", e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleInquiry();
                            }
                          }}
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
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleInquiry}
                        disabled={!isAccountComplete() || inquiryLoading}
                        className="px-4 py-3 rounded-lg font-semibold text-sm transition-all shrink-0 disabled:opacity-50"
                        style={{
                          background: isAccountComplete()
                            ? `linear-gradient(135deg, ${COLORS.info}, ${COLORS.purple})`
                            : COLORS.secondary,
                          color: "white",
                          minWidth: "120px",
                        }}
                      >
                        {inquiryLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Cek...</span>
                          </div>
                        ) : (
                          "Cek Tagihan"
                        )}
                      </button>
                    </div>

                    {service.customer_no_format === "dua_input" &&
                      service.field2_label && (
                        <div className="space-y-2 mt-3">
                          <label className="block text-sm font-medium text-gray-200">
                            {service.field2_label} *
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition bg-gray-800 text-gray-100 border-gray-700 focus:border-blue-500 focus:ring-blue-500/30"
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

                    {service.example_format && (
                      <p className="text-xs text-gray-400">
                        Contoh: {service.example_format}
                      </p>
                    )}
                  </div>
                )}

                {inquiryData && (
                  <BillDetailCard data={inquiryData} onReset={resetInquiry} />
                )}
                {inquiryError && !inquiryData && (
                  <ErrorCard message={inquiryError} onReset={resetInquiry} />
                )}
              </div>

              {/* SECTION 2: Metode Pembayaran */}
              <div
                className="rounded-2xl shadow-lg p-6"
                style={{ backgroundColor: COLORS.primary }}
              >
                <div className="flex items-center mb-6">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mr-4"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.pink}, ${COLORS.secondary})`,
                    }}
                  >
                    <span className="text-white font-bold">2</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-100">
                    Metode Pembayaran
                  </h2>
                </div>
                <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`border-2 rounded-xl p-4 flex items-center cursor-pointer transition-all ${
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

              {/* SECTION 3: Data Pembeli */}
              <div
                className="rounded-2xl shadow-lg p-6"
                style={{ backgroundColor: COLORS.primary }}
              >
                <div className="flex items-center mb-6">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mr-4"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.warning}, ${COLORS.secondary})`,
                    }}
                  >
                    <span className="text-white font-bold">3</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-100">
                    Data Pembeli
                  </h2>
                </div>
                <div className="space-y-4">
                  {inquiryData && (
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-blue-400 text-sm font-medium mb-1">
                        Nama dari tagihan
                      </p>
                      <p className="text-white">{inquiryData.customer_name}</p>
                      <p className="text-gray-400 text-xs mt-2">
                        Nama akan otomatis terisi
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Nomor WhatsApp <span className="text-red-400">*</span>
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
                    <p className="text-xs text-gray-400 mt-1">
                      Untuk notifikasi status transaksi
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Catatan (opsional)
                    </label>
                    <textarea
                      className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
                      placeholder="Tambahkan catatan jika perlu"
                      rows="3"
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Konfirmasi ── */}
            <div className="lg:w-4/12">
              <div
                className="rounded-2xl shadow-lg overflow-hidden sticky top-6"
                style={{ backgroundColor: COLORS.primary }}
              >
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-100 mb-4">
                    Konfirmasi Pembayaran
                  </h3>

                  {inquiryData ? (
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
                            {service.name}
                          </h4>
                        </div>
                        <div className="p-4 space-y-3">
                          <div
                            className="pb-3 border-b"
                            style={{ borderColor: COLORS.secondary }}
                          >
                            <p className="text-xs text-gray-400 mb-1">
                              Pelanggan
                            </p>
                            <p className="text-sm font-semibold text-green-400">
                              {inquiryData.customer_name}
                            </p>
                            <p className="text-xs font-mono text-gray-300">
                              {inquiryData.customer_no}
                            </p>
                            {inquiryData.periode && (
                              <p className="text-xs text-gray-400 mt-1">
                                Periode: {inquiryData.periode}
                              </p>
                            )}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">
                              Tagihan pokok
                            </span>
                            <span className="font-semibold text-white">
                              <FormatRupiah value={basePrice} />
                            </span>
                          </div>
                          {Number(inquiryData.admin) > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-400">
                                Admin tagihan
                              </span>
                              <span className="font-semibold text-yellow-400">
                                +{" "}
                                <FormatRupiah
                                  value={Number(inquiryData.admin)}
                                />
                              </span>
                            </div>
                          )}
                          {paymentMethod && totalFee > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-400">
                                Biaya Layanan
                              </span>
                              <span
                                className="font-semibold"
                                style={{ color: COLORS.error }}
                              >
                                <FormatRupiah value={totalFee} />
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
                              <FormatRupiah value={totalPayment} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {!paymentMethod && (
                        <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                          <p className="text-yellow-400 text-xs text-center">
                            Pilih metode pembayaran terlebih dahulu
                          </p>
                        </div>
                      )}

                      <div className="mt-4">
                        <button
                          type="submit"
                          disabled={!isFormValid || loadingOrder}
                          className={`w-full py-3 rounded-xl font-bold text-lg transition-all ${
                            isFormValid && !loadingOrder
                              ? "text-white hover:scale-[1.02] shadow-lg cursor-pointer"
                              : "bg-gray-700 text-gray-500 cursor-not-allowed"
                          }`}
                          style={
                            isFormValid && !loadingOrder
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
                          ) : (
                            "Bayar Tagihan"
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
                        Cek tagihan terlebih dahulu
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
}
