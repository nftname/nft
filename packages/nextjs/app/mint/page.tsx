"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { polygon } from "viem/chains";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export default function MintPage() {
  const [name, setName] = useState("");
  const [selectedTier, setSelectedTier] = useState<number>(2); // Default to FOUNDER
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [tokenURI, setTokenURI] = useState("");
  const [nameAvailability, setNameAvailability] = useState<"checking" | "available" | "taken" | null>(null);

  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const { writeContractAsync } = useScaffoldWriteContract("NNMRegistryV99");

  const isOnPolygon = chainId === polygon.id;

  // ============================================================
  // 🧠 المنطقة الذكية: قراءة الصلاحيات من العقد مباشرة
  // ============================================================

  // 1. نسأل العقد: من هو المالك الحالي؟
  const { data: ownerAddress } = useScaffoldReadContract({
    contractName: "NNMRegistryV99",
    functionName: "owner",
  });

  // 2. نسأل العقد: هل المحفظة المتصلة موجودة في قائمة المصرح لهم؟
  const { data: isAuthorized } = useScaffoldReadContract({
    contractName: "NNMRegistryV99",
    functionName: "authorizedMinters",
    args: [connectedAddress],
  });

  // التحقق النهائي: هل المتصل هو المالك OR هو شخص مصرح له؟
  const isOwner = connectedAddress && ownerAddress && connectedAddress.toLowerCase() === ownerAddress.toLowerCase();
  const canMintFree = isOwner || isAuthorized;

  // ============================================================

  const tiers = [
    { index: 0, price: "50", name: "IMMORTAL" },
    { index: 1, price: "30", name: "ELITE" },
    { index: 2, price: "10", name: "FOUNDER" },
  ];

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

      // رابط الصورة الثابت (لضمان ظهورها مؤقتاً)
      const TEST_WORKING_URI = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
      const finalURI = TEST_WORKING_URI;
      setTokenURI(finalURI);

      setStatus("Processing transaction...");

      try {
        if (isOwner) {
          // 👑 إذا كان المالك: استخدم دالة الحجز الخاصة
          console.log("Minting as Owner...");
          await writeContractAsync({
            functionName: "reserveName",
            args: [name.trim(), selectedTier, finalURI],
          });
          setStatus(`Success! Owner Reserved "${name}" successfully.`);
        } else if (isAuthorized) {
          // 🛡️ إذا كان مصرحاً له (Whitelist): استخدم دالة التصريح
          console.log("Minting as Authorized Wallet...");
          await writeContractAsync({
            functionName: "authorizedMint",
            args: [name.trim(), selectedTier, finalURI],
          });
          setStatus(`Success! Authorized Mint for "${name}" completed.`);
        } else {
          // 💰 إذا كان مستخدماً عادياً: ادفع الفلوس
          console.log("Minting as Public...");
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
        console.error(mintError);
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
          <span className="block text-2xl">NNM Market (V99)</span>
        </h1>

        <div className="bg-base-100 rounded-3xl shadow-xl border-2 border-primary p-8">
          {/* رسائل الترحيب حسب الحالة */}
          {isOwner && (
            <div className="alert alert-success mb-4 text-sm font-bold">
              👑 Welcome Owner! You have unlimited free reserves.
            </div>
          )}
          {!isOwner && isAuthorized && (
            <div className="alert alert-info mb-4 text-sm font-bold">
              🛡️ You are an Authorized Minter (Whitelist). Minting is Free.
            </div>
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
                      <span className="text-2xl font-bold">
                        {/* عرض السعر: مجاني للمالك والمصرح لهم، وبفلوس للبقية */}
                        {canMintFree ? "FREE" : `$${tier.price}`}
                      </span>
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
                  "Reserve Name (Owner)"
                ) : isAuthorized ? (
                  "Mint Authorized (Free)"
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
