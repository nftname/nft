"use client";

import { useState } from "react";
import { formatEther, parseEther } from "viem";
import { polygon } from "viem/chains";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export default function MintPage() {
  const [name, setName] = useState("");
  const [selectedTier, setSelectedTier] = useState<number>(2);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [tokenURI, setTokenURI] = useState("");
  const [nameAvailability, setNameAvailability] = useState<"checking" | "available" | "taken" | null>(null);

  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useScaffoldWriteContract("NNMMarket");

  const isOnPolygon = chainId === polygon.id;

  const allowedWallets = ["0xf65BF669EE7775C9788ed367742e1527D0118B58"];

  const isAllowed =
    connectedAddress && allowedWallets.some(wallet => wallet.toLowerCase() === connectedAddress.toLowerCase());

  const tiers = [
    { index: 0, price: "50", name: "IMMORTAL" },
    { index: 1, price: "30", name: "ELITE" },
    { index: 2, price: "10", name: "FOUNDER" },
  ];

  const { data: mintCost } = useScaffoldReadContract({
    contractName: "NNMMarket",
    functionName: "getMaticCost",
    args: [parseEther(tiers.find(t => t.index === selectedTier)?.price || "10")],
  });

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatus("");
    setIsLoading(true);
    setNameAvailability(null);

    try {
      if (!connectedAddress) {
        throw new Error("Please connect your wallet first");
      }

      if (!isOnPolygon) {
        setStatus("Switching to Polygon network...");
        try {
          await switchChain({ chainId: polygon.id });
        } catch {
          throw new Error("Please switch to Polygon network to mint");
        }
      }

      if (!name.trim()) {
        throw new Error("Please enter a name for your NFT");
      }

      setStatus("Uploading to IPFS...");
      const response = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload to IPFS");
      }

      const { tokenURI: uploadedTokenURI } = await response.json();
      setTokenURI(uploadedTokenURI);
      setStatus("IPFS upload successful! Preparing transaction...");

      setStatus("Please confirm the transaction in your wallet...");

      try {
        if (isAllowed) {
          await writeContractAsync({
            functionName: "reserveName",
            args: [name.trim(), 0, uploadedTokenURI],
          });
          setStatus(`Success! Reserved "${name}" successfully.`);
        } else {
          await writeContractAsync({
            functionName: "mintPublic",
            args: [name.trim(), selectedTier, uploadedTokenURI],
            value: mintCost,
          });
          setStatus(`Success! Your NFT has been minted. 🎉`);
        }

        setName("");
        setNameAvailability("available");
      } catch (mintError: any) {
        if (mintError.message && mintError.message.includes("Name already registered")) {
          setNameAvailability("taken");
          throw new Error("Name already taken");
        }
        throw mintError;
      }
    } catch (err: any) {
      console.error("Minting error:", err);
      setError(err.message || "An error occurred during minting");
      setStatus("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 w-full max-w-2xl">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold mb-2">Mint Your NFT</span>
          <span className="block text-2xl">NNM Market</span>
        </h1>

        <div className="bg-base-100 rounded-3xl shadow-xl border-2 border-primary p-8">
          {!connectedAddress ? (
            <div className="text-center">
              <p className="text-lg mb-4">Please connect your wallet to mint NFTs</p>
            </div>
          ) : (
            <form onSubmit={handleMint} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  NFT Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    setNameAvailability(null);
                  }}
                  placeholder="Enter your NFT name"
                  className="input input-bordered w-full"
                  disabled={isLoading}
                  maxLength={50}
                />

                {name.trim().length >= 2 && nameAvailability === "available" && (
                  <div className="text-success text-sm mt-1 font-bold">✓ Available</div>
                )}
                {name.trim().length >= 2 && nameAvailability === "taken" && (
                  <div className="text-error text-sm mt-1 font-bold">✕ Taken</div>
                )}
              </div>

              {!isAllowed && (
                <div>
                  <label className="block text-sm font-medium mb-3">Choose Tier</label>
                  <div className="grid grid-cols-3 gap-3">
                    {tiers.map(tier => (
                      <button
                        key={tier.index}
                        type="button"
                        onClick={() => setSelectedTier(tier.index)}
                        disabled={isLoading}
                        className={`btn ${
                          selectedTier === tier.index ? "btn-primary" : "btn-outline"
                        } flex flex-col h-auto py-4`}
                      >
                        <span className="text-xs opacity-70">{tier.name}</span>
                        <span className="text-2xl font-bold">${tier.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {status && <div className="alert alert-info text-sm py-2">{status}</div>}
              {error && <div className="alert alert-error text-sm py-2">{error}</div>}

              <button type="submit" className="btn btn-primary w-full btn-lg" disabled={isLoading || !name.trim()}>
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Processing...
                  </>
                ) : isAllowed ? (
                  "Mint Now"
                ) : (
                  `Mint NFT - $${tiers.find(t => t.index === selectedTier)?.price}`
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
