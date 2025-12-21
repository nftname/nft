import { NextResponse } from "next/server";
import { ImageResponse } from "@vercel/og";

// مهم: نستخدم Edge Runtime ليعمل Satori بسرعة
export const runtime = "edge";

const GLOBAL_DESCRIPTION = `GEN-0 Genesis — NNM Protocol Record

A singular, unreplicable digital artifact.

This digital name is recorded on-chain with a verifiable creation timestamp and immutable registration data under the NNM protocol.

It represents a Gen-0 registered digital asset and exists solely as a transferable NFT.

Ownership is absolute, cryptographically secured, and fully transferable.

This record establishes the earliest verifiable origin of the name as recognized by the NNM protocol.`;

export async function POST(req: Request) {
  try {
    const { name, tier } = await req.json();

    if (!process.env.PINATA_JWT) {
      return NextResponse.json({ error: "Server Config Error: Missing PINATA_JWT" }, { status: 500 });
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // 1. 🔤 تحميل الخط (تصحيح الخطأ هنا)
    // نستخدم رابط raw.githubusercontent.com المباشر لنسخة Static مضمونة
    const fontData = await fetch(
      new URL('https://raw.githubusercontent.com/google/fonts/main/apache/roboto/static/Roboto-Bold.ttf', import.meta.url)
    ).then((res) => res.arrayBuffer());

    // 2. 🎨 تحديد الألوان
    const t = tier?.toLowerCase() || "founder";
    // تم تحسين التدرجات اللونية لتكون أكثر وضوحاً
    let bgGradient = "linear-gradient(135deg, #001f24 0%, #003840 100%)";
    let borderColor = "#008080";
    let textColor = "#FCD535";

    if (t === "immortal") {
      bgGradient = "linear-gradient(135deg, #0a0a0a 0%, #1c1c1c 100%)";
      borderColor = "#FCD535"; // Gold
    } else if (t === "elite") {
      bgGradient = "linear-gradient(135deg, #2b0505 0%, #4a0a0a 100%)";
      borderColor = "#ff3232"; // Red
    }

    // 3. 📸 التقاط الصورة (بناء التصميم)
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            height: "100%",
            width: "100%",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "black", // خلفية سوداء للأمان
            fontFamily: '"Roboto"',
          }}
        >
          {/* طبقة الخلفية المتدرجة */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              background: bgGradient,
            }}
          >
            {/* الكرت الأساسي */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "700px",
                height: "700px",
                borderRadius: "40px",
                border: `6px solid ${borderColor}`,
                background: "rgba(0,0,0,0.2)", // تغميق بسيط
                position: "relative",
              }}
            >
               {/* الإطار الداخلي الزخرفي */}
               <div
                style={{
                  position: "absolute",
                  top: "20px",
                  left: "20px",
                  right: "20px",
                  bottom: "20px",
                  border: `2px solid ${borderColor}`,
                  opacity: 0.3,
                  borderRadius: "30px",
                }}
              />

              {/* النصوص */}
              <div style={{ color: borderColor, fontSize: 32, letterSpacing: '4px', fontWeight: 700, marginTop: 20 }}>
                GEN-0 GENESIS
              </div>

              <div
                style={{
                  width: "60%",
                  height: "2px",
                  background: borderColor,
                  opacity: 0.5,
                  margin: "40px 0",
                }}
              />

              <div
                style={{
                  color: textColor,
                  fontSize: 70, // تصغير بسيط لضمان عدم قص الأسماء الطويلة
                  fontWeight: 700,
                  textAlign: "center",
                  textTransform: "uppercase",
                  padding: "0 20px",
                  lineHeight: 1.1,
                }}
              >
                {name}
              </div>

              <div
                style={{
                  width: "60%",
                  height: "2px",
                  background: borderColor,
                  opacity: 0.5,
                  margin: "40px 0",
                }}
              />

              <div style={{ color: "white", fontSize: 24, letterSpacing: '4px', opacity: 0.9 }}>
                OWNED & MINTED
              </div>
              <div style={{ color: borderColor, fontSize: 32, fontWeight: 700, marginTop: 15 }}>
                2025
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 800,
        height: 800,
        fonts: [
          {
            name: 'Roboto',
            data: fontData,
            style: 'normal',
            weight: 700,
          },
        ],
      }
    );

    // 4. تحويل الصورة إلى ملف (Blob)
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const blob = new Blob([imageArrayBuffer], { type: "image/png" });

    // 5. الرفع إلى Pinata
    const formData = new FormData();
    // تنظيف الاسم من المسافات للملف
    const safeFileName = name.replace(/[^a-zA-Z0-9]/g, "_");
    formData.append("file", blob, `${safeFileName}.png`);
    
    formData.append("pinataMetadata", JSON.stringify({ name: `${safeFileName}.png` }));
    formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

    const imageUploadRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
      body: formData,
    });

    if (!imageUploadRes.ok) {
      const errorText = await imageUploadRes.text();
      console.error("Pinata Upload Error:", errorText);
      throw new Error("Failed to upload image to Pinata");
    }

    const imageResult = await imageUploadRes.json();
    const imageUri = `ipfs://${imageResult.IpfsHash}`;
    
    // 6. رفع الميتا داتا
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
        pinataMetadata: { name: `${safeFileName}-metadata.json` },
      }),
    });

    if (!jsonUploadRes.ok) throw new Error("JSON Upload Failed");

    const jsonResult = await jsonUploadRes.json();

    return NextResponse.json({
      success: true,
      tokenURI: `ipfs://${jsonResult.IpfsHash}`,
      imageIpfs: imageUri,
    });

  } catch (error: any) {
    console.error("Mint API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
