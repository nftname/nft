"use client";

import { useState } from "react";
import { formatEther, parseEther } from "viem";
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

  // ✅ 1. التأكد من اسم العقد الجديد
  const { writeContractAsync } = useScaffoldWriteContract("NNMRegistryV99");

  const isOnPolygon = chainId === polygon.id;

  // هذه القائمة للأدمن، لكننا سنعطل إخفاء الأزرار مؤقتاً
  const allowedWallets = ["0xf65BF669EE7775C9788ed367742e1527D0118B58"];
  const isAllowed =
    connectedAddress && allowedWallets.some(wallet => wallet.toLowerCase() === connectedAddress.toLowerCase());

  // ✅ 2. ضبط ترتيب الباقات حسب العقد (0=Immortal, 1=Elite, 2=Founder)
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

      // --- مرحلة تجهيز الصورة ---
      // ✅ 3. حل مشكلة الصورة: سنستخدم الرابط المضمون مؤقتاً بدلاً من API
      // سنعيد تفعيل الـ API لاحقاً بعد التأكد من أن العقد يقبل الصور
      setStatus("Preparing Metadata...");

      // هذا الرابط يحتوي على صورة مضمونة تظهر في ميتا ماسك
      const TEST_WORKING_URI = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
      const finalURI = TEST_WORKING_URI;

      /* * تم تعطيل الـ API مؤقتاً للتأكد من ظهور الصورة أولاً
       * const response = await fetch("/api/mint", { ... });
       * const { tokenURI: uploadedTokenURI } = await response.json();
       */

      setTokenURI(finalURI);
      setStatus("Metadata ready! Please confirm transaction...");

      try {
        // إذا كان المستخدم أدمن، يستخدم دالة الحجز، وإلا يستخدم الشراء العام
        // ملاحظة: قمت بضبط الكود ليستخدم الشراء العام للجميع حالياً للتجربة

        await writeContractAsync({
          functionName: "mintPublic",
          args: [name.trim(), selectedTier, finalURI],
          value: mintCost,
        });

        setStatus(`Success! Your NFT "${name}" has been minted. 🎉`);

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

              {/* ✅ 4. تم إزالة الشرط (!isAllowed) لتظهر الأزرار لك وللجميع */}
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

              {status && <div className="alert alert-info text-sm py-2">{status}</div>}
              {error && <div className="alert alert-error text-sm py-2">{error}</div>}

              <button type="submit" className="btn btn-primary w-full btn-lg" disabled={isLoading || !name.trim()}>
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Processing...
                  </>
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
