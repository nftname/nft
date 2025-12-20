"use client";

import { useState } from "react";
import { formatEther, parseEther } from "viem";
import { polygon } from "viem/chains";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export default function MintPage() {
  const [name, setName] = useState("");
  const [selectedTier, setSelectedTier] = useState<number>(2); // Default: FOUNDER (tier 2)
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

  // Tier configuration: [tier_index, price_usd, tier_name]
  const tiers = [
    { index: 0, price: "50", name: "IMMORTAL" },
    { index: 1, price: "30", name: "ELITE" },
    { index: 2, price: "10", name: "FOUNDER" },
  ];

  // Read mint price from contract based on selected tier
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
    setNameAvailability(null); // Reset availability check during mint

    try {
      if (!connectedAddress) {
        throw new Error("Please connect your wallet first");
      }

      // Check if on correct network
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

      // Step 1: Upload to IPFS via API
      setStatus("Uploading to IPFS...");
      const response = await fetch("/api/mint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload to IPFS");
      }

      const { tokenURI: uploadedTokenURI } = await response.json();
      setTokenURI(uploadedTokenURI);
      setStatus("IPFS upload successful! Preparing transaction...");

      // Step 2: Mint NFT on blockchain
      setStatus("Please confirm the transaction in your wallet...");

      try {
        // Call the smart contract with value (POL payment)
        await writeContractAsync({
          functionName: "mintPublic",
          args: [name.trim(), selectedTier, uploadedTokenURI], // Use selected tier
          value: mintCost, // Send POL payment
        });

        setStatus("Transaction submitted! Waiting for confirmation...");

        // Transaction is auto-confirmed by Scaffold-ETH hooks
        setStatus(`Success! Your NFT has been minted. 🎉`);
        setName("");
        setNameAvailability("available"); // Show success
      } catch (mintError: any) {
        // Check if name is already taken
        if (mintError.message && mintError.message.includes("Name already registered")) {
          setNameAvailability("taken");
          throw new Error("❌ هذا الاسم محجوز مسبقاً، اختر اسم آخر");
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
              <p className="text-sm opacity-70">Make sure you&apos;re connected to Polygon Mainnet</p>
            </div>
          ) : (
            <form onSubmit={handleMint} className="space-y-6">
              {!isOnPolygon && (
                <div className="alert alert-warning">
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span>
                    You&apos;re on the wrong network. You&apos;ll be prompted to switch to Polygon when you mint.
                  </span>
                </div>
              )}
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
                    setNameAvailability(null); // Reset when typing
                  }}
                  placeholder="Enter your NFT name"
                  className="input input-bordered w-full"
                  disabled={isLoading}
                  maxLength={50}
                />
                <p className="text-xs opacity-60 mt-1">Choose a unique name for your NFT</p>

                {/* Name Availability Status */}
                {name.trim().length >= 2 && nameAvailability === "available" && (
                  <div className="alert alert-success mt-2">
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-bold">🎉 مبروك! الاسم متاح</span>
                  </div>
                )}

                {name.trim().length >= 2 && nameAvailability === "taken" && (
                  <div className="alert alert-error mt-2">
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
                    <span className="font-bold">❌ هذا الاسم محجوز، اختر اسم آخر</span>
                  </div>
                )}
              </div>

              {/* Tier Selection Buttons */}
              <div>
                <label className="block text-sm font-medium mb-3">اختر الفئة (Tier)</label>
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

              {mintCost && (
                <div className="alert alert-info">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-info shrink-0 w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <div>
                    <span className="font-bold">
                      {tiers.find(t => t.index === selectedTier)?.name} Tier: $
                      {tiers.find(t => t.index === selectedTier)?.price}
                    </span>
                    <p className="text-xs">POL Cost: {formatEther(mintCost)} POL</p>
                  </div>
                </div>
              )}

              {status && (
                <div className="alert alert-info">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-current shrink-0 w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span>{status}</span>
                </div>
              )}

              {error && (
                <div className="alert alert-error">
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

              {tokenURI && (
                <div className="alert alert-success">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="font-bold">Metadata uploaded!</p>
                    <p className="text-xs break-all">{tokenURI}</p>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary w-full btn-lg" disabled={isLoading || !name.trim()}>
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Minting...
                  </>
                ) : (
                  <>
                    Mint {tiers.find(t => t.index === selectedTier)?.name} NFT - $
                    {tiers.find(t => t.index === selectedTier)?.price}
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 bg-base-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">How it works:</h2>
          <ol className="list-decimal list-inside space-y-2 opacity-80">
            <li>Connect your wallet to Polygon Mainnet</li>
            <li>Enter a unique name for your NFT</li>
            <li>Your metadata will be uploaded to IPFS via Pinata</li>
            <li>Confirm the transaction to mint your NFT on Polygon</li>
            <li>View your NFT in the Dashboard after minting</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
