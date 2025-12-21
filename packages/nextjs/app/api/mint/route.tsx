import { NextResponse } from "next/server";
import { ImageResponse } from "@vercel/og";
import { readFile } from "fs/promises";
import { join } from "path";
import { PinataSDK } from "pinata";

export const runtime = "nodejs";

export async function GET(req: Request) {
  return POST(req);
}

export async function POST(req: Request) {
  try {
    const pinata = new PinataSDK({
      pinataJwt: process.env.PINATA_JWT,
      pinataGateway: "beige-kind-cricket-922.mypinata.cloud",
    });

    const { name, tier, mode } = await req.json();

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const fontPath = join(process.cwd(), "public", "fonts", "Cinzel-Bold.ttf");
    const fontData = await readFile(fontPath);

    const t = tier?.toLowerCase() || "founder";
    let bgGradient = "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)";
    let borderColor = "#FCD535";
    let textColor = "#FCD535";

    if (t === "immortal") {
      bgGradient = "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)";
      borderColor = "#E5E4E2";
      textColor = "#E5E4E2";
    } else if (t === "elite") {
      bgGradient = "linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)";
      borderColor = "#FCA5A5";
      textColor = "#FCA5A5";
    }

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
          fontFamily: fontData ? '"Cinzel"' : "sans-serif",
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
      fonts: [
        {
          name: "Cinzel",
          data: fontData,
          style: "normal" as const,
          weight: 700 as const,
        },
      ],
    };

    if (mode === "preview") {
      return new ImageResponse(element, imageOptions);
    }

    const imageResponse = new ImageResponse(element, imageOptions);
    const imageArrayBuffer = await imageResponse.arrayBuffer();

    const safeFileName = name.replace(/[^a-zA-Z0-9]/g, "_");
    const file = new File([imageArrayBuffer], `${safeFileName}.png`, { type: "image/png" });

    const uploadImage = await pinata.upload.public.file(file);
    const imageUri = `ipfs://${uploadImage.cid}`;

    const formattedTier = tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : "Founder";

    const metadata = {
      name: name,
      description:
        "GEN-0 Genesis | A singular, unreplicable digital artifact — timeless, unparalleled, and supremely rare. Ownership verified and sealed through NNM.",
      image: imageUri,
      attributes: [
        { trait_type: "Generation", value: "GEN-0 Genesis" },
        { trait_type: "Tier", value: formattedTier },
        { trait_type: "Year", value: "2025" },
        { trait_type: "Platform", value: "NNM Market" },
      ],
    };

    const uploadJson = await pinata.upload.public.json(metadata);
    const tokenUri = `ipfs://${uploadJson.cid}`;

    return NextResponse.json({
      success: true,
      tokenURI: tokenUri,
      imageIpfs: imageUri,
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed" }, { status: 500 });
  }
}
