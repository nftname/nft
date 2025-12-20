import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { name, tier } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const pinataJWT = process.env.PINATA_JWT;
    const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || "https://gateway.pinata.cloud";

    if (!pinataJWT) {
      return NextResponse.json({ error: "Pinata JWT not configured" }, { status: 500 });
    }

    // ==========================================
    // 1. تحديد الألوان حسب الفئة (لمسة جمالية فقط)
    // ==========================================
    const t = tier?.toLowerCase() || "founder";
    let bgStart = "#001f24"; // Founder Green/Cyan
    let bgEnd = "#003840";
    let border = "#008080";
    const textMain = "#FCD535"; // Gold Text

    if (t === "immortal") {
      bgStart = "#0a0a0a"; // Black
      bgEnd = "#1c1c1c";
      border = "#FCD535"; // Gold Border
    } else if (t === "elite") {
      bgStart = "#2b0505"; // Red
      bgEnd = "#4a0a0a";
      border = "#ff3232"; // Bright Red
    }

    // ==========================================
    // 2. إنشاء الصورة (SVG Image) داخل المتغير مباشرة
    // (هنا وضعنا تصميمك داخل هيكل الكود الأصلي)
    // ==========================================
    const svgImage = `
      <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${bgStart}" />
            <stop offset="100%" stop-color="${bgEnd}" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        
        <rect width="800" height="800" fill="#000000" />
        <rect x="20" y="20" width="760" height="760" rx="40" fill="url(#bg)" stroke="${border}" stroke-width="4" />
        <rect x="50" y="50" width="700" height="700" rx="20" fill="none" stroke="${border}" stroke-width="1" stroke-opacity="0.5" />

        <text x="400" y="150" text-anchor="middle" font-family="serif" font-weight="bold" font-size="28" fill="${border}" letter-spacing="4">GEN-0 GENESIS</text>
        <line x1="200" y1="200" x2="600" y2="200" stroke="${border}" stroke-width="1" stroke-opacity="0.5" />
        
        <text x="400" y="400" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-weight="900" font-size="60" fill="${textMain}" filter="url(#glow)">${name.toUpperCase()}</text>
        
        <line x1="200" y1="600" x2="600" y2="600" stroke="${border}" stroke-width="1" stroke-opacity="0.5" />
        <text x="400" y="660" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#ffffff" letter-spacing="3" opacity="0.8">OWNED & MINTED</text>
        <text x="400" y="700" text-anchor="middle" font-family="serif" font-weight="bold" font-size="24" fill="${border}">2025</text>
      </svg>
    `.trim();

    // ==========================================
    // 3. عملية الرفع (بنفس طريقة السكريبت الجاهز)
    // ==========================================
    const imageFormData = new FormData();

    // ✅ تصحيح صغير: استخدام Buffer كما طلب المساعد الذكي لضمان ظهور الصورة
    const buffer = Buffer.from(svgImage);
    const imageBlob = new Blob([buffer], { type: "image/svg+xml" });

    imageFormData.append("file", imageBlob, `${name}.svg`);

    // إضافة الميتا داتا الخاصة بـ Pinata
    const pinataMetadata = JSON.stringify({
      name: `${name}.svg`,
    });
    imageFormData.append("pinataMetadata", pinataMetadata);

    const pinataOptions = JSON.stringify({
      cidVersion: 1,
    });
    imageFormData.append("pinataOptions", pinataOptions);

    // الاتصال بـ Pinata لرفع الصورة
    const imageUploadResponse = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pinataJWT}`,
      },
      body: imageFormData,
    });

    if (!imageUploadResponse.ok) {
      const errorData = await imageUploadResponse.text();
      console.error("Pinata image upload error:", errorData);
      return NextResponse.json({ error: "Failed to upload image to IPFS" }, { status: 500 });
    }

    const imageData = await imageUploadResponse.json();
    const imageIpfsHash = imageData.IpfsHash;
    const imageUrl = `${gatewayUrl}/ipfs/${imageIpfsHash}`;

    // ==========================================
    // 4. تجهيز الميتا داتا (بنفس طريقة السكريبت الجاهز)
    // ==========================================
    const formattedTier = tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : "Founder";

    // الوصف الطويل المعتمد
    const description = `GEN-0 Genesis — NNM Protocol Record

A singular, unreplicable digital artifact.

This digital name is recorded on-chain with a verifiable creation timestamp and immutable registration data under the NNM protocol, serving as a canonical reference layer for historical name precedence within this system.

It represents a Gen-0 registered digital asset and exists solely as a transferable NFT, without renewal, guarantees, utility promises, or dependency.

Ownership is absolute, cryptographically secured, and fully transferable.

No subscriptions. No recurring fees. No centralized control.

This record establishes the earliest verifiable origin of the name as recognized by the NNM protocol — a permanent, time-anchored digital inscription preserved on the blockchain.`;

    const metadata = {
      name: name,
      description: description,
      image: imageUrl,
      external_url: "https://nftnamemarket.com",
      attributes: [
        { trait_type: "Generation", value: "GEN-0 Genesis" },
        { trait_type: "Tier", value: formattedTier },
        { trait_type: "Registration Year", value: "2025" },
        { trait_type: "Platform", value: "NNM Market" },
      ],
    };

    // رفع الميتا داتا
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
      const errorData = await metadataUploadResponse.text();
      console.error("Pinata metadata upload error:", errorData);
      return NextResponse.json({ error: "Failed to upload metadata to IPFS" }, { status: 500 });
    }

    const metadataData = await metadataUploadResponse.json();
    const metadataIpfsHash = metadataData.IpfsHash;
    const tokenURI = `ipfs://${metadataIpfsHash}`;

    return NextResponse.json({
      success: true,
      tokenURI,
      imageUrl,
      metadata,
    });
  } catch (error) {
    console.error("Error in mint API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
