import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const pinataJWT = process.env.PINATA_JWT;
    const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL;

    if (!pinataJWT) {
      return NextResponse.json({ error: "Pinata JWT not configured" }, { status: 500 });
    }

    // Create SVG image with the name
    const svgImage = `
      <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
        <rect width="500" height="500" fill="#6366f1"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle" dominant-baseline="middle">
          ${name}
        </text>
        <text x="50%" y="70%" font-family="Arial, sans-serif" font-size="18" fill="#e0e7ff" text-anchor="middle" dominant-baseline="middle">
          NNM Market NFT
        </text>
      </svg>
    `;

    // Upload image to Pinata
    const imageFormData = new FormData();
    const imageBlob = new Blob([svgImage], { type: "image/svg+xml" });
    imageFormData.append("file", imageBlob, `${name}.svg`);

    const pinataMetadata = JSON.stringify({
      name: `${name}.svg`,
    });
    imageFormData.append("pinataMetadata", pinataMetadata);

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
    const imageUrl = `https://${gatewayUrl}/ipfs/${imageIpfsHash}`;

    // Create metadata JSON
    const metadata = {
      name: name,
      description: `${name} - NNM Market NFT`,
      image: imageUrl,
      attributes: [
        {
          trait_type: "Name",
          value: name,
        },
        {
          trait_type: "Marketplace",
          value: "NNM Market",
        },
        {
          trait_type: "Minted Date",
          value: new Date().toISOString(),
        },
      ],
    };

    // Upload metadata to Pinata
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
    const tokenURI = `https://${gatewayUrl}/ipfs/${metadataIpfsHash}`;

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
