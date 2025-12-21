import React from "react";
import { NextResponse } from "next/server";
import { ImageResponse } from "@vercel/og"; // 📸 الكاميرا الخاصة بـ Next.js

export const runtime = "edge"; // ⚡️ مهم جداً: نستخدم Edge لجلب الخطوط والسرعة

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

    // 1. 🔤 تحميل الخط (الفرشاة)
    // نقوم بجلب خط Roboto Bold من جوجل لضمان عدم ظهور مربعات
    const fontData = await fetch(
      'https://github.com/google/fonts/raw/main/apache/roboto/Roboto-Bold.ttf'
    ).then((res) => res.arrayBuffer());

    // 2. 🎨 تحديد الألوان حسب الفئة
    const t = tier?.toLowerCase() || "founder";
    let bgGradient = "linear-gradient(to bottom right, #001f24, #003840)";
    let borderColor = "#008080";
    let textColor = "#FCD535";

    if (t === "immortal") {
      bgGradient = "linear-gradient(to bottom right, #0a0a0a, #1c1c1c)";
      borderColor = "#FCD535"; // Gold
    } else if (t === "elite") {
      bgGradient = "linear-gradient(to bottom right, #2b0505, #4a0a0a)";
      borderColor = "#ff3232"; // Red
    }

    // 3. 📸 التقاط الصورة (ImageResponse)
    // هذا الجزء يبني التصميم HTML ثم يحوله لصورة PNG
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
            background: "black",
            fontFamily: '"Roboto"', // نستخدم الخط الذي حملناه
          }}
        >
          {/* الإطار الخارجي واللون */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "700px",
              height: "700px",
              borderRadius: "40px",
              background: bgGradient,
              border: `6px solid ${borderColor}`,
              position: "relative",
            }}
          >
            {/* زخرفة خفيفة */}
            <div
              style={{
                position: "absolute",
                top: 20,
                left: 20,
                right: 20,
                bottom: 20,
                border: `1px solid ${borderColor}`,
                opacity: 0.3,
                borderRadius: "30px",
              }}
            />

            {/* النصوص - الآن هي جزء من الصورة */}
            <div style={{ color: borderColor, fontSize: 32, letterSpacing: 4, fontWeight: "bold", marginTop: 20 }}>
              GEN-0 GENESIS
            </div>

            <div
              style={{
                width: "60%",
                height: "1px",
                background: borderColor,
                opacity: 0.5,
                margin: "30px 0",
              }}
            />

            <div
              style={{
                color: textColor,
                fontSize: 80,
                fontWeight: "bold",
                textAlign: "center",
                textTransform: "uppercase",
                textShadow: "0 0 20px rgba(255,215,0,0.5)",
              }}
            >
              {name}
            </div>

            <div
              style={{
                width: "60%",
                height: "1px",
                background: borderColor,
                opacity: 0.5,
                margin: "30px 0",
              }}
            />

            <div style={{ color: "white", fontSize: 24, letterSpacing: 4, opacity: 0.8 }}>
              OWNED & MINTED
            </div>
            <div style={{ color: borderColor, fontSize: 32, fontWeight: "bold", marginTop: 10 }}>
              2025
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

    // 4. تحويل الصورة الناتجة إلى ملف (Blob) للرفع
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const blob = new Blob([imageArrayBuffer], { type: "image/png" });

    // 5. الرفع إلى Pinata
    const formData = new FormData();
    formData.append("file", blob, `${name.replace(/\s+/g, "_")}.png`);
    
    // الميتا داتا للتنظيم
    formData.append("pinataMetadata", JSON.stringify({ name: `${name}.png` }));
    formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

    const imageUploadRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
      body: formData,
    });

    if (!imageUploadRes.ok) throw new Error(await imageUploadRes.text());

    const imageResult = await imageUploadRes.json();
    const imageUri = `ipfs://${imageResult.IpfsHash}`;
    
    // 6. رفع ملف البيانات (JSON)
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
