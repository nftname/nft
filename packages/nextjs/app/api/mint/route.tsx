import { NextResponse } from "next/server";
import { ImageResponse } from "@vercel/og";

// ✅ استخدام Edge Runtime (الأسرع والأمثل للصور)
export const runtime = "edge";

const GLOBAL_DESCRIPTION = `GEN-0 Genesis — NNM Protocol Record
A singular, unreplicable digital artifact.
Ownership is absolute, cryptographically secured, and fully transferable.
This record establishes the earliest verifiable origin of the name as recognized by the NNM protocol.`;

export async function POST(req: Request) {
  try {
    const { name, tier, mode } = await req.json(); // mode: 'preview' or 'mint'

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    // =========================================================================
    // 1. 🔤 تحميل الخط المحلي (Cinzel) من مجلدات المشروع
    // لا نحتاج للإنترنت، الملف موجود بجانب الكود
    // =========================================================================
    const fontData = await fetch(new URL("../../../public/fonts/Cinzel-Bold.ttf", import.meta.url)).then(res =>
      res.arrayBuffer(),
    );

    // 2. 🎨 تحديد الألوان (نظام الفخامة)
    const t = tier?.toLowerCase() || "founder";
    let bgGradient = "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"; // كحلي ملكي
    let borderColor = "#FCD535"; // ذهبي
    let textColor = "#FCD535"; // ذهبي

    if (t === "immortal") {
      bgGradient = "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)"; // أسود فاحم
      borderColor = "#E5E4E2"; // بلاتينيوم
      textColor = "#E5E4E2";
    } else if (t === "elite") {
      bgGradient = "linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)"; // أحمر ملكي
      borderColor = "#FCA5A5"; // ذهبي وردي
      textColor = "#FCA5A5";
    }

    // 3. 📸 تصميم الكرت (JSX) - مجهز للتصوير
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
          fontFamily: '"Cinzel"', // الخط الفخم
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
          {/* الإطار الخارجي */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "720px",
              height: "720px",
              border: `8px solid ${borderColor}`,
              boxShadow: `0 0 50px ${borderColor}40`, // ظل خفيف بلون الإطار
              position: "relative",
            }}
          >
            {/* زخرفة الزوايا */}
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

            {/* العنوان العلوي */}
            <div style={{ color: borderColor, fontSize: 36, letterSpacing: "0.1em", fontWeight: 700, marginTop: 40 }}>
              GEN-0 GENESIS
            </div>

            <div style={{ width: "200px", height: "2px", background: borderColor, margin: "30px 0", opacity: 0.6 }} />

            {/* الاسم (البطل) */}
            <div
              style={{
                color: textColor,
                fontSize: 85, // خط كبير وواضح
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

            {/* النصوص السفلية */}
            <div style={{ color: "#ffffff", fontSize: 24, letterSpacing: "0.2em", opacity: 0.8 }}>OWNED & MINTED</div>
            <div style={{ color: borderColor, fontSize: 40, fontWeight: 700, marginTop: 15 }}>2025</div>

            {/* الشعار السفلي الصغير */}
            <div style={{ position: "absolute", bottom: 30, fontSize: 16, color: borderColor, opacity: 0.5 }}>
              NNM PROTOCOL
            </div>
          </div>
        </div>
      </div>
    );

    // إعدادات الصورة
    const imageOptions = {
      width: 800,
      height: 800,
      fonts: [{ name: "Cinzel", data: fontData, style: "normal" as const, weight: 700 as const }],
    };

    // =========================================================================
    // 🚦 وضع المعاينة (Preview Mode)
    // إذا كان الطلب للمعاينة، نعيد الصورة فوراً للمتصفح ولا نرفعها
    // =========================================================================
    if (mode === "preview") {
      return new ImageResponse(element, imageOptions);
    }

    // =========================================================================
    // 🚀 وضع الصك (Mint Mode)
    // إذا كان الطلب للصك، نكمل عملية الرفع لـ Pinata
    // =========================================================================

    // 1. توليد الصورة كملف
    const imageResponse = new ImageResponse(element, imageOptions);
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const blob = new Blob([imageArrayBuffer], { type: "image/png" });
    const safeFileName = name.replace(/[^a-zA-Z0-9]/g, "_");

    // 2. الرفع إلى Pinata
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

    // 3. رفع الميتا داتا
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
