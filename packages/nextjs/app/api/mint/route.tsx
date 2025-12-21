import { NextResponse } from "next/server";
import { ImageResponse } from "@vercel/og";
import fs from "fs";
import path from "path";

// 🛑 تغيير جذري: نستخدم Node.js لأنه الوحيد القادر على قراءة الملفات المحلية بثبات
export const runtime = "nodejs";

const GLOBAL_DESCRIPTION = `GEN-0 Genesis — NNM Protocol Record
A singular, unreplicable digital artifact.
Ownership is absolute, cryptographically secured, and fully transferable.
This record establishes the earliest verifiable origin of the name as recognized by the NNM protocol.`;

export async function POST(req: Request) {
  try {
    const { name, tier, mode } = await req.json();

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    // =========================================================================
    // 1. 🔤 تحميل الخط المحلي (نظام الملفات القوي)
    // =========================================================================
    let fontData;
    try {
      // تحديد مسار الملف بدقة داخل بيئة السيرفر
      // يبحث في: packages/nextjs/public/fonts/Cinzel-Bold.ttf
      const fontPath = path.join(process.cwd(), "public", "fonts", "Cinzel-Bold.ttf");

      // قراءة الملف
      fontData = fs.readFileSync(fontPath);
      console.log("✅ Font loaded successfully from:", fontPath);
    } catch (e) {
      console.error("⚠️ Failed to load local font, using fallback system font:", e);
      // في حالة فشل قراءة الملف، لا نكسر الصورة، بل نكمل بدونه (احتياطي)
      fontData = null;
    }

    // 2. 🎨 تحديد الألوان
    const t = tier?.toLowerCase() || "founder";
    let bgGradient = "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)";
    let borderColor = "#FCD535";
    let textColor = "#FCD535";

    if (t === "immortal") {
      bgGradient = "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)";
      borderColor = "#E5E4E2"; // Platinum
      textColor = "#E5E4E2";
    } else if (t === "elite") {
      bgGradient = "linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)";
      borderColor = "#FCA5A5"; // Rose Gold
      textColor = "#FCA5A5";
    }

    // إعدادات الخط (نستخدم Cinzel إذا وجد، وإلا sans-serif)
    const fontsConfig = fontData
      ? [{ name: "Cinzel", data: fontData, style: "normal" as const, weight: 700 as const }]
      : undefined; // سيستخدم الخط الافتراضي للنظام إذا فشل التحميل

    // 3. 📸 تصميم الكرت
    const element = (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "black",
          fontFamily: fontData ? '"Cinzel"' : "sans-serif", // الخط المختار
        }}
      >
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
          {/* الإطار */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "720px",
              height: "720px",
              border: `8px solid ${borderColor}`,
              boxShadow: `0 0 50px ${borderColor}40`,
              position: "relative",
            }}
          >
            {/* الزوايا */}
            <div
              style={{
                position: "absolute",
                top: 20,
                left: 20,
                width: 40,
                height: 40,
                borderTop: `4px solid ${borderColor}`,
                borderLeft: `4px solid ${borderColor}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                width: 40,
                height: 40,
                borderTop: `4px solid ${borderColor}`,
                borderRight: `4px solid ${borderColor}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 20,
                left: 20,
                width: 40,
                height: 40,
                borderBottom: `4px solid ${borderColor}`,
                borderLeft: `4px solid ${borderColor}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 20,
                right: 20,
                width: 40,
                height: 40,
                borderBottom: `4px solid ${borderColor}`,
                borderRight: `4px solid ${borderColor}`,
              }}
            />

            <div style={{ color: borderColor, fontSize: 36, letterSpacing: "0.1em", fontWeight: 700, marginTop: 40 }}>
              GEN-0 GENESIS
            </div>

            <div style={{ width: "200px", height: "2px", background: borderColor, margin: "30px 0", opacity: 0.6 }} />

            <div
              style={{
                color: textColor,
                fontSize: 85,
                fontWeight: 700,
                textAlign: "center",
                textTransform: "uppercase",
                padding: "0 40px",
                lineHeight: 1,
                textShadow: `0 4px 10px rgba(0,0,0,0.6)`,
              }}
            >
              {name}
            </div>

            <div style={{ width: "200px", height: "2px", background: borderColor, margin: "30px 0", opacity: 0.6 }} />

            <div style={{ color: "#ffffff", fontSize: 24, letterSpacing: "0.2em", opacity: 0.8 }}>OWNED & MINTED</div>
            <div style={{ color: borderColor, fontSize: 40, fontWeight: 700, marginTop: 15 }}>2025</div>
          </div>
        </div>
      </div>
    );

    const imageOptions = {
      width: 800,
      height: 800,
      fonts: fontsConfig,
    };

    // =========================================================================
    // 🚦 وضع المعاينة (Preview Mode)
    // =========================================================================
    if (mode === "preview") {
      return new ImageResponse(element, imageOptions);
    }

    // =========================================================================
    // 🚀 وضع الصك (Mint Mode)
    // =========================================================================
    const imageResponse = new ImageResponse(element, imageOptions);
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const blob = new Blob([imageArrayBuffer], { type: "image/png" });
    const safeFileName = name.replace(/[^a-zA-Z0-9]/g, "_");

    if (!process.env.PINATA_JWT) throw new Error("Missing PINATA_JWT");

    const formData = new FormData();
    formData.append("file", blob, `${safeFileName}.png`);
    formData.append("pinataMetadata", JSON.stringify({ name: `${safeFileName}.png` }));
    formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

    const imageUploadRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
      body: formData,
    });

    if (!imageUploadRes.ok) throw new Error("Pinata Image Upload Failed");
    const imageResult = await imageUploadRes.json();
    const imageUri = `ipfs://${imageResult.IpfsHash}`;

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

    if (!jsonUploadRes.ok) throw new Error("Pinata JSON Upload Failed");
    const jsonResult = await jsonUploadRes.json();

    return NextResponse.json({
      success: true,
      tokenURI: `ipfs://${jsonResult.IpfsHash}`,
      imageIpfs: imageUri,
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
