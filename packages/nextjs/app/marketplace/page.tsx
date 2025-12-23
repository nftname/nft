"use client";

import { formatEther, parseEther } from "viem";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export default function MarketplacePage() {
  // Read total supply
  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "NNMRegistryV99",
    functionName: "totalSupply",
  });

  // Read mint price (FOUNDER tier = $10 USD)
  const { data: mintPrice } = useScaffoldReadContract({
    contractName: "NNMRegistryV99",
    functionName: "getMaticCost",
    args: [parseEther("10")],
  });

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
            <div className="stat-value text-primary">{mintPrice ? `${formatEther(mintPrice)} POL` : "Loading..."}</div>
            <div className="stat-desc">Per NFT</div>
          </div>

          <div className="stat">
            <div className="stat-title">Network</div>
            <div className="stat-value text-secondary">Polygon</div>
            <div className="stat-desc">Mainnet</div>
          </div>
        </div>

        {!totalSupply || totalSupply === 0n ? (
          <div className="text-center py-20">
            <p className="text-2xl mb-4">No NFTs minted yet</p>
            <p className="opacity-70 mb-6">Be the first to mint an NFT on NNM Market!</p>
            <a href="/mint" className="btn btn-primary btn-lg">
              Mint Your NFT
            </a>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-2xl mb-4">Marketplace Under Construction</p>
            <p className="opacity-70 mb-6">NFT gallery coming soon</p>
            <p className="text-sm opacity-50">{totalSupply.toString()} NFT(s) minted so far</p>
          </div>
        )}
      </div>
    </div>
  );
}
