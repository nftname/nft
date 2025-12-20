import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

const GLOBAL_DESCRIPTION = `GEN-0 Genesis — NNM Protocol Record

A singular, unreplicable digital artifact.

This digital name is recorded on-chain with a verifiable creation timestamp and immutable registration data under the NNM protocol, serving as a canonical reference layer for historical name precedence within this system.

It represents a Gen-0 registered digital asset and exists solely as a transferable NFT, without renewal, guarantees, utility promises, or dependency.

Ownership is absolute, cryptographically secured, and fully transferable.

No subscriptions. No recurring fees. No centralized control.

This record establishes the earliest verifiable origin of the name as recognized by the NNM protocol — a permanent, time-anchored digital inscription preserved on the blockchain.`;

export async function POST(req: Request) {
  try {
    const { name, tier } = await req.json();

    if (!process.env.PINATA_JWT) {
      return NextResponse.json({ error: "Server Config Error: Missing PINATA_JWT" }, { status: 500 });
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const svgContent = generateSVG(name, tier);
    const svgBuffer = Buffer.from(svgContent);
    const pngBuffer = await sharp(svgBuffer).resize(800, 800).png().toBuffer();

    const blob = new Blob([new Uint8Array(pngBuffer)], { type: "image/png" });
    const formData = new FormData();
    formData.append("file", blob, `${name.replace(/\s+/g, "_")}.png`);
    formData.append("pinataMetadata", JSON.stringify({ name: `${name}.png` }));
    formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

    const imageUploadRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
      body: formData,
    });

    if (!imageUploadRes.ok) throw new Error("Image Upload Failed");

    const imageResult = await imageUploadRes.json();
    const imageIpfsHash = imageResult.IpfsHash;
    const imageUri = `ipfs://${imageIpfsHash}`;
    const imageGatewayUrl = `https://ipfs.io/ipfs/${imageIpfsHash}`;

    const formattedTier = tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : "Founder";

    const metadata = {
      name: name,
      description: GLOBAL_DESCRIPTION,
      image: imageUri,
      external_url: "https://nftnamemarket.com",
      attributes: [
        { trait_type: "Generation", value: "GEN-0 Genesis" },
        { trait_type: "Tier", value: formattedTier },
        { trait_type: "Registration Year", value: "2025" },
        { trait_type: "Platform", value: "NNM Market" },
      ],
    };

    const jsonUploadRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: { name: `${name}-metadata.json` },
      }),
    });

    if (!jsonUploadRes.ok) throw new Error("JSON Upload Failed");

    const jsonResult = await jsonUploadRes.json();
    const tokenUri = `ipfs://${jsonResult.IpfsHash}`;

    return NextResponse.json({
      success: true,
      tokenURI: tokenUri,
      imageIpfs: imageUri,
      imageGateway: imageGatewayUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to upload assets" }, { status: 500 });
  }
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

function generateSVG(name: string, tier: string) {
  const universalBorder = "#FCD535";
  let styles = { bg1: "#001f24", bg2: "#003840", border: "#FCD535", text: "#FCD535" };

  const t = tier?.toLowerCase() || "founder";
  if (t === "immortal") styles = { bg1: "#0a0a0a", bg2: "#1c1c1c", border: universalBorder, text: "#FCD535" };
  else if (t === "elite") styles = { bg1: "#2b0505", bg2: "#4a0a0a", border: "#ff3232", text: "#FCD535" };

  const cleanName = escapeXml(name.replace(/[^a-zA-Z0-9 ]/g, "").toUpperCase());
  const textGenesis = escapeXml("GEN-0 GENESIS");
  const textOwned = escapeXml("OWNED & MINTED");
  const textYear = escapeXml("2025");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${styles.bg1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${styles.bg2};stop-opacity:1" />
    </linearGradient>
    <style type="text/css">
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
    </style>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#bgGradient)" rx="40" ry="40" stroke="${styles.border}" stroke-width="2" />

  <text x="400" y="150" text-anchor="middle" font-family="'Playfair Display', serif" font-size="36" fill="${styles.text}" font-weight="700">${textGenesis}</text>

  <text x="400" y="420" text-anchor="middle" dominant-baseline="middle" font-family="'Playfair Display', serif" font-size="80" fill="${styles.text}" font-weight="900" filter="url(#glow)">${cleanName}</text>

  <text x="400" y="700" text-anchor="middle" font-family="'Playfair Display', serif" font-size="32" fill="${styles.text}" font-weight="700">${textYear}</text>
</svg>
  `.trim();
}
