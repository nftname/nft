import { NextResponse } from "next/server";
import sharp from "sharp";

// ✅ Force Node.js runtime (not Edge) to support Buffer and file operations
export const runtime = "nodejs";

// ✅ الوصف القانوني المعتمد
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

    // 1. توليد الصورة (باستخدام دالة التصميم الموجودة في الأسفل)
    const svgContent = generateSVG(name, tier);

    // 2. تحويل SVG إلى PNG (800x800) باستخدام sharp
    const svgBuffer = Buffer.from(svgContent);
    const pngBuffer = await sharp(svgBuffer).resize(800, 800).png().toBuffer();

    // ✅ Verify image buffer size before upload (required for Node.js runtime)
    console.log(`[NFT Image] SVG Buffer created: ${svgBuffer.length} bytes`);
    console.log(`[NFT Image] PNG Buffer created: ${pngBuffer.length} bytes`);
    console.log(`[NFT Image] Runtime: Node.js`);

    const blob = new Blob([new Uint8Array(pngBuffer)], { type: "image/png" });

    const formData = new FormData();
    formData.append("file", blob, `${name.replace(/\s+/g, "_")}.png`);

    // إعدادات بيناتا لتنظيم الملفات
    const pinataMetadata = JSON.stringify({ name: `${name}.png` });
    formData.append("pinataMetadata", pinataMetadata);

    const pinataOptions = JSON.stringify({ cidVersion: 1 });
    formData.append("pinataOptions", pinataOptions);

    // 3. رفع الصورة
    console.log("[NFT Upload] Uploading PNG Image to Pinata via Node.js runtime...");
    console.log(`[NFT Upload] Image size: ${pngBuffer.length} bytes`);

    const imageUploadRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: formData,
    });

    if (!imageUploadRes.ok) {
      const errorText = await imageUploadRes.text();
      console.error("Pinata Image Error:", errorText);
      throw new Error("Image Upload Failed");
    }

    const imageResult = await imageUploadRes.json();
    const imageIpfsHash = imageResult.IpfsHash;
    const imageUri = `ipfs://${imageIpfsHash}`;
    const imageGatewayUrl = `https://ipfs.io/ipfs/${imageIpfsHash}`;

    console.log("[NFT Upload] ✅ Image Uploaded Successfully");
    console.log(`[NFT Upload] IPFS Hash: ${imageIpfsHash}`);
    console.log(`[NFT Upload] Image IPFS URI: ${imageUri}`);
    console.log(`[NFT Upload] Image Gateway URL: ${imageGatewayUrl}`);
    console.log(`[NFT Upload] 🌐 Direct Link: ${imageGatewayUrl}`);

    // 4. رفع الميتا داتا (JSON)
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

    if (!jsonUploadRes.ok) {
      throw new Error("JSON Upload Failed");
    }

    const jsonResult = await jsonUploadRes.json();
    const tokenUri = `ipfs://${jsonResult.IpfsHash}`;

    console.log("[NFT Metadata] ✅ Metadata Uploaded Successfully");
    console.log(`[NFT Metadata] CID: ${jsonResult.IpfsHash}`);
    console.log(`[NFT Complete] ✅ NFT Ready for OpenSea & MetaMask`);
    console.log(`[NFT Complete] Token URI: ${tokenUri}`);

    return NextResponse.json({
      success: true,
      tokenURI: tokenUri,
      imageIpfs: imageUri,
      imageGateway: imageGatewayUrl,
    });
  } catch (error: any) {
    console.error("Mint API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to upload assets",
      },
      { status: 500 },
    );
  }
}

// ==========================================
// 🎨 دالة الرسم (التصميم الذي تريده)
// ==========================================

// دالة لحماية النصوص من أخطاء XML
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

  let styles = { bg1: "#001f24", bg2: "#003840", border: "#008080", text: "#FCD535" };

  const t = tier?.toLowerCase() || "founder";
  if (t === "immortal") styles = { bg1: "#0a0a0a", bg2: "#1c1c1c", border: universalBorder, text: "#FCD535" };
  else if (t === "elite") styles = { bg1: "#2b0505", bg2: "#4a0a0a", border: "#ff3232", text: "#FCD535" };

  // نظف الاسم وتأكد من XML escaping
  const cleanName = escapeXml(name.replace(/[^a-zA-Z0-9 ]/g, "").toUpperCase());

  // أي نص ثابت نطبقه عليه escapeXml
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
    <pattern id="subtlePattern" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="1" fill="${styles.border}" fill-opacity="0.05" />
    </pattern>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  
  <rect width="100%" height="100%" fill="#050505" />
  <rect x="50" y="50" width="700" height="700" rx="40" ry="40" fill="url(#bgGradient)" stroke="${styles.border}" stroke-width="6" />
  <rect x="50" y="50" width="700" height="700" rx="40" ry="40" fill="url(#subtlePattern)" />
  <rect x="70" y="70" width="660" height="660" rx="30" ry="30" fill="none" stroke="${styles.border}" stroke-width="1" stroke-opacity="0.4" />

  <text x="400" y="200" text-anchor="middle" font-family="serif" font-size="32" fill="${styles.text}" letter-spacing="8" font-weight="bold">${textGenesis}</text>
  
  <line x1="200" y1="240" x2="600" y2="240" stroke="${styles.border}" stroke-width="1" opacity="0.5" />
  
  <text x="400" y="420" text-anchor="middle" dominant-baseline="middle" font-family="serif" font-size="80" fill="${styles.text}" font-weight="900" letter-spacing="4" filter="url(#glow)">${cleanName}</text>
  
  <line x1="200" y1="560" x2="600" y2="560" stroke="${styles.border}" stroke-width="1" opacity="0.5" />
  
  <text x="400" y="620" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#ffffff" letter-spacing="6" opacity="0.7">${textOwned}</text>
  <text x="400" y="670" text-anchor="middle" font-family="serif" font-size="28" fill="${styles.border}" letter-spacing="4" font-weight="bold">${textYear}</text>
</svg>
  `.trim();
}
