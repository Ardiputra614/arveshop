// app/(user)/history/[orderid]/page.jsx
"use client";

import { useEffect, useState, useRef } from "react";
import {
  CheckCircle,
  Copy,
  Download,
  Clock,
  XCircle,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import Head from "next/head";
import { useParams } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import { useWebSocket } from "@/hooks/useWebSocket";
import Image from "next/image";

export default function History() {
  const url = process.env.NEXT_PUBLIC_GOLANG_URL;
  const params = useParams();
  const order_id = params.orderid;

  const [finalData, setFinalData] = useState({});
  const [copied, setCopied] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [status, setStatus] = useState("pending");
  const [timeLeft, setTimeLeft] = useState(null);
  const [expiryTime, setExpiryTime] = useState(null);
  const [digiflazzStatus, setDigiflazzStatus] = useState("Pending");
  const [loading, setLoading] = useState(true);
  const [isExpiring, setIsExpiring] = useState(false); // 🔴 Cegah multiple request

  // Ref untuk timer interval
  const timerRef = useRef(null);

  // 🔴 WebSocket hook
  const { isConnected, orderStatus } = useWebSocket(order_id);

  // 🔴 Fungsi untuk update status expired ke backend
  const handleExpireTransaction = async () => {
    // Cegah multiple request
    if (isExpiring) return;

    setIsExpiring(true);

    try {
      console.log(
        "⏰ Mengirim request expire ke backend untuk order:",
        order_id,
      );

      const response = await axios.post(
        `${url}/transaction/${order_id}/expire`,
        {}, // body kosong
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      console.log("Response expire:", response.data);

      // Update status lokal
      setStatus("expired");
      setTimeLeft(0);

      toast.info("⏰ Waktu pembayaran telah habis");

      // Fetch ulang data untuk memastikan sinkron
      await fetchHistory();
    } catch (error) {
      console.error("Gagal update status expired:", error);

      // Fallback: tetap update UI meskipun request gagal
      setStatus("expired");
      setTimeLeft(0);

      toast.warning("⏰ Waktu habis, tapi gagal sinkron ke server");
    } finally {
      setIsExpiring(false);
    }
  };

  // 🔴 Log koneksi WebSocket
  useEffect(() => {
    console.log(
      "WebSocket connection status:",
      isConnected ? "✅ Live" : "❌ Offline",
    );
    if (isConnected) {
      console.log("Subscribed to order:", order_id);
    }
  }, [isConnected, order_id]);

  // 🔴 Update status dari WebSocket
  useEffect(() => {
    if (orderStatus) {
      console.log("🔥 WebSocket update received:", orderStatus);
      console.log("Current status before update:", status);

      const backendStatus = orderStatus.payment_status;
      let newStatus = status;

      if (backendStatus === "settlement" || backendStatus === "capture") {
        newStatus = "success";
        toast.success("✅ Pembayaran berhasil!");
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else if (backendStatus === "pending") {
        newStatus = "pending";
      } else if (
        backendStatus === "expired" ||
        backendStatus === "cancel" ||
        backendStatus === "failure"
      ) {
        newStatus = "failed";
        toast.error("❌ Pembayaran gagal");
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        newStatus = backendStatus || status;
      }

      if (newStatus !== status) {
        console.log("Status berubah:", status, "→", newStatus);
        setStatus(newStatus);
      }

      if (
        orderStatus.digiflazz_status &&
        orderStatus.digiflazz_status !== digiflazzStatus
      ) {
        console.log(
          "Digiflazz status berubah:",
          digiflazzStatus,
          "→",
          orderStatus.digiflazz_status,
        );
        setDigiflazzStatus(orderStatus.digiflazz_status);

        if (orderStatus.digiflazz_status === "Sukses") {
          toast.success("✅ Produk berhasil dikirim!");
        }
      }

      setFinalData((prev) => ({
        ...prev,
        ...orderStatus,
      }));

      if (orderStatus.midtrans_response?.expiry_time) {
        const expiryFromMidtrans = new Date(
          orderStatus.midtrans_response.expiry_time,
        );
        console.log("Expiry time dari Midtrans:", expiryFromMidtrans);
        setExpiryTime(expiryFromMidtrans);
      }
    }
  }, [orderStatus, status, digiflazzStatus]);

  const calculateTimeLeft = () => {
    if (!expiryTime) return null;
    const now = new Date();
    const diff = expiryTime - now;
    if (diff <= 0) return 0;
    return Math.floor(diff / 1000);
  };

  // 🔴 Timer effect - update setiap detik dan panggil backend saat expired
  useEffect(() => {
    if (status !== "pending") {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    if (!expiryTime) return;
    const initialTimeLeft = calculateTimeLeft();
    console.log("Initial time left:", initialTimeLeft, "detik");
    if (initialTimeLeft <= 0) {
      handleExpireTransaction();
      return;
    }
    setTimeLeft(initialTimeLeft);
    timerRef.current = setInterval(async () => {
      const remaining = calculateTimeLeft();
      if (remaining <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        await handleExpireTransaction();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [expiryTime, status, calculateTimeLeft, handleExpireTransaction]);

  // Fetch initial data
  useEffect(() => {
    if (!order_id) return;

    const fetchHistory = async () => {
      try {
        const res = await api.get(`/history/${order_id}`);
        setHistory(res.data);
      } catch (error) {
        console.error("Error fetching history:", error);
        setError("Gagal mengambil data history");
      }
    };

    fetchHistory();
  }, [order_id]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      console.log("Fetching history for order:", order_id);
      const response = await axios.get(`${url}/api/history/${order_id}`);
      console.log("Initial fetch response:", response.data);

      if (response.data?.data) {
        const data = response.data.data;
        setFinalData(data);

        if (
          data.payment_status === "settlement" ||
          data.payment_status === "capture"
        ) {
          setStatus("success");
        } else if (data.payment_status === "pending") {
          setStatus("pending");
        } else if (
          data.payment_status === "expired" ||
          data.payment_status === "cancel" ||
          data.payment_status === "failure"
        ) {
          setStatus("failed");
        } else {
          setStatus(data.payment_status || "pending");
        }

        setDigiflazzStatus(data.digiflazz_status || "Pending");

        if (data.midtrans_response?.expiry_time) {
          const expiry = new Date(data.midtrans_response.expiry_time);
          console.log("Expiry time dari initial fetch:", expiry);
          setExpiryTime(expiry);
        }
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Gagal memuat data transaksi");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return "--:--";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatRupiah = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Berhasil disalin");
    } catch {
      toast.error("Gagal menyalin");
    }
  };

  const handleCopyToken = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
      toast.success("Token berhasil disalin");
    } catch {
      toast.error("Gagal menyalin token");
    }
  };

  const downloadQR = () => {
    if (finalData.payment_type === "qris" && finalData.url) {
      const link = document.createElement("a");
      link.href = finalData.url;
      link.download = `QRIS-${finalData.order_id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("QRIS berhasil diunduh");
    }
  };

  const statusConfig = {
    success: {
      icon: CheckCircle,
      color: "text-green-500",
      label: "Pembayaran Berhasil",
      message: "Pembayaran telah diterima",
    },
    pending: {
      icon: Clock,
      color: "text-yellow-400",
      label: "Menunggu Pembayaran",
      message: "Segera selesaikan pembayaran",
    },
    failed: {
      icon: XCircle,
      color: "text-red-500",
      label: "Pembayaran Gagal",
      message: "Transaksi gagal",
    },
    expired: {
      icon: XCircle,
      color: "text-red-500",
      label: "Kedaluwarsa",
      message: "Waktu pembayaran telah habis",
    },
  };

  const CurrentIcon = statusConfig[status]?.icon || Clock;

  const TokenDisplay = ({ serialNumber }) => {
    if (!serialNumber) return null;

    const isPlnToken =
      serialNumber.includes("/") && serialNumber.includes("KWH");
    const token = isPlnToken
      ? serialNumber.split("/")[0]?.trim()
      : serialNumber;

    return (
      <div className="bg-gray-900 p-4 rounded-lg">
        <div className="text-gray-400 text-sm mb-2">
          {isPlnToken ? "Token Listrik" : "Serial Number"}
        </div>
        <div className="font-mono text-lg break-all bg-black p-3 rounded mb-3">
          {token}
        </div>
        <button
          onClick={() => handleCopyToken(token)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm flex items-center transition-colors"
        >
          <Copy className="w-4 h-4 mr-2" />
          {copiedToken ? "Tersalin" : "Salin Token"}
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Transaksi {finalData.order_id || order_id}</title>
      </Head>

      <div className="min-h-screen text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* WebSocket Status */}
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-400">Order ID: {order_id}</div>
            <div className="flex items-center bg-gray-800 px-3 py-1 rounded-full">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500 mr-2 animate-pulse" />
                  <span className="text-xs text-green-500">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500 mr-2" />
                  <span className="text-xs text-red-500">
                    Offline - Mencoba reconnect...
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <CurrentIcon
                className={`w-10 h-10 ${statusConfig[status]?.color}`}
              />
              <div>
                <h2 className="text-xl font-bold">
                  {statusConfig[status]?.label}
                </h2>
                <p className="text-gray-400">{statusConfig[status]?.message}</p>
              </div>
            </div>

            {/* Timer */}
            {status === "pending" && timeLeft !== null && (
              <div className="mt-4 text-yellow-400 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>
                  Sisa waktu: {formatTime(timeLeft)}
                  {expiryTime && (
                    <span className="text-xs text-gray-500 ml-2">
                      (s.d. {expiryTime.toLocaleTimeString("id-ID")})
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Loading indicator saat expire request */}
            {isExpiring && (
              <div className="mt-2 text-xs text-blue-400 flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border border-blue-400 border-t-transparent mr-2"></div>
                Mensinkronkan status...
              </div>
            )}
          </div>

          {/* Token Section */}
          {finalData.serial_number && (
            <div className="bg-gray-800 rounded-xl p-6 mb-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                Detail Produk
              </h3>
              <TokenDisplay serialNumber={finalData.serial_number} />
            </div>
          )}

          {/* Bank Transfer Info */}
          {finalData.payment_type === "bank_transfer" &&
            status === "pending" && (
              <div className="bg-gray-800 rounded-xl p-6 mb-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Virtual Account {finalData.payment_method_name?.toUpperCase()}
                </h3>
                <div className="flex justify-between items-center bg-gray-900 p-4 rounded-lg">
                  <span className="font-mono text-xl">{finalData.url}</span>
                  <button
                    onClick={() => handleCopy(finalData.url)}
                    className="text-blue-400 flex items-center hover:text-blue-300"
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

          {/* QRIS Info */}
          {finalData.payment_type === "qris" &&
            status === "pending" &&
            finalData.url && (
              <div className="bg-gray-800 rounded-xl p-6 mb-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Download className="w-5 h-5 mr-2" />
                  QRIS
                </h3>
                <div className="flex flex-col items-center gap-4">
                  <Image
                    src={finalData.url}
                    alt="QRIS"
                    className="w-48 h-48 bg-white p-2 rounded-lg"
                  />
                  <button
                    onClick={downloadQR}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download QR
                  </button>
                </div>
              </div>
            )}

          {/* Transaction Details */}
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
                <span className="font-medium uppercase">
                  {finalData.payment_method_name}
                </span>
              </div>
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
                  {digiflazzStatus === "Sukses"
                    ? "Berhasil"
                    : digiflazzStatus === "Gagal"
                      ? "Gagal"
                      : digiflazzStatus || "Menunggu"}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Tanggal Transaksi</span>
                <span className="font-medium">
                  {finalData.created_at &&
                    new Date(finalData.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                </span>
              </div>

              {/* Tampilkan expiry time dari Midtrans */}
              {expiryTime && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-400">Batas Pembayaran</span>
                  <span className="font-medium text-yellow-400">
                    {expiryTime.toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}

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
