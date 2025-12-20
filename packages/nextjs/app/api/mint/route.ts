import { NextRequest, NextResponse } from "next/server";

const FINAL_DESCRIPTION = `GEN-0 Genesis — NNM Protocol Record

A singular, unreplicable digital artifact.

This digital name is recorded on-chain with a verifiable creation timestamp and immutable registration data under the NNM protocol, serving as a canonical reference layer for historical name precedence within this system.

It represents a Gen-0 registered digital asset and exists solely as a transferable NFT, without renewal, guarantees, utility promises, or dependency.

Ownership is absolute, cryptographically secured, and fully transferable.

No subscriptions. No recurring fees. No centralized control.

This record establishes the earliest verifiable origin of the name as recognized by the NNM protocol — a permanent, time-anchored digital inscription preserved on the blockchain.`;

export async function POST(request: NextRequest) {
  try {
    const { name, tier } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const pinataJWT = process.env.PINATA_JWT;

    if (!pinataJWT) {
      return NextResponse.json({ error: "Pinata JWT not configured" }, { status: 500 });
    }

    const svgContent = generateSVG(name, tier);

    // 🎨 Convert SVG to Base64 Data URI (Best for OpenSea - instant display)
    const svgBuffer = Buffer.from(svgContent, "utf-8");
    const base64SVG = svgBuffer.toString("base64");
    const imageDataURI = `data:image/svg+xml;base64,${base64SVG}`;

    const formattedTier = tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : "Founder";

    // Create metadata with embedded SVG image
    const metadata = {
      name: name,
      description: FINAL_DESCRIPTION,
      image: imageDataURI, // ✅ Embedded Base64 SVG - works instantly on OpenSea
      external_url: "https://nftnamemarket.com",
      attributes: [
        { trait_type: "Generation", value: "GEN-0 Genesis" },
        { trait_type: "Tier", value: formattedTier },
        { trait_type: "Registration Year", value: "2025" },
        { trait_type: "Platform", value: "NNM Market" },
      ],
    };

    const metadataUploadResponse = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pinataJWT}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `${name}-metadata.json`,
        },
      }),
    });

    if (!metadataUploadResponse.ok) {
      return NextResponse.json({ error: "Failed to upload metadata to IPFS" }, { status: 500 });
    }

    const metadataData = await metadataUploadResponse.json();
    const metadataIpfsHash = metadataData.IpfsHash;
    const tokenURI = `ipfs://${metadataIpfsHash}`;

    return NextResponse.json({
      success: true,
      tokenURI,
      imageDataURI,
      metadata,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function generateSVG(name: string, tier: string) {
  const universalBorder = "#FCD535";

  let styles = {
    bg1: "#001f24",
    bg2: "#003840",
    border: "#008080",
  };

  const t = tier?.toLowerCase() || "founder";

  if (t === "immortal") {
    styles = {
      bg1: "#0a0a0a",
      bg2: "#1c1c1c",
      border: universalBorder,
    };
  } else if (t === "elite") {
    styles = {
      bg1: "#2b0505",
      bg2: "#4a0a0a",
      border: "#ff3232",
    };
  }

  // Escape special characters in name for XML/SVG
  const escapedName = name
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  // Generate clean SVG without extra whitespace
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" style="stop-color:${styles.bg1};stop-opacity:1"/>
<stop offset="100%" style="stop-color:${styles.bg2};stop-opacity:1"/>
</linearGradient>
<pattern id="subtlePattern" width="20" height="20" patternUnits="userSpaceOnUse">
<circle cx="1" cy="1" r="1" fill="${styles.border}" fill-opacity="0.05"/>
</pattern>
<linearGradient id="goldText" x1="0%" y1="0%" x2="0%" y2="100%">
<stop offset="0%" stop-color="#FFD700"/>
<stop offset="50%" stop-color="#B3882A"/>
<stop offset="100%" stop-color="#FFD700"/>
</linearGradient>
<filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
<feGaussianBlur stdDeviation="10" result="blur"/>
<feComposite in="SourceGraphic" in2="blur" operator="over"/>
</filter>
</defs>
<rect width="100%" height="100%" fill="#050505"/>
<rect x="50" y="50" width="700" height="700" rx="40" ry="40" fill="url(#bgGradient)" stroke="${styles.border}" stroke-width="6"/>
<rect x="50" y="50" width="700" height="700" rx="40" ry="40" fill="url(#subtlePattern)"/>
<rect x="70" y="70" width="660" height="660" rx="30" ry="30" fill="none" stroke="${styles.border}" stroke-width="1" stroke-opacity="0.4"/>
<text x="400" y="200" text-anchor="middle" font-family="serif" font-size="32" fill="url(#goldText)" letter-spacing="8" font-weight="bold">GEN-0 GENESIS</text>
<line x1="200" y1="240" x2="600" y2="240" stroke="${styles.border}" stroke-width="1" opacity="0.5"/>
<text x="400" y="420" text-anchor="middle" dominant-baseline="middle" font-family="serif" font-size="80" fill="url(#goldText)" font-weight="900" letter-spacing="4" filter="url(#glow)">${escapedName.toUpperCase()}</text>
<line x1="200" y1="560" x2="600" y2="560" stroke="${styles.border}" stroke-width="1" opacity="0.5"/>
<text x="400" y="620" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#ffffff" letter-spacing="6" opacity="0.7">OWNED &amp; MINTED</text>
<text x="400" y="670" text-anchor="middle" font-family="serif" font-size="28" fill="${styles.border}" letter-spacing="4" font-weight="bold">2025</text>
</svg>`;

  return svg;
}
