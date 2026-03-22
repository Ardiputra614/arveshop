"use client";

// ─────────────────────────────────────────────
// CONFIG: field label per SKU group
// Tambah SKU baru? Cukup tambah entry di sini.
// ─────────────────────────────────────────────

const formatRupiah = (val) =>
  val != null
    ? new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(Number(val))
    : "-";

// Field-field dari root data (bukan dari desc)
const ROOT_FIELDS = [
  { key: "customer_name", label: "Nama Pelanggan" },
  { key: "customer_no", label: "Nomor Pelanggan" },
  { key: "periode", label: "Periode" },
  { key: "admin", label: "Biaya Admin", format: "rupiah" },
  { key: "price", label: "Harga Pokok", format: "rupiah" },
  { key: "selling_price", label: "Harga Jual", format: "rupiah" },
  { key: "sn", label: "Serial Number / Token", mono: true },
];

// Field-field dari desc per sku_code
// key: nama field di desc, label: teks tampilan, format: opsional
const DESC_CONFIG = {
  // ── PLN ──────────────────────────────────────
  pln: {
    label: "Tagihan PLN",
    fields: [
      { key: "tarif", label: "Tarif" },
      { key: "daya", label: "Daya (VA)" },
      { key: "lembar_tagihan", label: "Lembar Tagihan" },
    ],
    detailCols: [
      { key: "periode", label: "Periode" },
      { key: "nilai_tagihan", label: "Nilai Tagihan", format: "rupiah" },
      { key: "admin", label: "Admin", format: "rupiah" },
      { key: "denda", label: "Denda", format: "rupiah" },
      { key: "meter_awal", label: "Meter Awal" },
      { key: "meter_akhir", label: "Meter Akhir" },
    ],
  },

  // ── PDAM ─────────────────────────────────────
  pdam: {
    label: "Tagihan PDAM",
    fields: [
      { key: "tarif", label: "Tarif" },
      { key: "lembar_tagihan", label: "Lembar Tagihan" },
      { key: "alamat", label: "Alamat" },
      { key: "jatuh_tempo", label: "Jatuh Tempo" },
    ],
    detailCols: [
      { key: "periode", label: "Periode" },
      { key: "nilai_tagihan", label: "Nilai Tagihan", format: "rupiah" },
      { key: "denda", label: "Denda", format: "rupiah" },
      { key: "biaya_lain", label: "Biaya Lain", format: "rupiah" },
      { key: "meter_awal", label: "Meter Awal" },
      { key: "meter_akhir", label: "Meter Akhir" },
    ],
  },

  // ── INTERNET ─────────────────────────────────
  internet: {
    label: "Tagihan Internet",
    fields: [{ key: "lembar_tagihan", label: "Lembar Tagihan" }],
    detailCols: [
      { key: "periode", label: "Periode" },
      { key: "nilai_tagihan", label: "Nilai Tagihan", format: "rupiah" },
      { key: "admin", label: "Admin", format: "rupiah" },
    ],
  },

  // ── BPJS KESEHATAN ───────────────────────────
  bpjs: {
    label: "BPJS Kesehatan",
    fields: [
      { key: "jumlah_peserta", label: "Jumlah Peserta" },
      { key: "lembar_tagihan", label: "Lembar Tagihan" },
      { key: "alamat", label: "Alamat" },
    ],
    detailCols: [{ key: "periode", label: "Periode" }],
  },

  // ── MULTIFINANCE ─────────────────────────────
  multifinance: {
    label: "Multifinance",
    fields: [
      { key: "lembar_tagihan", label: "Lembar Tagihan" },
      { key: "item_name", label: "Nama Kendaraan" },
      { key: "no_rangka", label: "No. Rangka", mono: true },
      { key: "no_pol", label: "No. Polisi", mono: true },
      { key: "tenor", label: "Tenor (bulan)" },
    ],
    detailCols: [
      { key: "periode", label: "Periode" },
      { key: "denda", label: "Denda", format: "rupiah" },
      { key: "biaya_lain", label: "Biaya Lain", format: "rupiah" },
    ],
  },

  // ── PBB ──────────────────────────────────────
  pbb: {
    label: "PBB",
    fields: [
      { key: "lembar_tagihan", label: "Lembar Tagihan" },
      { key: "alamat", label: "Alamat" },
      { key: "tahun_pajak", label: "Tahun Pajak" },
      { key: "kelurahan", label: "Kelurahan" },
      { key: "kecamatan", label: "Kecamatan" },
      { key: "kab_kota", label: "Kab/Kota" },
      { key: "luas_tanah", label: "Luas Tanah" },
      { key: "luas_gedung", label: "Luas Gedung" },
    ],
    detailCols: [],
  },

  // ── GAS NEGARA ───────────────────────────────
  pgas: {
    label: "Gas Negara / Petragas",
    fields: [
      { key: "lembar_tagihan", label: "Lembar Tagihan" },
      { key: "alamat", label: "Alamat" },
    ],
    detailCols: [
      { key: "periode", label: "Periode" },
      { key: "meter_awal", label: "Meter Awal" },
      { key: "meter_akhir", label: "Meter Akhir" },
      { key: "usage", label: "Pemakaian (m³)" },
    ],
  },

  // ── TV BERLANGGANAN ──────────────────────────
  tv: {
    label: "TV Berlangganan",
    fields: [{ key: "lembar_tagihan", label: "Lembar Tagihan" }],
    detailCols: [
      { key: "periode", label: "Periode" },
      { key: "nilai_tagihan", label: "Nilai Tagihan", format: "rupiah" },
      { key: "no_ref", label: "No. Ref" },
    ],
  },

  // ── BPJS KETENAGAKERJAAN ─────────────────────
  bpjstk: {
    label: "BPJS Ketenagakerjaan",
    fields: [
      { key: "lembar_tagihan", label: "Lembar Tagihan" },
      { key: "kode_iuran", label: "Kode Iuran", mono: true },
      { key: "kode_program", label: "Kode Program" },
      { key: "jkk", label: "JKK", format: "rupiah" },
      { key: "jkm", label: "JKM", format: "rupiah" },
      { key: "jht", label: "JHT", format: "rupiah" },
      { key: "kantor_cabang", label: "Kantor Cabang" },
      { key: "tgl_efektif", label: "Tgl Efektif" },
      { key: "tgl_expired", label: "Tgl Expired" },
    ],
    detailCols: [],
  },

  // ── BPJS TK PU ───────────────────────────────
  bpjstkpu: {
    label: "BPJS TK Pekerja Upah",
    fields: [
      { key: "lembar_tagihan", label: "Lembar Tagihan" },
      { key: "kode_iuran", label: "Kode Iuran", mono: true },
      { key: "npp", label: "NPP", mono: true },
      { key: "jht", label: "JHT", format: "rupiah" },
      { key: "jkk", label: "JKK", format: "rupiah" },
      { key: "jkm", label: "JKM", format: "rupiah" },
      { key: "jpk", label: "JPK", format: "rupiah" },
      { key: "jpn", label: "JPN", format: "rupiah" },
      { key: "kode_divisi", label: "Kode Divisi" },
    ],
    detailCols: [],
  },

  // ── E-MONEY ──────────────────────────────────
  emoney: {
    label: "E-Money",
    fields: [{ key: "lembar_tagihan", label: "Lembar Tagihan" }],
    detailCols: [],
  },

  // ── SAMSAT ───────────────────────────────────
  samsat: {
    label: "Samsat / Pajak Kendaraan",
    fields: [
      { key: "alamat", label: "Alamat" },
      { key: "nomor_identitas", label: "No. Identitas", mono: true },
      { key: "nomor_rangka", label: "No. Rangka", mono: true },
      { key: "nomor_mesin", label: "No. Mesin", mono: true },
      { key: "nomor_polisi", label: "No. Polisi", mono: true },
      { key: "merek_kb", label: "Merek" },
      { key: "model_kb", label: "Model" },
      { key: "tahun_buatan", label: "Tahun" },
      { key: "tgl_akhir_pajak_baru", label: "Batas Pajak" },
      { key: "biaya_pokok_pkb", label: "PKB Pokok", format: "rupiah" },
      { key: "biaya_pokok_swd", label: "SWD Pokok", format: "rupiah" },
      { key: "biaya_denda_pkb", label: "Denda PKB", format: "rupiah" },
    ],
    detailCols: [],
  },

  // ── PAJAK DAERAH LAINNYA ─────────────────────
  pajakdaerah: {
    label: "Pajak Daerah",
    fields: [
      { key: "lembar_tagihan", label: "Lembar Tagihan" },
      { key: "alamat", label: "Alamat" },
      { key: "tahun_pajak", label: "Tahun Pajak" },
      { key: "kelurahan", label: "Kelurahan" },
      { key: "kecamatan", label: "Kecamatan" },
      { key: "kab_kota", label: "Kab/Kota" },
      { key: "provinsi", label: "Provinsi" },
      { key: "luas_tanah", label: "Luas Tanah" },
      { key: "luas_gedung", label: "Luas Gedung" },
    ],
    detailCols: [],
  },
};

// ─────────────────────────────────────────────
// Helper: resolve config dari sku_code
// ─────────────────────────────────────────────
const resolveConfig = (skuCode) => {
  if (!skuCode) return null;
  const lower = skuCode.toLowerCase();

  // exact match dulu
  if (DESC_CONFIG[lower]) return DESC_CONFIG[lower];

  // partial match untuk SKU seperti "pdam_xxx", "samsat_xxx", dst.
  const match = Object.keys(DESC_CONFIG).find((k) => lower.startsWith(k));
  return match ? DESC_CONFIG[match] : null;
};

// ─────────────────────────────────────────────
// Sub-komponen: satu baris info
// ─────────────────────────────────────────────
function InfoRow({ label, value, mono }) {
  if (value == null || value === "" || value === "0") return null;
  return (
    <div className="flex justify-between py-2 border-b border-gray-700 last:border-0 gap-4">
      <span className="text-gray-400 text-sm shrink-0">{label}</span>
      <span
        className={`text-sm text-right ${mono ? "font-mono" : "font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-komponen: tabel detail (array)
// ─────────────────────────────────────────────
function DetailTable({ cols, rows }) {
  if (!rows?.length || !cols?.length) return null;

  // filter kolom yang ada datanya minimal di satu baris
  const activeCols = cols.filter((c) =>
    rows.some((r) => r[c.key] != null && r[c.key] !== ""),
  );
  if (!activeCols.length) return null;

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-700">
            {activeCols.map((c) => (
              <th
                key={c.key}
                className="text-left text-gray-300 font-medium px-3 py-2 whitespace-nowrap"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-gray-800" : "bg-gray-750"}>
              {activeCols.map((c) => (
                <td
                  key={c.key}
                  className="px-3 py-2 text-gray-200 whitespace-nowrap"
                >
                  {c.format === "rupiah"
                    ? formatRupiah(row[c.key])
                    : (row[c.key] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────
// KOMPONEN UTAMA
// Cara pakai:
//   <DescDetail data={finalData.digiflazz_response} />
// ─────────────────────────────────────────────
export default function DescDetail({ data }) {
  if (!data) return null;

  const skuCode = data.buyer_sku_code;
  const desc = data.desc || {};
  const config = resolveConfig(skuCode);

  return (
    <div className="bg-gray-800 rounded-xl p-6 mb-6 space-y-1">
      <h3 className="font-semibold mb-4 pb-3 border-b border-gray-700 text-base">
        {config?.label ?? "Detail Transaksi Pascabayar"}
      </h3>

      {/* ── Root fields (customer, periode, sn, harga) ── */}
      {ROOT_FIELDS.map((f) => {
        const raw = data[f.key];
        if (!raw && raw !== 0) return null;
        const display = f.format === "rupiah" ? formatRupiah(raw) : String(raw);
        return (
          <InfoRow key={f.key} label={f.label} value={display} mono={f.mono} />
        );
      })}

      {/* ── Desc fields sesuai SKU ── */}
      {config?.fields.map((f) => {
        const raw = desc[f.key];
        if (raw == null || raw === "") return null;
        const display = f.format === "rupiah" ? formatRupiah(raw) : String(raw);
        return (
          <InfoRow key={f.key} label={f.label} value={display} mono={f.mono} />
        );
      })}

      {/* ── Fallback: kalau SKU tidak dikenal, tampilkan semua key dari desc ── */}
      {!config &&
        Object.entries(desc)
          .filter(([k, v]) => k !== "detail" && v != null && v !== "")
          .map(([k, v]) => (
            <InfoRow
              key={k}
              label={k
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())}
              value={typeof v === "object" ? JSON.stringify(v) : String(v)}
            />
          ))}

      {/* ── Detail table (array dari desc.detail) ── */}
      {config?.detailCols?.length > 0 && desc.detail?.length > 0 && (
        <DetailTable cols={config.detailCols} rows={desc.detail} />
      )}
    </div>
  );
}
