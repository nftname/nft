import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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

    const imagePath = path.join(process.cwd(), "public", "cards", `${name.replace(/\s+/g, "_")}.png`);

    if (!fs.existsSync(imagePath)) {
      return NextResponse.json({ error: "Image file not found" }, { status: 404 });
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const blob = new Blob([new Uint8Array(imageBuffer)], {
      type: "image/png",
    });

    const formData = new FormData();
    formData.append("file", blob, `${name.replace(/\s+/g, "_")}.png`);
    formData.append("pinataMetadata", JSON.stringify({ name: `${name}.png` }));
    formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

    const imageUploadRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: formData,
    });

    if (!imageUploadRes.ok) {
      throw new Error("Image Upload Failed");
    }

    const imageResult = await imageUploadRes.json();
    const imageIpfsHash = imageResult.IpfsHash;
    const imageUri = `ipfs://${imageIpfsHash}`;
    const imageGatewayUrl = `https://ipfs.io/ipfs/${imageIpfsHash}`;

    const formattedTier = tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : "Founder";

    const metadata = {
      name: name.toUpperCase(),
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

    return NextResponse.json({
      success: true,
      tokenURI: tokenUri,
      imageIpfs: imageUri,
      imageGateway: imageGatewayUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to upload assets",
      },
      { status: 500 },
    );
  }
}
