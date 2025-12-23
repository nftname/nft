"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { resolveTier } from "~~/utils/tierHelper";

const GOLD_GRADIENT = "linear-gradient(180deg, #FFD700 0%, #B3882A 100%)";
const REGISTRY = "NNMRegistryV99";
const readContract: any = useScaffoldReadContract as any;

// --- مكون فرعي للصف (لجلب البيانات لكل كرت على حدة) ---
const MarketRow = ({
  tokenId,
  watchlist,
  toggleWatchlist,
}: {
  tokenId: bigint;
  watchlist: number[];
  toggleWatchlist: (id: number) => void;
}) => {
  const { data: record } = readContract({
    contractName: REGISTRY,
    functionName: "nameRecords",
    args: [tokenId],
  });

  if (!record) return null; // لا تعرض شيئاً حتى تكتمل البيانات

  const name = (record as any)[0] as string;
  const tier = resolveTier(Number((record as any)[1] ?? 0));
  const id = Number(tokenId);

  // تصميم الأيقونة حسب الفئة
  let iconBg = "#222";
  if (tier === "immortal") iconBg = "linear-gradient(135deg, #333 0%, #111 100%)";
  if (tier === "elite") iconBg = "linear-gradient(135deg, #4a0a0a 0%, #1a0000 100%)";
  if (tier === "founders") iconBg = "linear-gradient(135deg, #004d40 0%, #002b36 100%)";

  return (
    <tr className="market-row" style={{ transition: "background-color 0.2s" }}>
      <td style={{ padding: "16px 10px", borderBottom: "1px solid #1c2128", backgroundColor: "transparent" }}>
        <div className="d-flex align-items-center gap-3">
          <i
            className={`bi ${watchlist.includes(id) ? "bi-star-fill text-warning" : "bi-star text-secondary"} hover-gold cursor-pointer`}
            style={{ fontSize: "14px" }}
            onClick={() => toggleWatchlist(id)}
          ></i>
          <span style={{ color: "#fff", fontWeight: "500", fontSize: "14px" }}>#{id}</span>
        </div>
      </td>
      <td style={{ padding: "16px 10px", borderBottom: "1px solid #1c2128", backgroundColor: "transparent" }}>
        <Link href={`/asset/${id}`} className="d-flex align-items-center gap-3 text-decoration-none group">
          <div
            style={{
              width: "45px",
              height: "45px",
              borderRadius: "50%",
              background: iconBg,
              border: "1px solid rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FCD535",
              fontWeight: "bold",
              fontFamily: "serif",
            }}
          >
            {name.charAt(0)}
          </div>
          <span className="text-white fw-bold name-hover" style={{ fontSize: "14px", letterSpacing: "0.5px" }}>
            {name}
          </span>
        </Link>
      </td>
      <td style={{ padding: "16px 10px", borderBottom: "1px solid #1c2128" }} className="text-white">
        10 POL
      </td>
      <td style={{ padding: "16px 10px", borderBottom: "1px solid #1c2128" }} className="text-end text-white">
        Minted
      </td>
      <td style={{ padding: "16px 10px", borderBottom: "1px solid #1c2128" }} className="text-end text-white">
        {tier.toUpperCase()}
      </td>
      <td className="text-center" style={{ padding: "16px 10px", borderBottom: "1px solid #1c2128" }}>
        <Link href={`/asset/${id}`} className="text-decoration-none">
          <button
            className="btn btn-sm fw-bold"
            style={{ background: GOLD_GRADIENT, color: "#000", fontSize: "10px", padding: "4px 12px", border: "none" }}
          >
            VIEW
          </button>
        </Link>
      </td>
    </tr>
  );
};

export default function MarketPage() {
  const [activeFilter, setActiveFilter] = useState("All Assets");
  const [watchlist, setWatchlist] = useState<number[]>([]);

  // 1. قراءة العدد الكلي للكروت
  const { data: totalSupply } = readContract({
    contractName: REGISTRY,
    functionName: "totalSupply",
  });

  // 2. إنشاء قائمة الأرقام (IDs)
  const total = totalSupply ? Number(totalSupply) : 0;
  // نعكس الترتيب ليظهر الأحدث أولاً
  const tokenIds = useMemo(() => {
    return Array.from({ length: total }, (_, i) => BigInt(total - 1 - i));
  }, [total]);

  const toggleWatchlist = (id: number) => {
    setWatchlist(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  return (
    <main
      style={{
        backgroundColor: "#0d1117",
        minHeight: "100vh",
        fontFamily: '"Inter", sans-serif',
        paddingBottom: "50px",
      }}
    >
      {/* Header Section (Design Preserved) */}
      <section className="container pt-3 pb-3">
        <div className="text-center text-lg-start pt-2">
          <h1 className="fw-bold text-white mb-2" style={{ fontSize: "1.53rem" }}>
            Live <span style={{ color: "#FCD535" }}>Nexus Market</span>
          </h1>
          <p style={{ color: "#848E9C", fontSize: "15px" }}>Real-time blockchain data. {total} Assets Minted.</p>
        </div>
      </section>

      {/* Filter Section (Design Preserved) */}
      <section className="container mb-0 mt-4">
        <div
          className="d-flex gap-4 border-top border-bottom border-secondary py-2 overflow-auto"
          style={{ borderColor: "#222 !important" }}
        >
          <div
            onClick={() => setActiveFilter("All Assets")}
            className={`cursor-pointer fw-bold ${activeFilter === "All Assets" ? "text-white" : "text-secondary"}`}
          >
            All Assets
          </div>
          <div
            onClick={() => setActiveFilter("Watchlist")}
            className={`cursor-pointer fw-bold ${activeFilter === "Watchlist" ? "text-white" : "text-secondary"}`}
          >
            Watchlist
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="container mt-5 pt-0">
        <div className="table-responsive no-scrollbar">
          <table
            className="table align-middle mb-0"
            style={{ minWidth: "900px", borderCollapse: "separate", borderSpacing: "0" }}
          >
            <thead style={{ position: "sticky", top: "0", zIndex: 50, backgroundColor: "#0d1117" }}>
              <tr style={{ borderBottom: "1px solid #333" }}>
                <th style={{ backgroundColor: "#0d1117", color: "#c0c0c0", padding: "10px" }}>ID</th>
                <th style={{ backgroundColor: "#0d1117", color: "#c0c0c0", padding: "10px" }}>Asset Name</th>
                <th style={{ backgroundColor: "#0d1117", color: "#c0c0c0", padding: "10px" }}>Floor Price</th>
                <th style={{ backgroundColor: "#0d1117", color: "#c0c0c0", padding: "10px", textAlign: "right" }}>
                  Status
                </th>
                <th style={{ backgroundColor: "#0d1117", color: "#c0c0c0", padding: "10px", textAlign: "right" }}>
                  Tier
                </th>
                <th style={{ backgroundColor: "#0d1117", color: "#c0c0c0", padding: "10px", textAlign: "center" }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {tokenIds.map(tokenId => (
                <MarketRow
                  key={tokenId.toString()}
                  tokenId={tokenId}
                  watchlist={watchlist}
                  toggleWatchlist={toggleWatchlist}
                />
              ))}
              {tokenIds.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-white py-5">
                    No Assets Minted Yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
