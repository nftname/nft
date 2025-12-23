"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { getTierColorStyle, resolveTier } from "~~/utils/tierHelper";

const GOLD_GRADIENT = "linear-gradient(135deg, #FFF5CC 0%, #FCD535 40%, #B3882A 100%)";

// --- مكون البطاقة (يجلب بياناته بنفسه) ---
const DashboardAssetCard = ({ address, index }: { address: string; index: number }) => {
  // 1. الحصول على الـ Token ID
  const { data: tokenId } = useScaffoldReadContract({
    contractName: "NNMRegistryV99",
    functionName: "tokenOfOwnerByIndex",
    args: [address, BigInt(index)],
  });

  // 2. الحصول على تفاصيل الاسم
  const { data: record } = useScaffoldReadContract({
    contractName: "NNMRegistryV99",
    functionName: "nameRecords",
    args: [tokenId],
  });

  if (!tokenId || !record) return <div className="animate-pulse bg-gray-800 rounded-xl h-64 w-full"></div>;

  const name = record[0];
  const tier = resolveTier(record[1]);
  const style = getTierColorStyle(tier);

  return (
    <div
      className="p-3 h-100"
      style={{ backgroundColor: "#161b22", borderRadius: "12px", border: "1px solid #1c2128" }}
    >
      <div
        className="mb-3"
        style={{
          width: "100%",
          height: "160px",
          background: style.bg,
          border: `1px solid ${style.border}`,
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h3
            style={{
              fontFamily: "serif",
              fontWeight: "900",
              fontSize: "24px",
              background: GOLD_GRADIENT,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textTransform: "uppercase",
            }}
          >
            {name}
          </h3>
        </div>
      </div>
      <div className="w-100">
        <div className="d-flex justify-content-between align-items-end mb-3">
          <div>
            <div className="text-secondary text-uppercase" style={{ fontSize: "9px" }}>
              Tier
            </div>
            <div style={{ color: style.color, fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
              {tier}
            </div>
          </div>
          <div className="text-end">
            <div className="text-secondary text-uppercase" style={{ fontSize: "9px" }}>
              ID
            </div>
            <div className="text-white fw-bold" style={{ fontSize: "12px" }}>
              #{tokenId.toString()}
            </div>
          </div>
        </div>
        <Link href={`/asset/${tokenId.toString()}`} className="text-decoration-none">
          <button
            className="btn w-100 py-2 border-secondary text-white"
            style={{ backgroundColor: "#0d1117", fontSize: "12px", fontWeight: "600" }}
          >
            <i className="bi bi-gear-fill me-2 text-secondary"></i> Manage Asset
          </button>
        </Link>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState("ALL");

  const { data: balance } = useScaffoldReadContract({
    contractName: "NNMRegistryV99",
    functionName: "balanceOf",
    args: [address],
  });

  const count = balance ? Number(balance) : 0;
  const indices = Array.from({ length: count }, (_, i) => i);

  return (
    <main style={{ backgroundColor: "#0d1117", minHeight: "100vh", fontFamily: "sans-serif", paddingBottom: "80px" }}>
      {/* Header Stats (Design Preserved) */}
      <div className="container pt-5 pb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-end gap-4">
          <div>
            <h5 className="text-secondary text-uppercase mb-2" style={{ letterSpacing: "2px", fontSize: "12px" }}>
              Welcome Back
            </h5>
            <h1 className="text-white fw-bold m-0" style={{ fontFamily: "serif", fontSize: "36px" }}>
              My Portfolio
            </h1>
            <div className="d-flex align-items-center gap-2 mt-2">
              <span className="badge bg-dark border border-secondary text-secondary px-3 py-2">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>
          </div>
          <div
            className="d-flex gap-4 p-3 rounded-3"
            style={{ backgroundColor: "#161b22", border: "1px solid #1c2128" }}
          >
            <div>
              <div className="text-secondary text-uppercase" style={{ fontSize: "10px" }}>
                Total Assets
              </div>
              <div className="text-white fw-bold" style={{ fontSize: "20px" }}>
                {count}
              </div>
            </div>
          </div>
        </div>
        <div
          className="w-100 my-4"
          style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(252, 213, 53, 0.3) 50%, transparent 100%)",
          }}
        ></div>
      </div>

      {/* Tabs */}
      <div className="container mb-5">
        <div className="d-flex gap-3">
          {["ALL"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="btn fw-bold rounded-pill px-4"
              style={{
                backgroundColor: activeTab === tab ? "#FCD535" : "transparent",
                color: activeTab === tab ? "#000" : "#888",
                border: "1px solid #333",
                fontSize: "12px",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Content */}
      <div className="container">
        <div className="row g-4">
          {!isConnected ? (
            <div className="text-white">Please connect wallet</div>
          ) : count === 0 ? (
            <div className="text-white opacity-50">No assets found. Mint your first one!</div>
          ) : (
            indices.map(i => (
              <div key={i} className="col-12 col-md-6 col-lg-4 col-xl-3">
                <DashboardAssetCard address={address!} index={i} />
              </div>
            ))
          )}

          {/* Mint New Card */}
          <div className="col-12 col-md-6 col-lg-4 col-xl-3">
            <Link href="/mint" className="text-decoration-none">
              <div
                className="h-100 d-flex flex-column align-items-center justify-content-center p-4"
                style={{ border: "1px dashed #333", borderRadius: "12px", minHeight: "280px" }}
              >
                <i className="bi bi-plus-lg text-secondary mb-3" style={{ fontSize: "28px" }}></i>
                <span className="text-secondary fw-bold text-uppercase" style={{ fontSize: "12px" }}>
                  Mint New Asset
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
