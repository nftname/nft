"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatEther } from "viem";
import { useNNMAllAssets, useNNMAssetData, useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const GOLD_GRADIENT = "linear-gradient(180deg, #FFD700 0%, #B3882A 100%)";
const ITEMS_PER_PAGE = 30;

const CoinIcon = ({ name, tier }: { name: string; tier: string }) => {
  let bg = "#222";
  if (tier === "immortal") bg = "linear-gradient(135deg, #333 0%, #111 100%)";
  if (tier === "elite") bg = "linear-gradient(135deg, #4a0a0a 0%, #1a0000 100%)";
  if (tier === "founders" || tier === "prime") bg = "linear-gradient(135deg, #004d40 0%, #002b36 100%)";

  return (
    <div
      style={{
        width: "45px",
        height: "45px",
        borderRadius: "50%",
        background: bg,
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "inset 0 0 5px rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "16px",
        fontWeight: "bold",
        fontFamily: "serif",
        color: "#FCD535",
        textShadow: "0 1px 2px rgba(0,0,0,0.8)",
        flexShrink: 0,
      }}
    >
      {name ? name.charAt(0).toUpperCase() : "?"}
    </div>
  );
};

const ActionButton = ({ text }: { text: string }) => (
  <button
    className="btn btn-sm fw-bold flex items-center justify-center hover:opacity-90"
    style={{
      background: GOLD_GRADIENT,
      border: "none",
      color: "#000",
      fontSize: "10px",
      padding: "4px 12px",
      borderRadius: "2px",
      boxShadow: "0 1px 4px rgba(252, 213, 53, 0.2)",
      height: "24px",
      width: "50px",
      cursor: "pointer",
    }}
  >
    {text}
  </button>
);

const getRankStyle = (rank: number) => {
  const baseStyle = { fontStyle: "italic", fontWeight: "800", fontSize: "18px" };
  if (rank === 1) return { ...baseStyle, color: "#FF9900", textShadow: "0 0 10px rgba(255, 153, 0, 0.4)" };
  if (rank === 2) return { ...baseStyle, color: "#FFC233", textShadow: "0 0 10px rgba(255, 194, 51, 0.3)" };
  if (rank === 3) return { ...baseStyle, color: "#FCD535", textShadow: "0 0 10px rgba(252, 213, 53, 0.2)" };
  return { color: "#fff", fontWeight: "500", fontSize: "14px", fontStyle: "normal" };
};

const SortArrows = ({ active, direction, onClick }: any) => (
  <div
    onClick={onClick}
    className="inline-flex flex-col ms-2 cursor-pointer"
    style={{ height: "16px", justifyContent: "center", verticalAlign: "middle", width: "10px" }}
  >
    <span
      style={{
        width: 0,
        height: 0,
        borderLeft: "4px solid transparent",
        borderRight: "4px solid transparent",
        borderBottom: `4px solid ${active && direction === "asc" ? "#FCD535" : "#6c757d"}`,
        marginBottom: "2px",
      }}
    ></span>
    <span
      style={{
        width: 0,
        height: 0,
        borderLeft: "4px solid transparent",
        borderRight: "4px solid transparent",
        borderTop: `4px solid ${active && direction === "desc" ? "#FCD535" : "#6c757d"}`,
      }}
    ></span>
  </div>
);

const MarketRow = ({
  tokenId,
  watchlist,
  toggleWatchlist,
  rank,
}: {
  tokenId: bigint;
  watchlist: number[];
  toggleWatchlist: (id: number) => void;
  rank: number;
}) => {
  // The Warehouse: Single source of truth for asset data
  const assetData = useNNMAssetData(tokenId);

  // Marketplace pipe: fetch dynamic listing state and price
  const { data: listedRaw } = useScaffoldReadContract({
    contractName: "NNMMarketplaceZeroPlus",
    functionName: "isListed",
    args: [tokenId],
  });
  const { data: priceRaw } = useScaffoldReadContract({
    contractName: "NNMMarketplaceZeroPlus",
    functionName: "listingPrice",
    args: [tokenId],
  });

  if (!assetData) return null;

  const { name, tier, displayName } = assetData;
  const id = Number(tokenId);

  const isListed = Boolean(listedRaw);
  const priceWei = (priceRaw ?? 0n) as bigint;
  const pricePOL = isListed ? formatEther(priceWei) : undefined;
  const pricePOLShort = pricePOL ? Number(pricePOL).toFixed(4) : undefined;

  return (
    <tr className="market-row transition-colors duration-200">
      <td style={{ padding: "16px 10px", borderBottom: "1px solid #1c2128", backgroundColor: "transparent" }}>
        <div className="flex items-center gap-3">
          <i
            className={`cursor-pointer hover-gold ${watchlist.includes(id) ? "text-warning" : "text-secondary"}`}
            style={{ fontStyle: "normal", fontSize: "14px" }}
            onClick={() => toggleWatchlist(id)}
          >
            {watchlist.includes(id) ? "★" : "☆"}
          </i>
          <span style={getRankStyle(rank) as any}>{rank}</span>
        </div>
      </td>
      <td style={{ padding: "16px 10px", borderBottom: "1px solid #1c2128", backgroundColor: "transparent" }}>
        <Link href={`/asset/${id}`} className="flex items-center gap-3 text-decoration-none group">
          <CoinIcon name={name} tier={tier} />
          <span
            className="text-white font-bold name-hover name-shake"
            style={{ fontSize: "14px", letterSpacing: "0.5px" }}
          >
            {displayName}
          </span>
        </Link>
      </td>
      <td
        className="text-start"
        style={{ padding: "16px 10px", borderBottom: "1px solid #1c2128", backgroundColor: "transparent" }}
      >
        <div className="flex items-center justify-start gap-2">
          {isListed ? (
            <>
              <span className="fw-bold text-white" style={{ fontSize: "14px" }}>
                {pricePOLShort}
              </span>
              <span className="text-white" style={{ fontSize: "12px" }}>
                POL
              </span>
            </>
          ) : (
            <span className="text-white/60" style={{ fontSize: "13px" }}>
              Not listed
            </span>
          )}
        </div>
      </td>
      <td
        className="text-end"
        style={{ padding: "16px 10px", borderBottom: "1px solid #1c2128", backgroundColor: "transparent" }}
      >
        <span className="text-white" style={{ fontSize: "13px" }}>
          Minted
        </span>
      </td>
      <td
        className="text-end"
        style={{ padding: "16px 10px", borderBottom: "1px solid #1c2128", backgroundColor: "transparent" }}
      >
        <span className="text-white" style={{ fontSize: "13px" }}>
          {tier.toUpperCase()}
        </span>
      </td>
      <td
        className="text-end"
        style={{ padding: "16px 10px", borderBottom: "1px solid #1c2128", backgroundColor: "transparent" }}
      >
        <span className="text-white" style={{ fontSize: "12px" }}>
          Just Now
        </span>
      </td>
      <td
        className="text-center"
        style={{ padding: "16px 10px", borderBottom: "1px solid #1c2128", backgroundColor: "transparent" }}
      >
        <div className="flex justify-center gap-2">
          <Link href={`/asset/${id}`} className="text-decoration-none">
            {isListed ? <ActionButton text="Buy" /> : <ActionButton text="View" />}
          </Link>
          <Link href={`/asset/${id}`} className="text-decoration-none">
            <button
              className="btn btn-sm text-white-50 border-secondary hover-white"
              style={{
                fontSize: "10px",
                padding: "4px 10px",
                borderRadius: "2px",
                background: "transparent",
              }}
            >
              Bid
            </button>
          </Link>
        </div>
      </td>
    </tr>
  );
};

export default function MarketPage() {
  const [activeFilter, setActiveFilter] = useState("All Assets");
  const [timeFilter, setTimeFilter] = useState("24H");
  const [currencyFilter, setCurrencyFilter] = useState("POL");
  const [watchlist, setWatchlist] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // Use The Warehouse to fetch all assets
  const { tokenIds: allTokenIds, totalCount } = useNNMAllAssets();

  const totalPages = Math.ceil(allTokenIds.length / ITEMS_PER_PAGE);
  const currentTokenIds = allTokenIds.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const toggleWatchlist = (id: number) => {
    setWatchlist(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "desc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <main
      className="w-full flex flex-col"
      style={{
        backgroundColor: "#0d1117",
        minHeight: "100vh",
        fontFamily: '"Inter", "Segoe UI", sans-serif',
        paddingBottom: "50px",
      }}
    >
      <section className="container mx-auto px-4 pt-3 pb-3 hidden md:block">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="text-center lg:text-left pt-2 flex-1">
            <h1
              className="font-bold text-white mb-2 whitespace-nowrap"
              style={{
                fontFamily: '"Inter", "Segoe UI", sans-serif',
                fontSize: "1.53rem",
                fontWeight: "700",
                letterSpacing: "-1px",
                lineHeight: "1.2",
              }}
            >
              Buy & Sell <span style={{ color: "#FCD535" }}>Nexus Rare</span> Digital Name Assets NFTs.
            </h1>

            <p
              style={{
                fontSize: "15px",
                fontFamily: '"Inter", "Segoe UI", sans-serif',
                fontWeight: "400",
                lineHeight: "1.6",
                maxWidth: "650px",
                color: "#848E9C",
                marginTop: "10px",
                marginBottom: 0,
              }}
            >
              Live prices, verified rarity, and a growing marketplace where traders compete for the most valuable
              digital name assets. Turn your NFTs into liquid financial power.
            </p>
          </div>
          <div style={{ width: "100%", maxWidth: "380px" }}></div>
        </div>
      </section>

      <section className="block md:hidden pt-3 pb-2 px-3 text-left">
        <h1
          className="font-bold text-white text-xl text-left m-0"
          style={{ fontFamily: '"Inter", "Segoe UI", sans-serif', letterSpacing: "-0.5px", lineHeight: "1.3" }}
        >
          Buy & Sell <span style={{ color: "#FCD535" }}>Nexus Rare</span> Digital Name Assets NFTs.
        </h1>
        <p
          className="text-left"
          style={{
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            fontSize: "13px",
            color: "#848E9C",
            marginTop: "8px",
            marginBottom: 0,
            lineHeight: "1.5",
          }}
        >
          Live prices, verified rarity, and a growing marketplace where traders compete for the most valuable digital
          name assets.
        </p>
      </section>

      <section className="container mx-auto px-4 mb-0 mt-4">
        <div
          className="flex flex-col lg:flex-row justify-between items-center gap-3 border-t border-b border-secondary"
          style={{ borderColor: "#222", padding: "2px 0", borderWidth: "1px" }}
        >
          <div
            className="flex gap-4 overflow-auto no-scrollbar w-full lg:w-auto items-center justify-start"
            style={{ paddingTop: "2px" }}
          >
            <div
              onClick={() => setActiveFilter("Watchlist")}
              className={`flex items-center gap-1 cursor-pointer filter-item ${activeFilter === "Watchlist" ? "active" : ""}`}
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: activeFilter === "Watchlist" ? "#fff" : "#FCD535",
                paddingBottom: "4px",
              }}
            >
              <span className={activeFilter === "Watchlist" ? "text-warning" : ""}>★</span> Watchlist
            </div>
            {["Trending", "Top", "All Assets"].map(f => (
              <div
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`cursor-pointer filter-item font-bold ${activeFilter === f ? "text-white active" : "text-header-gray"} whitespace-nowrap`}
                style={{ fontSize: "16px", position: "relative", paddingBottom: "4px" }}
              >
                {f}
              </div>
            ))}
          </div>

          <div
            className="flex gap-3 items-center w-full lg:w-auto overflow-auto no-scrollbar justify-start lg:justify-end"
            style={{ height: "32px", marginTop: "2px", marginBottom: "2px" }}
          >
            <div className="binance-filter-group flex items-center flex-shrink-0" style={{ height: "100%" }}>
              {["All", "ETH", "POL"].map(c => (
                <button
                  key={c}
                  onClick={() => setCurrencyFilter(c)}
                  className={`btn btn-sm border-0 binance-filter-btn hover-gold-text ${currencyFilter === c ? "active-currency" : "text-header-gray"}`}
                  style={{
                    fontSize: "13px",
                    minWidth: "50px",
                    fontWeight: "400",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="binance-filter-group flex items-center flex-shrink-0" style={{ height: "100%" }}>
              {["1H", "6H", "24H", "7D", "All"].map(t => (
                <button
                  key={t}
                  onClick={() => setTimeFilter(t)}
                  className={`btn btn-sm border-0 binance-filter-btn hover-gold-text ${timeFilter === t ? "active-time" : "text-header-gray"}`}
                  style={{
                    fontSize: "13px",
                    minWidth: "45px",
                    fontWeight: "400",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 mt-5 pt-0">
        <div className="overflow-x-auto no-scrollbar">
          {activeFilter === "Watchlist" && watchlist.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <span style={{ fontSize: "40px", marginBottom: "10px", display: "block" }}>★</span>
              Your watchlist is empty. Star assets to track them here.
            </div>
          ) : (
            <table
              className="table align-middle mb-0 w-full"
              style={{ minWidth: "900px", borderCollapse: "separate", borderSpacing: "0" }}
            >
              <thead style={{ position: "sticky", top: "0", zIndex: 50, backgroundColor: "#0d1117" }}>
                <tr style={{ borderBottom: "1px solid #333" }}>
                  <th
                    onClick={() => handleSort("rank")}
                    style={{
                      backgroundColor: "#0d1117",
                      color: "#c0c0c0",
                      fontSize: "15px",
                      fontWeight: "600",
                      padding: "4px 10px",
                      borderBottom: "1px solid #333",
                      width: "80px",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div className="flex items-center">
                      Rank <SortArrows active={sortConfig?.key === "rank"} direction={sortConfig?.direction} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("name")}
                    style={{
                      backgroundColor: "#0d1117",
                      color: "#c0c0c0",
                      fontSize: "15px",
                      fontWeight: "600",
                      padding: "4px 10px",
                      borderBottom: "1px solid #333",
                      minWidth: "220px",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div className="flex items-center">
                      Asset Name <SortArrows active={sortConfig?.key === "name"} direction={sortConfig?.direction} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("floor")}
                    style={{
                      backgroundColor: "#0d1117",
                      color: "#c0c0c0",
                      fontSize: "15px",
                      fontWeight: "600",
                      padding: "4px 10px",
                      borderBottom: "1px solid #333",
                      textAlign: "left",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                    }}
                  >
                    <div className="flex items-center justify-start">
                      Floor Price <SortArrows active={sortConfig?.key === "floor"} direction={sortConfig?.direction} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("lastSale")}
                    style={{
                      backgroundColor: "#0d1117",
                      color: "#c0c0c0",
                      fontSize: "15px",
                      fontWeight: "600",
                      padding: "4px 10px",
                      borderBottom: "1px solid #333",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                    }}
                  >
                    <div className="flex items-center justify-end">
                      Last Sale <SortArrows active={sortConfig?.key === "lastSale"} direction={sortConfig?.direction} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("volume")}
                    style={{
                      backgroundColor: "#0d1117",
                      color: "#c0c0c0",
                      fontSize: "15px",
                      fontWeight: "600",
                      padding: "4px 10px",
                      borderBottom: "1px solid #333",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                    }}
                  >
                    <div className="flex items-center justify-end">
                      Volume <SortArrows active={sortConfig?.key === "volume"} direction={sortConfig?.direction} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("listed")}
                    style={{
                      backgroundColor: "#0d1117",
                      color: "#c0c0c0",
                      fontSize: "15px",
                      fontWeight: "600",
                      padding: "4px 10px",
                      borderBottom: "1px solid #333",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                    }}
                  >
                    <div className="flex items-center justify-end">
                      Listed <SortArrows active={sortConfig?.key === "listed"} direction={sortConfig?.direction} />
                    </div>
                  </th>
                  <th
                    style={{
                      backgroundColor: "#0d1117",
                      color: "#c0c0c0",
                      fontSize: "15px",
                      fontWeight: "600",
                      padding: "4px 10px",
                      borderBottom: "1px solid #333",
                      textAlign: "center",
                      width: "140px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {currentTokenIds.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-secondary py-5">
                      Loading Assets or No Data Found...
                    </td>
                  </tr>
                ) : (
                  currentTokenIds.map((tokenId, index) => (
                    <MarketRow
                      key={tokenId.toString()}
                      tokenId={tokenId}
                      rank={(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      watchlist={watchlist}
                      toggleWatchlist={toggleWatchlist}
                    />
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && activeFilter !== "Watchlist" && (
          <div
            className="flex justify-center items-center gap-3 mt-5 text-secondary"
            style={{ fontSize: "14px", paddingBottom: "30px" }}
          >
            <span
              className={`cursor-pointer ${currentPage === 1 ? "text-gray-600" : "hover-white"}`}
              onClick={() => goToPage(currentPage - 1)}
            >
              &lt;
            </span>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
              if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                return (
                  <span
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`cursor-pointer ${currentPage === page ? "text-white fw-bold" : "hover-white"}`}
                    style={{ padding: "0 5px" }}
                  >
                    {page}
                  </span>
                );
              } else if (page === currentPage - 3 || page === currentPage + 3) {
                return <span key={page}>...</span>;
              }
              return null;
            })}

            <span
              className={`cursor-pointer ${currentPage === totalPages ? "text-gray-600" : "hover-white"}`}
              onClick={() => goToPage(currentPage + 1)}
            >
              &gt;
            </span>
          </div>
        )}
      </section>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .market-row:hover td {
          background-color: rgba(255, 255, 255, 0.03) !important;
        }

        .name-hover:hover {
          color: #fcd535;
          text-decoration: none !important;
        }

        @keyframes subtleShake {
          0% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(2px);
          }
          50% {
            transform: translateX(-2px);
          }
          75% {
            transform: translateX(1px);
          }
          100% {
            transform: translateX(0);
          }
        }
        .market-row:hover .name-shake {
          animation: subtleShake 0.4s ease-in-out;
          color: #fcd535 !important;
        }

        .filter-item {
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          cursor: pointer;
          padding-bottom: 4px;
        }
        .filter-item:hover,
        .filter-item.active {
          color: #fff !important;
          border-bottom: 2px solid #fcd535;
        }

        .binance-filter-btn {
          border-radius: 2px;
          padding: 6px 12px;
          transition: all 0.2s;
        }
        .binance-filter-group {
          border: 1px solid #333;
          background: transparent;
          padding: 4px;
          border-radius: 2px;
          gap: 2px;
        }
        .active-time,
        .active-currency {
          background-color: #2b3139 !important;
          color: #fcd535 !important;
        }
        .text-header-gray {
          color: #848e9c !important;
        }

        .hover-gold-text:hover:not(.active-time):not(.active-currency) {
          color: #fcd535 !important;
        }

        .hover-gold:hover {
          color: #fcd535 !important;
        }
        .hover-white:hover {
          color: #fff !important;
          border-color: #fff !important;
        }
      `}</style>
    </main>
  );
}
