"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const REGISTRY = "NNMRegistryV99";
const readContract: any = useScaffoldReadContract as any;

// --- Visual Constants (Keep as is) ---
const RICH_GOLD_GRADIENT_CSS =
  "linear-gradient(to bottom, #FFD700 0%, #E6BE03 25%, #B3882A 50%, #E6BE03 75%, #FFD700 100%)";

// Helper function to convert tier number to text and styling
const getTierData = (tierIndex: number) => {
  // 0: Immortal, 1: Elite, 2: Founder
  const tiers = ["IMMORTAL", "ELITE", "FOUNDERS"];
  const tierName = tiers[tierIndex] || "FOUNDERS";

  switch (tierName.toLowerCase()) {
    case "immortal":
      return {
        name: "IMMORTAL",
        bg: "linear-gradient(135deg, #0a0a0a 0%, #1c1c1c 100%)",
        border: "1px solid rgba(252, 213, 53, 0.5)",
        shadow: "0 0 80px rgba(252, 213, 53, 0.15), inset 0 0 40px rgba(0,0,0,0.8)",
        textColor: RICH_GOLD_GRADIENT_CSS,
        labelColor: "#FCD535",
      };
    case "elite":
      return {
        name: "ELITE",
        bg: "linear-gradient(135deg, #2b0505 0%, #4a0a0a 100%)",
        border: "1px solid rgba(255, 50, 50, 0.5)",
        shadow: "0 0 80px rgba(255, 50, 50, 0.2), inset 0 0 40px rgba(0,0,0,0.8)",
        textColor: RICH_GOLD_GRADIENT_CSS,
        labelColor: "#FCD535",
      };
    default: // founders
      return {
        name: "FOUNDERS",
        bg: "linear-gradient(135deg, #001f24 0%, #003840 100%)",
        border: "1px solid rgba(0, 128, 128, 0.4)",
        shadow: "0 0 60px rgba(0, 100, 100, 0.15), inset 0 0 40px rgba(0,0,0,0.9)",
        textColor: RICH_GOLD_GRADIENT_CSS,
        labelColor: "#4db6ac",
      };
  }
};

export default function AssetPage() {
  const params = useParams();
  // Convert id from URL to BigInt for contract interaction
  const tokenId = params?.id ? BigInt(Array.isArray(params.id) ? params.id[0] : params.id) : undefined;

  // --- Read real data from contract ---
  const { data: record, isLoading } = readContract({
    contractName: REGISTRY,
    functionName: "nameRecords",
    args: [tokenId],
  });

  // Read owner of the token
  const { data: owner } = readContract({
    contractName: REGISTRY,
    functionName: "ownerOf",
    args: [tokenId],
  });

  // Read token URI
  const { data: tokenURI } = readContract({
    contractName: REGISTRY,
    functionName: "tokenURI",
    args: [tokenId],
  });

  // Extract data from response
  // Contract returns: [name, tier, mintTime]
  const assetName = record ? ((record as any)[0] as string) : null;
  const tierIndex = record ? Number((record as any)[1] ?? 2) : 2; // Default Founder
  const mintTime = record ? Number((record as any)[2] ?? 0) : 0;

  if (isLoading)
    return (
      <div
        className="vh-100 bg-black text-secondary d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );

  if (!assetName)
    return (
      <div
        className="vh-100 bg-black text-white d-flex justify-content-center align-items-center"
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <h1 className="text-4xl font-bold mb-4">Asset Not Found</h1>
        <p className="opacity-70 mb-6">This token does not exist on the blockchain</p>
        <Link href="/marketplace" className="btn btn-primary">
          Back to Marketplace
        </Link>
      </div>
    );

  const style = getTierData(tierIndex);
  const mintDate = mintTime > 0 ? new Date(mintTime * 1000).toLocaleDateString() : "2025";

  return (
    <main style={{ backgroundColor: "#0d1117", minHeight: "100vh", paddingBottom: "50px" }}>
      {/* Breadcrumb */}
      <div className="container py-2" style={{ borderBottom: "1px solid #1c2128" }}>
        <div
          className="d-flex align-items-center gap-2 text-white"
          style={{ fontSize: "14px", display: "flex", gap: "0.5rem", alignItems: "center", padding: "1rem 0" }}
        >
          <Link href="/marketplace" className="text-white text-decoration-none" style={{ color: "white" }}>
            MARKET
          </Link>
          <span className="text-secondary" style={{ opacity: 0.5 }}>
            /
          </span>
          <span style={{ color: "#FCD535" }}>{assetName.toUpperCase()}</span>
          <div
            className="ms-auto px-3 bg-dark border border-secondary rounded"
            style={{
              marginLeft: "auto",
              padding: "0.25rem 0.75rem",
              background: "#1c2128",
              border: "1px solid #30363d",
              borderRadius: "0.375rem",
            }}
          >
            ID {tokenId?.toString()}
          </div>
        </div>
      </div>

      <div className="container mt-4" style={{ padding: "0 1rem", marginTop: "2rem" }}>
        <div className="row g-4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          {/* --- Premium Card Section --- */}
          <div className="col-lg-7" style={{ gridColumn: "span 1" }}>
            <div
              className="p-5 mb-3 rounded-4 d-flex justify-content-center align-items-center"
              style={{
                background: "radial-gradient(circle, #161b22 0%, #0d1117 100%)",
                border: "1px solid #1c2128",
                minHeight: "400px",
                borderRadius: "1rem",
                padding: "3rem",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  width: "350px",
                  height: "200px",
                  background: style.bg,
                  border: style.border,
                  borderRadius: "16px",
                  boxShadow: style.shadow,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <div style={{ textAlign: "center", zIndex: 2 }}>
                  <p
                    style={{
                      fontSize: "10px",
                      letterSpacing: "2px",
                      background: style.textColor,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      marginBottom: "0.5rem",
                    }}
                  >
                    GEN-0 #{tokenId?.toString()} GENESIS
                  </p>
                  <h1
                    style={{
                      fontSize: "48px",
                      fontFamily: "serif",
                      fontWeight: "900",
                      background: style.textColor,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      margin: "0.5rem 0",
                    }}
                  >
                    {assetName}
                  </h1>
                  <p
                    style={{
                      fontSize: "10px",
                      letterSpacing: "2px",
                      background: style.textColor,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      marginTop: "0.5rem",
                    }}
                  >
                    OWNED & MINTED - {mintDate}
                  </p>
                </div>
              </div>
            </div>
            <div
              className="p-4 bg-dark rounded-3 border border-secondary"
              style={{
                padding: "1.5rem",
                background: "#161b22",
                borderRadius: "0.75rem",
                border: "1px solid #30363d",
              }}
            >
              <h5 className="text-white fw-bold" style={{ color: "white", fontWeight: "bold", marginBottom: "1rem" }}>
                Asset Significance
              </h5>
              <p className="text-secondary" style={{ opacity: 0.7 }}>
                A singular, unreplicable digital artifact — timeless, unparalleled, and supremely rare. Ownership
                verified and sealed through NNM.
              </p>
            </div>
          </div>

          {/* --- Sidebar Section --- */}
          <div className="col-lg-5" style={{ gridColumn: "span 1" }}>
            <div
              className="p-4 bg-dark rounded-3 border border-secondary sticky-top"
              style={{
                top: "20px",
                padding: "1.5rem",
                background: "#161b22",
                borderRadius: "0.75rem",
                border: "1px solid #30363d",
                position: "sticky",
              }}
            >
              <div
                className="d-flex justify-content-between"
                style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}
              >
                <h2
                  className="text-white fw-bold font-serif"
                  style={{ color: "white", fontWeight: "bold", fontFamily: "serif" }}
                >
                  {assetName}
                </h2>
                <span
                  className="px-2 border border-warning text-warning rounded small"
                  style={{
                    padding: "0.25rem 0.5rem",
                    border: "1px solid #FCD535",
                    color: "#FCD535",
                    borderRadius: "0.25rem",
                    fontSize: "0.75rem",
                  }}
                >
                  GEN-0
                </span>
              </div>
              <p
                className="small text-secondary mb-4"
                style={{ fontSize: "0.875rem", opacity: 0.7, marginBottom: "1rem" }}
              >
                Tier: <span style={{ color: style.labelColor }}>{style.name}</span>
              </p>

              <div
                className="p-3 bg-black rounded border border-secondary mb-4"
                style={{
                  padding: "1rem",
                  background: "#0d1117",
                  borderRadius: "0.5rem",
                  border: "1px solid #30363d",
                  marginBottom: "1rem",
                }}
              >
                <span className="small text-secondary" style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                  Owner
                </span>
                <h3
                  className="text-white fw-bold"
                  style={{
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.875rem",
                    marginTop: "0.25rem",
                    wordBreak: "break-all",
                  }}
                >
                  {owner ? `${owner.slice(0, 6)}...${owner.slice(-4)}` : "Unknown"}
                </h3>
              </div>

              <div
                className="row g-2 text-center"
                style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", textAlign: "center" }}
              >
                <div
                  className="col-4 p-2 border border-secondary rounded"
                  style={{ padding: "0.75rem", border: "1px solid #30363d", borderRadius: "0.375rem" }}
                >
                  <div className="small text-secondary" style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                    Collection
                  </div>
                  <div
                    className="text-white small"
                    style={{ color: "white", fontSize: "0.875rem", marginTop: "0.25rem" }}
                  >
                    Genesis
                  </div>
                </div>
                <div
                  className="col-4 p-2 border border-secondary rounded"
                  style={{ padding: "0.75rem", border: "1px solid #30363d", borderRadius: "0.375rem" }}
                >
                  <div className="small text-secondary" style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                    Chain
                  </div>
                  <div
                    className="text-white small"
                    style={{ color: "white", fontSize: "0.875rem", marginTop: "0.25rem" }}
                  >
                    Polygon
                  </div>
                </div>
                <div
                  className="col-4 p-2 border border-secondary rounded"
                  style={{ padding: "0.75rem", border: "1px solid #30363d", borderRadius: "0.375rem" }}
                >
                  <div className="small text-secondary" style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                    Items
                  </div>
                  <div
                    className="text-white small"
                    style={{ color: "white", fontSize: "0.875rem", marginTop: "0.25rem" }}
                  >
                    1/1
                  </div>
                </div>
              </div>

              {tokenURI && (
                <div className="mt-4" style={{ marginTop: "1.5rem" }}>
                  <a
                    href={tokenURI.toString()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline w-full"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #30363d",
                      borderRadius: "0.375rem",
                      textAlign: "center",
                      textDecoration: "none",
                      color: "white",
                      display: "block",
                    }}
                  >
                    View Metadata on IPFS
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
