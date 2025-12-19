"use client";

import { useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount, useSwitchChain, useChainId } from "wagmi";
import { polygon } from "viem/chains";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export default function MintPage() {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [tokenURI, setTokenURI] = useState("");

  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useScaffoldWriteContract("NNMMarket");
  
  const isOnPolygon = chainId === polygon.id;

  // Read mint price from contract
  const { data: mintPrice } = useScaffoldReadContract({
    contractName: "NNMMarket",
    functionName: "mintPrice",
  });

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatus("");
    setIsLoading(true);

    try {
      if (!connectedAddress) {
        throw new Error("Please connect your wallet first");
      }

      // Check if on correct network
      if (!isOnPolygon) {
        setStatus("Switching to Polygon network...");
        try {
          await switchChain({ chainId: polygon.id });
        } catch (switchError: any) {
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

      // Get MATIC cost from contract's getMaticCost function
      // Using FOUNDER tier (cheapest) as default - 10 USD
      const founderPrice = parseEther("10"); // 10 USD in wei
      
      // Call the smart contract
      await writeContractAsync({
        functionName: "mintPublic",
        args: [name.trim(), 2, uploadedTokenURI], // 2 = FOUNDER tier
      });

      setStatus("Transaction submitted! Waiting for confirmation...");

      // Transaction is auto-confirmed by Scaffold-ETH hooks
      setStatus(`Success! Your NFT has been minted. 🎉`);
      setName("");
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
                  <span>You&apos;re on the wrong network. You&apos;ll be prompted to switch to Polygon when you mint.</span>
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
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your NFT name"
                  className="input input-bordered w-full"
                  disabled={isLoading}
                  maxLength={50}
                />
                <p className="text-xs opacity-60 mt-1">Choose a unique name for your NFT</p>
              </div>

              {mintPrice && (
                <div className="alert">
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
                  <span>Mint Price: {formatEther(mintPrice)} POL</span>
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

              <button type="submit" className="btn btn-primary w-full" disabled={isLoading || !name.trim()}>
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Minting...
                  </>
                ) : (
                  "Mint NFT"
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
