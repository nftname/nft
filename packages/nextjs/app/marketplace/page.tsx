"use client";

import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

interface NFTItem {
  tokenId: bigint;
  owner: string;
  tokenURI: string;
  metadata?: NFTMetadata;
}

export default function MarketplacePage() {
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Read total supply
  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "NNMMarket",
    functionName: "totalSupply",
  });

  // Read mint price
  const { data: mintPrice } = useScaffoldReadContract({
    contractName: "NNMMarket",
    functionName: "mintPrice",
  });

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!totalSupply) return;

      setIsLoading(true);
      setError("");

      try {
        const nftPromises = [];
        const total = Number(totalSupply);

        // Fetch up to 50 NFTs for display
        const maxDisplay = Math.min(total, 50);

        for (let i = 0; i < maxDisplay; i++) {
          nftPromises.push(fetchNFTData(BigInt(i)));
        }

        const fetchedNFTs = await Promise.all(nftPromises);
        setNfts(fetchedNFTs.filter(nft => nft !== null) as NFTItem[]);
      } catch (err: any) {
        console.error("Error fetching NFTs:", err);
        setError("Failed to load NFTs from the marketplace");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNFTs();
  }, [totalSupply]);

  const fetchNFTData = async (tokenId: bigint): Promise<NFTItem | null> => {
    try {
      // This is a simplified version - in production, you'd use proper contract reads
      // For now, we'll return mock data
      return {
        tokenId,
        owner: "0x...",
        tokenURI: `https://example.com/token/${tokenId}`,
        metadata: {
          name: `NFT #${tokenId}`,
          description: "NNM Market NFT",
          image: `https://via.placeholder.com/300?text=NFT+${tokenId}`,
        },
      };
    } catch (error) {
      console.error(`Error fetching NFT ${tokenId}:`, error);
      return null;
    }
  };

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 w-full max-w-7xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold mb-2">NFT Marketplace</span>
          <span className="block text-2xl">NNM Market</span>
        </h1>

        <div className="stats shadow w-full mb-8">
          <div className="stat">
            <div className="stat-title">Total NFTs Minted</div>
            <div className="stat-value">{totalSupply ? totalSupply.toString() : "0"}</div>
            <div className="stat-desc">On Polygon Mainnet</div>
          </div>

          <div className="stat">
            <div className="stat-title">Current Mint Price</div>
            <div className="stat-value text-primary">
              {mintPrice ? `${formatEther(mintPrice)} POL` : "Loading..."}
            </div>
            <div className="stat-desc">Per NFT</div>
          </div>

          <div className="stat">
            <div className="stat-title">Network</div>
            <div className="stat-value text-secondary">Polygon</div>
            <div className="stat-desc">Mainnet</div>
          </div>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : nfts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl mb-4">No NFTs minted yet</p>
            <p className="opacity-70 mb-6">Be the first to mint an NFT on NNM Market!</p>
            <a href="/mint" className="btn btn-primary">
              Mint Your NFT
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {nfts.map(nft => (
              <div key={nft.tokenId.toString()} className="card bg-base-100 shadow-xl">
                <figure className="px-4 pt-4">
                  <div className="w-full aspect-square bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                    {nft.metadata?.image ? (
                      <img
                        src={nft.metadata.image}
                        alt={nft.metadata.name}
                        className="rounded-xl w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">#{nft.tokenId.toString()}</span>
                    )}
                  </div>
                </figure>
                <div className="card-body">
                  <h2 className="card-title">
                    {nft.metadata?.name || `NFT #${nft.tokenId}`}
                    <div className="badge badge-secondary">#{nft.tokenId.toString()}</div>
                  </h2>
                  <p className="text-sm opacity-70">{nft.metadata?.description || "NNM Market NFT"}</p>
                  {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold mb-1">Attributes:</p>
                      <div className="flex flex-wrap gap-1">
                        {nft.metadata.attributes.slice(0, 3).map((attr, idx) => (
                          <div key={idx} className="badge badge-outline badge-sm">
                            {attr.trait_type}: {attr.value}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="card-actions justify-end mt-4">
                    <button className="btn btn-primary btn-sm">View Details</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
