"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  const [isExpiring, setIsExpiring] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const timerRef = useRef(null);
  const pollingRef = useRef(null);
  const wsRef = useRef(null);
  const prevStatusRef = useRef("pending");
  const prevDigiflazzRef = useRef("Pending");

  // ✅ Parse status dari data backend
  const parseStatus = useCallback((paymentStatus) => {
    if (paymentStatus === "settlement" || paymentStatus === "capture")
      return "success";
    if (paymentStatus === "pending") return "pending";
    if (["expired", "cancel", "failure", "deny"].includes(paymentStatus))
      return "failed";
    return paymentStatus || "pending";
  }, []);

  // ✅ Update state dari data
  const updateFromData = useCallback(
    (data, showToast = false) => {
      if (!data) return;

      const newStatus = parseStatus(data.payment_status);
      const newDigiflazz = data.digiflazz_status || "Pending";

      // Cek perubahan status
      if (showToast && prevStatusRef.current !== newStatus) {
        if (newStatus === "success") toast.success("✅ Pembayaran berhasil!");
        else if (newStatus === "failed") toast.error("❌ Pembayaran gagal");
      }

      if (showToast && prevDigiflazzRef.current !== newDigiflazz) {
        if (newDigiflazz === "Sukses")
          toast.success("✅ Produk berhasil dikirim!");
        else if (newDigiflazz === "Gagal")
          toast.error("❌ Pengiriman produk gagal");
      }

      prevStatusRef.current = newStatus;
      prevDigiflazzRef.current = newDigiflazz;

      setFinalData(data);
      setStatus(newStatus);
      setDigiflazzStatus(newDigiflazz);

      if (data.midtrans_response?.expiry_time) {
        setExpiryTime(new Date(data.midtrans_response.expiry_time));
      }
    },
    [parseStatus],
  );

  // ✅ Fetch history
  const fetchHistory = useCallback(
    async (showToast = false) => {
      try {
        const response = await axios.get(`${url}/api/history/${order_id}`, {
          withCredentials: true,
        });

        if (response.data?.data) {
          updateFromData(response.data.data, showToast);
        }
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    },
    [order_id, url, updateFromData],
  );

  // ✅ Initial fetch
  useEffect(() => {
    if (!order_id) return;
    const init = async () => {
      setLoading(true);
      await fetchHistory(false);
      setLoading(false);
    };
    init();
  }, [order_id, fetchHistory]);

  // ✅ WebSocket — connect ke backend
  useEffect(() => {
    if (!order_id) return;

    const wsURL = url
      ?.replace("https://", "wss://")
      ?.replace("http://", "ws://");

    const connect = () => {
      try {
        const ws = new WebSocket(`${wsURL}/ws/order/${order_id}`);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("✅ WebSocket connected");
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("🔥 WebSocket update:", data);
            updateFromData(data, true);
          } catch (e) {
            console.error("WS parse error:", e);
          }
        };

        ws.onclose = () => {
          console.log("❌ WebSocket disconnected, reconnecting in 3s...");
          setIsConnected(false);
          // Auto reconnect setelah 3 detik
          setTimeout(() => {
            if (wsRef.current?.readyState !== WebSocket.OPEN) {
              connect();
            }
          }, 3000);
        };

        ws.onerror = (err) => {
          console.error("WebSocket error:", err);
          setIsConnected(false);
          ws.close();
        };
      } catch (e) {
        console.error("WebSocket init error:", e);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on unmount
        wsRef.current.close();
      }
    };
  }, [order_id, url, updateFromData]);

  // ✅ Polling fallback — jalan terus tapi lebih lambat kalau WS aktif
  useEffect(() => {
    if (!order_id) return;
    if (status === "success" || status === "failed") return;

    // Polling lebih cepat kalau WS tidak konek
    const interval = isConnected ? 15000 : 5000;

    pollingRef.current = setInterval(async () => {
      console.log(`🔄 Polling... (${isConnected ? "WS aktif" : "WS mati"})`);
      await fetchHistory(true);
    }, interval);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [order_id, status, isConnected, fetchHistory]);

  // ✅ Stop polling kalau sudah success/failed
  useEffect(() => {
    if (status === "success" || status === "failed") {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [status]);

  // ✅ Handle expire
  const handleExpireTransaction = useCallback(async () => {
    if (isExpiring) return;
    setIsExpiring(true);

    try {
      await axios.post(
        `${url}/transaction/${order_id}/expire`,
        {},
        { withCredentials: true },
      );
      setStatus("failed");
      setTimeLeft(0);
      toast.info("⏰ Waktu pembayaran telah habis");
      await fetchHistory(false);
    } catch (error) {
      console.error("Gagal update expired:", error);
      setStatus("failed");
      setTimeLeft(0);
      toast.warning("⏰ Waktu habis");
    } finally {
      setIsExpiring(false);
    }
  }, [order_id, url, isExpiring, fetchHistory]);

  // ✅ Countdown timer
  const calculateTimeLeft = useCallback(() => {
    if (!expiryTime) return null;
    const diff = expiryTime - new Date();
    return diff <= 0 ? 0 : Math.floor(diff / 1000);
  }, [expiryTime]);

  useEffect(() => {
    if (status !== "pending" || !expiryTime) return;

    const initial = calculateTimeLeft();
    if (initial <= 0) {
      handleExpireTransaction();
      return;
    }

    setTimeLeft(initial);

    timerRef.current = setInterval(async () => {
      const remaining = calculateTimeLeft();
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        await handleExpireTransaction();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [expiryTime, status, calculateTimeLeft, handleExpireTransaction]);

  // Helpers
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return "--:--";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0)
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
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
      label: "Pembayaran Gagal / Kedaluwarsa",
      message: "Transaksi tidak berhasil",
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
          {/* Status Bar */}
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-400">Order ID: {order_id}</div>
            <div className="flex items-center gap-2">
              {/* Polling indicator */}
              {status === "pending" && (
                <div className="flex items-center bg-gray-800 px-3 py-1 rounded-full">
                  <div className="animate-spin rounded-full h-3 w-3 border border-blue-400 border-t-transparent mr-2" />
                  <span className="text-xs text-blue-400">Auto refresh</span>
                </div>
              )}
              {/* WS indicator */}
              <div className="flex items-center bg-gray-800 px-3 py-1 rounded-full">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500 mr-2 animate-pulse" />
                    <span className="text-xs text-green-500">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-yellow-500 mr-2" />
                    <span className="text-xs text-yellow-500">Polling</span>
                  </>
                )}
              </div>
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

            {isExpiring && (
              <div className="mt-2 text-xs text-blue-400 flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border border-blue-400 border-t-transparent mr-2" />
                Mensinkronkan status...
              </div>
            )}
          </div>

          {/* Token */}
          {finalData.serial_number && (
            <div className="bg-gray-800 rounded-xl p-6 mb-6">
              <h3 className="font-semibold mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                Detail Produk
              </h3>
              <TokenDisplay serialNumber={finalData.serial_number} />
            </div>
          )}

          {/* Bank Transfer */}
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

          {/* QRIS */}
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
                    width={192}
                    height={192}
                    unoptimized
                    className="bg-white p-2 rounded-lg"
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
              {[
                { label: "Order ID", value: finalData.order_id, mono: true },
                { label: "Produk", value: finalData.product_name },
                { label: "Nomor Tujuan", value: finalData.customer_no },
                {
                  label: "Metode Pembayaran",
                  value: finalData.payment_method_name?.toUpperCase(),
                },
              ].map((item) => (
                <div key={item.label} className="flex justify-between py-2">
                  <span className="text-gray-400">{item.label}</span>
                  <span className={item.mono ? "font-mono" : "font-medium"}>
                    {item.value || "-"}
                  </span>
                </div>
              ))}

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

              {expiryTime && status === "pending" && (
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
