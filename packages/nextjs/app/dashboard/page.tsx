"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

interface UserNFT {
  tokenId: bigint;
  tokenURI: string;
  metadata?: NFTMetadata;
}

export default function DashboardPage() {
  const { address: connectedAddress } = useAccount();
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Read user's NFT balance
  const { data: balance } = useScaffoldReadContract({
    contractName: "NNMMarket",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  useEffect(() => {
    const fetchUserNFTs = async () => {
      if (!connectedAddress || !balance || balance === 0n) {
        setUserNFTs([]);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const nftPromises = [];
        const total = Number(balance);

        // Note: In a real implementation, you would use tokenOfOwnerByIndex
        // For now, this is a placeholder structure
        for (let i = 0; i < total; i++) {
          // This would call tokenOfOwnerByIndex(connectedAddress, i)
          // then tokenURI(tokenId) to get the URI
          // then fetch the metadata from IPFS
          nftPromises.push(
            Promise.resolve({
              tokenId: BigInt(i),
              tokenURI: `https://example.com/token/${i}`,
              metadata: {
                name: `My NFT #${i}`,
                description: "NNM Market NFT owned by you",
                image: `https://via.placeholder.com/300?text=My+NFT+${i}`,
              },
            }),
          );
        }

        const fetchedNFTs = await Promise.all(nftPromises);
        setUserNFTs(fetchedNFTs);
      } catch (err: any) {
        console.error("Error fetching user NFTs:", err);
        setError("Failed to load your NFTs");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserNFTs();
  }, [connectedAddress, balance]);

  if (!connectedAddress) {
    return (
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5 w-full max-w-4xl">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold mb-2">My Dashboard</span>
            <span className="block text-2xl">NNM Market</span>
          </h1>

          <div className="bg-base-100 rounded-3xl shadow-xl border-2 border-primary p-12 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-24 w-24 mx-auto mb-6 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <h2 className="text-2xl font-bold mb-4">Wallet Not Connected</h2>
            <p className="text-lg opacity-70 mb-6">Please connect your wallet to view your NFT collection</p>
            <p className="text-sm opacity-60">Make sure you&apos;re connected to Polygon Mainnet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 w-full max-w-7xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold mb-2">My Dashboard</span>
          <span className="block text-2xl">NNM Market</span>
        </h1>

        <div className="bg-base-200 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-sm opacity-70">Connected Address</p>
              <p className="font-mono text-lg font-bold break-all">{connectedAddress}</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm opacity-70">Your NFTs</p>
              <p className="text-4xl font-bold text-primary">{balance ? balance.toString() : "0"}</p>
            </div>
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
        ) : !balance || balance === 0n ? (
          <div className="text-center py-20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-32 w-32 mx-auto mb-6 opacity-30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <p className="text-2xl mb-4">No NFTs Yet</p>
            <p className="opacity-70 mb-6">You haven&apos;t minted any NFTs on NNM Market</p>
            <a href="/mint" className="btn btn-primary btn-lg">
              Mint Your First NFT
            </a>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Your Collection</h2>
              <a href="/mint" className="btn btn-primary">
                Mint Another NFT
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {userNFTs.map(nft => (
                <div
                  key={nft.tokenId.toString()}
                  className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
                >
                  <figure className="px-4 pt-4">
                    <div className="w-full aspect-square bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center overflow-hidden">
                      {nft.metadata?.image ? (
                        <img
                          src={nft.metadata.image}
                          alt={nft.metadata.name}
                          className="rounded-xl w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl text-white">#{nft.tokenId.toString()}</span>
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
                          {nft.metadata.attributes.map((attr, idx) => (
                            <div key={idx} className="badge badge-outline badge-sm">
                              {attr.trait_type}: {String(attr.value).substring(0, 20)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="card-actions justify-between mt-4">
                      <a href={nft.tokenURI} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                        View Metadata
                      </a>
                      <button className="btn btn-primary btn-sm">Transfer</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
