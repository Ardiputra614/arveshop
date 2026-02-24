"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  Copy,
  Download,
  ArrowLeft,
  Home,
  MessageCircle,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useParams } from "next/navigation";

import axios from "axios";

export default function History() {
  const url = process.env.NEXT_PUBLIC_GOLANG_URL;
  const params = useParams();
  const order_id = params.orderid;

  // === DATA DUMMY UNTUK TESTING ===
  // const dummyData = {
  //   order_id: "ORDER-123456",
  //   transaction_status: "pending",
  //   digiflazz_status: "Pending",
  //   product_name: "Telkomsel 20.000",
  //   customer_no: "081234567890",
  //   payment_method_name: "bca",
  //   payment_type: "bank_transfer",
  //   // url: "1234567890123456", // Untuk VA
  //   url: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ORDER-123456", // Untuk QRIS
  //   gross_amount: 21000,
  //   serial_number: "12345678901234567890/KWH", // Untuk PLN token
  //   // serial_number: "SN1234567890", // Untuk non-PLN
  //   digiflazz_data: {
  //     message: "Transaksi diproses melalui DigiFlazz",
  //   },
  //   created_at: new Date().toISOString(),
  // };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${url}/api/history/${order_id}`);
      setFinalData(response.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Gunakan data dummy jika props tidak ada
  const [finalData, setFinalData] = useState({});

  console.log(finalData);

  const finalOrderId = order_id;

  const [copied, setCopied] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [status, setStatus] = useState(
    finalData?.transaction_status || "pending",
  );
  const [isChecking, setIsChecking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [digiflazzStatus, setDigiflazzStatus] = useState(
    finalData?.digiflazz_status || "Pending",
  );

  /* =====================
        EXTRACT TOKEN UTILITY
    ====================== */
  const extractCopyableToken = (serialNumber) => {
    if (!serialNumber) return "";

    // Untuk PLN: ambil bagian sebelum slash pertama
    if (typeof serialNumber === "string" && serialNumber.includes("/")) {
      const parts = serialNumber.split("/");
      return parts[0].trim();
    }

    return serialNumber;
  };

  /* =====================
        FORMATTER
    ====================== */
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const formatRupiah = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);

  /* =====================
        COUNTDOWN
    ====================== */
  useEffect(() => {
    if (status !== "pending") return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setStatus("expired");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  /* =====================
        SIMULASI STATUS UPDATE (UNTUK DEMO)
    ====================== */
  useEffect(() => {
    // Simulasi status berubah setelah 10 detik
    const timeoutId = setTimeout(() => {
      if (status === "pending") {
        // Untuk demo, kita ubah ke settlement setelah 10 detik
        // Anda bisa comment/uncomment bagian ini sesuai kebutuhan
        // setStatus("settlement");
        // setDigiflazzStatus("Sukses");
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [status]);

  /* =====================
        POLLING STATUS (DIKOMENTARI)
    ====================== */
  /*
  useEffect(() => {
    // Fungsi untuk check status
    const checkStatus = async () => {
      try {
        setIsChecking(true);
        const res = await axios.get(`/api/transaction/status`, {
          params: { order_id: finalData.order_id },
        });

        if (res.data?.status) {
          const newStatus = res.data.status;

          // Update status
          setStatus(newStatus);
          setDigiflazzStatus(res.data.digiflazz_status);

          // Jika sudah settlement, kembalikan untuk cleanup
          return newStatus;
        }
      } catch (err) {
        console.error("Error checking status:", err);
      } finally {
        setIsChecking(false);
      }

      return null;
    };

    // 1. CEK STATUS SEKARANG (initial check)
    const initialCheck = async () => {
      const currentStatus = await checkStatus();

      // 2. HANYA POLLING JIKA MASIH PENDING
      if (currentStatus === "pending") {
        // Set interval polling
        const interval = setInterval(async () => {
          const latestStatus = await checkStatus();

          // Stop polling jika sudah settlement/cancel
          if (latestStatus !== "pending") {
            clearInterval(interval);
          }
        }, 5000); // Poll setiap 5 detik

        // Cleanup function
        return () => clearInterval(interval);
      }
    };

    // Jalankan hanya jika ada order_id
    if (finalData?.order_id) {
      initialCheck();
    }
  }, [finalData?.order_id]); // Hanya depend on order_id
  */

  /* =====================
        POLLING DIGIFLAZZ STATUS (DIKOMENTARI)
    ====================== */
  /*
  useEffect(() => {
    if (
      !finalData?.order_id ||
      finalData.digiflazz_status === "Sukses" ||
      finalData.digiflazz_status === "Gagal" ||
      status === "expired"
    )
      return;

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/api/transaction/digiflazz-status`, {
          params: { order_id: finalData.order_id },
        });

        if (
          res.data?.digiflazz_status &&
          res.data.digiflazz_status !== finalData.digiflazz_status
        ) {
          // Update data dengan status baru
          // Anda bisa refresh page atau update state sesuai kebutuhan
          window.location.reload();
        }
      } catch (err) {
        console.error("Error polling DigiFlazz:", err);
      }
    }, 10000); // Poll setiap 10 detik

    return () => clearInterval(interval);
  }, [finalData?.order_id, finalData?.digiflazz_status]);
  */

  /* =====================
        MANUAL STATUS UPDATE (UNTUK DEMO)
    ====================== */
  const handleManualStatusUpdate = (newStatus, newDigiflazzStatus) => {
    setStatus(newStatus);
    setDigiflazzStatus(newDigiflazzStatus);

    if (newStatus === "settlement") {
      showNotification(
        "Status Diperbarui",
        "Pembayaran berhasil diproses",
        "success",
      );
    } else if (newStatus === "expired") {
      showNotification(
        "Status Diperbarui",
        "Waktu pembayaran telah habis",
        "error",
      );
    }
  };

  /* =====================
        COPY VA
    ====================== */
  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showNotification("Berhasil", "Nomor VA berhasil disalin", "success");
    } catch {
      alert("Browser tidak mendukung copy");
    }
  };

  /* =====================
        COPY TOKEN
    ====================== */
  const handleCopyToken = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
      showNotification("Berhasil", "Token berhasil disalin", "success");
    } catch {
      alert("Gagal menyalin token");
    }
  };

  /* =====================
        DOWNLOAD QRIS
    ====================== */
  const downloadQR = () => {
    if (finalData.payment_type === "qris" && finalData.url) {
      const link = document.createElement("a");
      link.href = finalData.url;
      link.download = `QRIS-${finalData.order_id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification("Berhasil", "QRIS berhasil diunduh", "success");
    }
  };

  /* =====================
        NOTIFICATION FUNCTION
    ====================== */
  const showNotification = (title, message, type = "info") => {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 z-50 rounded-lg p-4 shadow-lg transform transition-all duration-300`;
    notification.style.backgroundColor =
      type === "success"
        ? "#10B98120"
        : type === "error"
          ? "#EF444420"
          : type === "warning"
            ? "#F59E0B20"
            : "#3B82F620";
    notification.style.border = `1px solid ${
      type === "success"
        ? "#10B98140"
        : type === "error"
          ? "#EF444440"
          : type === "warning"
            ? "#F59E0B40"
            : "#3B82F640"
    }`;
    notification.style.minWidth = "300px";
    notification.style.maxWidth = "400px";
    notification.style.animation = "slideIn 0.3s ease-out forwards";

    const iconColor =
      type === "success"
        ? "#10B981"
        : type === "error"
          ? "#EF4444"
          : type === "warning"
            ? "#F59E0B"
            : "#3B82F6";

    const icon = {
      info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`,
      warning: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.24 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>`,
      error: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`,
      success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>`,
    }[type];

    notification.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0 mr-3" style="color: ${iconColor}">
          ${icon}
        </div>
        <div class="flex-1">
          <h4 class="font-bold text-gray-100" style="color: ${iconColor}">${title}</h4>
          <p class="text-sm text-gray-300 mt-1">${message}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-gray-400 hover:text-gray-200">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto remove setelah 5 detik
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.transform = "translateX(100%)";
        notification.style.opacity = "0";
        setTimeout(() => {
          if (notification.parentElement) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, 5000);
  };

  // Add CSS animation
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  /* =====================
        STATUS CONFIG
    ====================== */
  const statusConfig = {
    settlement: {
      icon: CheckCircle,
      color: "text-green-500",
      label: "Berhasil",
      message: "Pembayaran berhasil",
    },
    pending: {
      icon: Clock,
      color: "text-yellow-400",
      label: "Menunggu Pembayaran",
      message: "Segera selesaikan pembayaran",
    },
    cancel: {
      icon: XCircle,
      color: "text-red-500",
      label: "Dibatalkan",
      message: "Transaksi dibatalkan",
    },
    expired: {
      icon: XCircle,
      color: "text-red-500",
      label: "Kedaluwarsa",
      message: "Waktu pembayaran telah habis",
    },
  };

  const CurrentIcon = statusConfig[status]?.icon || Clock;

  /* =====================
        TOKEN DISPLAY COMPONENT
    ====================== */
  const TokenDisplay = ({ serialNumber }) => {
    if (!serialNumber) return null;

    const isPlnToken =
      serialNumber.includes("/") && serialNumber.includes("KWH");
    const copyableToken = extractCopyableToken(serialNumber);

    if (!isPlnToken) {
      return (
        <div className="bg-gray-900 p-3 rounded-lg">
          <div className="text-gray-400 text-sm mb-1">Serial Number</div>
          <div className="font-mono break-all">{serialNumber}</div>
          <button
            onClick={() => handleCopyToken(serialNumber)}
            className="mt-2 text-blue-400 text-sm flex items-center hover:text-blue-300 transition-colors"
          >
            <Copy className="w-3 h-3 mr-1" />
            {copiedToken ? "✓ Tersalin" : "Salin"}
          </button>
        </div>
      );
    }

    // Parse PLN token details
    const parts = serialNumber.split("/");
    const token = parts[0]?.trim() || "";
    const customerName = parts[1]?.trim() || "Budi Santoso";
    const daya = parts[3]?.trim() || "900 VA";
    const kwh = parts[4]?.replace("KWH", "")?.trim() || "20";

    return (
      <div className="rounded-lg p-4">
        {/* Token utama */}
        <div className="mb-4">
          <div className="text-gray-400 text-sm mb-1">Token Listrik</div>
          <div className="flex items-center justify-between">
            <div className="font-mono text-xl tracking-wider bg-black p-3 rounded-lg">
              {token}
            </div>
            <button
              onClick={() => handleCopyToken(token)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center text-sm transition-colors"
            >
              <Copy className="w-4 h-4 mr-2" />
              {copiedToken ? "Tersalin" : "Copy Token"}
            </button>
          </div>
        </div>

        {/* Detail tambahan */}
        <div className="grid grid-cols-2 gap-3 text-sm border-t border-gray-800 pt-3">
          {customerName && (
            <div>
              <div className="text-gray-400">Nama Pelanggan</div>
              <div className="font-medium">{customerName}</div>
            </div>
          )}
          {daya && (
            <div>
              <div className="text-gray-400">Daya</div>
              <div className="font-medium">{daya}</div>
            </div>
          )}
          {kwh && (
            <div>
              <div className="text-gray-400">KWH</div>
              <div className="font-medium">{kwh} KWH</div>
            </div>
          )}
        </div>

        {/* Full SN untuk referensi */}
        <div className="mt-3 pt-3 border-t border-gray-800">
          <div className="text-gray-400 text-xs mb-1">Data Lengkap</div>
          <div className="text-xs text-gray-500 break-all bg-black p-2 rounded">
            {serialNumber}
          </div>
        </div>
      </div>
    );
  };

  /* =====================
        DEMO CONTROLS
    ====================== */
  // const DemoControls = () => (
  //   <div className="bg-gray-900 rounded-xl p-4 mb-6 border border-gray-700">
  //     <h3 className="font-semibold mb-3 text-yellow-400">Demo Controls</h3>
  //     <div className="flex flex-wrap gap-2">
  //       <button
  //         onClick={() => handleManualStatusUpdate("settlement", "Sukses")}
  //         className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm transition-colors"
  //       >
  //         Set Berhasil
  //       </button>
  //       <button
  //         onClick={() => handleManualStatusUpdate("expired", "Gagal")}
  //         className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm transition-colors"
  //       >
  //         Set Expired
  //       </button>
  //       <button
  //         onClick={() => handleManualStatusUpdate("pending", "Pending")}
  //         className="bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded-lg text-sm transition-colors"
  //       >
  //         Reset ke Pending
  //       </button>
  //       <button
  //         onClick={() => setTimeLeft(300)}
  //         className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm transition-colors"
  //       >
  //         Reset Timer (5:00)
  //       </button>
  //     </div>
  //     <p className="text-gray-400 text-xs mt-2">
  //       Gunakan tombol di atas untuk simulasi status transaksi
  //     </p>
  //   </div>
  // );

  /* =====================
        MAIN PAGE
    ====================== */
  return (
    <>
      <Head title={`Transaksi ${finalData.order_id}`} />

      <div className="min-h-screen text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* DEMO CONTROLS */}
          {/* <DemoControls /> */}

          {/* STATUS */}
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <CurrentIcon
                className={`w-10 h-10 ${statusConfig[status].color}`}
              />
              <div>
                <h2 className="text-xl font-bold">
                  {statusConfig[status].label}
                </h2>
                <p className="text-gray-400">{statusConfig[status].message}</p>
              </div>
            </div>

            {status === "pending" && (
              <div className="mt-4 text-yellow-400 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Sisa waktu: {formatTime(timeLeft)}
                {isChecking && (
                  <span className="ml-2 text-xs">(Memeriksa status...)</span>
                )}
              </div>
            )}
          </div>

          {status === "expired" && (
            <div className="mt-4 text-red-400 flex items-center mb-4">
              <XCircle className="w-4 h-4 mr-2" />
              Silakan buat transaksi baru
            </div>
          )}

          {/* TOKEN/SN SECTION */}
          {finalData.serial_number && (
            <div className="bg-gray-800 rounded-xl p-6 mb-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                Detail Produk
              </h3>
              <TokenDisplay serialNumber={finalData.serial_number} />
            </div>
          )}

          {/* BANK TRANSFER */}
          {finalData.payment_type === "bank_transfer" &&
            status === "pending" && (
              <div className="bg-gray-800 rounded-xl p-6 mb-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Virtual Account {finalData.payment_method_name.toUpperCase()}
                </h3>

                <div className="flex justify-between items-center bg-gray-900 p-4 rounded-lg">
                  <span className="font-mono text-xl">{finalData.url}</span>
                  <button
                    onClick={() => handleCopy(finalData.url)}
                    className="text-blue-400 flex items-center hover:text-blue-300 transition-colors"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    {copied ? "✓ Tersalin" : "Salin"}
                  </button>
                </div>
                <p className="text-gray-400 text-sm mt-3">
                  Transfer ke nomor VA di atas untuk menyelesaikan pembayaran
                </p>
              </div>
            )}

          {/* QRIS */}
          {finalData.payment_type === "qris" && status === "pending" && (
            <div className="bg-gray-800 rounded-xl p-6 mb-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <Download className="w-5 h-5 mr-2" />
                QRIS
              </h3>

              <div className="flex flex-col items-center gap-4">
                {finalData.url && finalData.url.startsWith("http") ? (
                  <a
                    href={finalData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={finalData.url}
                      alt="QRIS"
                      className="w-48 h-48 bg-white p-2 rounded-lg cursor-pointer hover:scale-105 transition-transform"
                    />
                  </a>
                ) : (
                  <div className="w-48 h-48 bg-white p-2 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-gray-800 font-bold text-lg">
                        QRIS
                      </div>
                      <div className="text-gray-600 text-sm">
                        {finalData.order_id}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  {finalData.url && finalData.url.startsWith("http") && (
                    <button
                      onClick={downloadQR}
                      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download QR
                    </button>
                  )}

                  <button
                    onClick={() => handleCopy(finalData.order_id)}
                    className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center transition-colors"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Salin Order ID
                  </button>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-3 text-center">
                Scan QR code di atas untuk pembayaran
              </p>
            </div>
          )}

          {/* DETAIL */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4 pb-3 border-b border-gray-700">
              Informasi Transaksi
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Order ID</span>
                <span className="font-mono">{finalData.order_id}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Produk</span>
                <span className="font-medium">{finalData.product_name}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Nomor Tujuan</span>
                <span className="font-medium">{finalData.customer_no}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Metode Pembayaran</span>
                <span className="font-medium">
                  {finalData.payment_method_name}
                </span>
              </div>
              {/* DigiFlazz Status */}
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Status Pemesanan</span>
                <span
                  className={`font-semibold ${
                    digiflazzStatus === "Sukses"
                      ? "text-green-400"
                      : digiflazzStatus === "Gagal"
                        ? "text-red-400"
                        : "text-yellow-400"
                  }`}
                >
                  {digiflazzStatus || "Menunggu"}
                </span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-gray-400">Tanggal Transaksi</span>
                <span className="font-medium">
                  {new Date(finalData.created_at).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>
              {/* Payment Status */}
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Status Pembayaran</span>
                <span
                  className={`font-semibold ${
                    status === "settlement"
                      ? "text-green-400"
                      : status === "pending"
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {status === "settlement"
                    ? "Berhasil"
                    : status === "pending"
                      ? "Menunggu"
                      : status || "Gagal"}
                </span>
              </div>
              {/* Total */}
              <div className="flex justify-between py-2 font-bold border-t border-gray-700 pt-4 mt-2">
                <span>Total Pembayaran</span>
                <span className="text-lg">
                  {formatRupiah(finalData.gross_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
