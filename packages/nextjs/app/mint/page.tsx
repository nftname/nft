"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { polygon } from "viem/chains";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export default function MintPage() {
  const [name, setName] = useState("");
  const [selectedTier, setSelectedTier] = useState<number>(2); // 0=Immortal, 1=Elite, 2=Founder
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [nameAvailability, setNameAvailability] = useState<"checking" | "available" | "taken" | null>(null);

  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useScaffoldWriteContract("NNMRegistryV99");

  const isOnPolygon = chainId === polygon.id;

  // ============================================================
  // 🧠 التحقق الذكي من الصلاحيات (المالك والمصرح لهم)
  // ============================================================

  // 1. قراءة عنوان المالك من العقد
  const { data: ownerAddress } = useScaffoldReadContract({
    contractName: "NNMRegistryV99",
    functionName: "owner",
  });

  // 2. التحقق مما إذا كانت المحفظة في القائمة البيضاء
  const { data: isAuthorized } = useScaffoldReadContract({
    contractName: "NNMRegistryV99",
    functionName: "authorizedMinters",
    args: [connectedAddress],
  });

  // تحديد نوع المستخدم
  const isOwner = connectedAddress && ownerAddress && connectedAddress.toLowerCase() === ownerAddress.toLowerCase();
  const canMintFree = isOwner || isAuthorized;

  // تعريف الباقات
  const tiers = [
    { index: 0, price: "50", name: "IMMORTAL" },
    { index: 1, price: "30", name: "ELITE" },
    { index: 2, price: "10", name: "FOUNDER" },
  ];

  // حساب التكلفة (للمستخدم العادي)
  const { data: mintCost } = useScaffoldReadContract({
    contractName: "NNMRegistryV99",
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
      if (!connectedAddress) throw new Error("Please connect your wallet first");

      if (!isOnPolygon) {
        setStatus("Switching to Polygon network...");
        try {
          await switchChain({ chainId: polygon.id });
        } catch {
          throw new Error("Please switch to Polygon network to mint");
        }
      }

      if (!name.trim()) throw new Error("Please enter a name for your NFT");

      // ---------------------------------------------------------
      // 1. الاتصال بملف الـ API (api/mint) لتجهيز الصورة والبيانات
      // ---------------------------------------------------------
      setStatus("Generating Artwork & Metadata...");

      const currentTierName = tiers.find(t => t.index === selectedTier)?.name;

      // هنا يتم استدعاء ملف route.ts الذي اعتمدناه
      const response = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          tier: currentTierName,
        }),
      });

      const apiData = await response.json();

      if (!response.ok) {
        throw new Error(apiData.error || "Failed to generate metadata");
      }

      const finalURI = apiData.tokenURI;
      console.log("Metadata URI Ready:", finalURI);

      // ---------------------------------------------------------
      // 2. إرسال الرابط للعقد الذكي (Minting)
      // ---------------------------------------------------------
      setStatus("Please confirm the transaction in your wallet...");

      try {
        if (isOwner) {
          // المالك: حجز مجاني
          await writeContractAsync({
            functionName: "reserveName",
            args: [name.trim(), selectedTier, finalURI],
          });
          setStatus(`Success! Owner Reserved "${name}" successfully.`);
        } else if (isAuthorized) {
          // القائمة البيضاء: حجز مجاني
          await writeContractAsync({
            functionName: "authorizedMint",
            args: [name.trim(), selectedTier, finalURI],
          });
          setStatus(`Success! Authorized Mint for "${name}" completed.`);
        } else {
          // الجمهور: دفع الرسوم
          await writeContractAsync({
            functionName: "mintPublic",
            args: [name.trim(), selectedTier, finalURI],
            value: mintCost,
          });
          setStatus(`Success! Your NFT "${name}" has been minted. 🎉`);
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
          {/* إشعارات الحالة للمستخدمين المميزين */}
          {isOwner && (
            <div className="alert alert-success mb-4 text-xs font-bold py-2">👑 Owner Mode Active (Free Reserve)</div>
          )}
          {!isOwner && isAuthorized && (
            <div className="alert alert-info mb-4 text-xs font-bold py-2">🛡️ Authorized Access (Free Mint)</div>
          )}

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
                  <div className="text-success text-sm mt-1 font-bold">✓ Name Available</div>
                )}
                {name.trim().length >= 2 && nameAvailability === "taken" && (
                  <div className="text-error text-sm mt-1 font-bold">✕ Name Taken</div>
                )}
              </div>

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
                      <span className="text-2xl font-bold">{canMintFree ? "FREE" : `$${tier.price}`}</span>
                    </button>
                  ))}
                </div>
              </div>

              {status && <div className="alert alert-info text-sm py-2">{status}</div>}
              {error && <div className="alert alert-error text-sm py-2">{error}</div>}

              <button type="submit" className="btn btn-primary w-full btn-lg" disabled={isLoading || !name.trim()}>
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Processing...
                  </>
                ) : isOwner ? (
                  "Reserve Name"
                ) : isAuthorized ? (
                  "Mint Authorized"
                ) : (
                  "Mint Now"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
