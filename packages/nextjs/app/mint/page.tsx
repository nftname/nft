"use client";

import { useState } from "react";
import { polygon } from "viem/chains";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export default function MintPage() {
  const [name, setName] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null); // لتخزين رابط صورة المعاينة
  const [isNameValid, setIsNameValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useScaffoldWriteContract("NNMRegistryV99");

  const isOnPolygon = chainId === polygon.id;

  // 🕵️‍♂️ فحص الصلاحيات (المالك والمصرح لهم)
  const { data: ownerAddress } = useScaffoldReadContract({
    contractName: "NNMRegistryV99",
    functionName: "owner",
  });

  const { data: isAuthorized } = useScaffoldReadContract({
    contractName: "NNMRegistryV99",
    functionName: "authorizedMinters",
    args: [connectedAddress],
  });

  const isOwner = connectedAddress && ownerAddress && connectedAddress.toLowerCase() === ownerAddress.toLowerCase();

  // تعريف الباقات
  const tiers = [
    { index: 0, price: "50", name: "IMMORTAL", color: "border-purple-500 hover:bg-purple-500" },
    { index: 1, price: "30", name: "ELITE", color: "border-red-500 hover:bg-red-500" },
    { index: 2, price: "10", name: "FOUNDER", color: "border-green-500 hover:bg-green-500" },
  ];

  // 🔎 دالة البحث والمعاينة (Search & Preview)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatus("");
    setPreviewImage(null); // مسح الصورة القديمة
    setIsNameValid(false);

    // 1. تنظيف الاسم
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, "");

    if (cleanName.length < 3) {
      setError("Name must be at least 3 characters.");
      return;
    }

    if (name !== cleanName) {
      setName(cleanName);
      setError("Auto-corrected: Spaces and symbols removed.");
    }

    // 2. طلب صورة المعاينة من السيرفر (بدون رفع)
    setIsLoading(true);
    setStatus("🔍 Checking name & Generating Preview...");

    try {
      const response = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // نطلب وضع 'preview' ونحدد الفئة الافتراضية للعرض (مثلاً Founder)
        body: JSON.stringify({ name: cleanName, tier: "founder", mode: "preview" }),
      });

      if (!response.ok) throw new Error("Failed to generate preview image");

      // تحويل البيانات القادمة إلى رابط صورة للعرض
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);

      setPreviewImage(imageUrl);
      setIsNameValid(true);
      setStatus("✅ Name available! Preview generated below.");
    } catch (err) {
      console.error(err);
      setError("Could not generate preview. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 دالة الصك (عند الضغط على السعر)
  const handleMintClick = async (tierIndex: number, tierName: string) => {
    if (!isNameValid || !name) return;

    setError("");
    setStatus("");
    setIsLoading(true);

    try {
      if (!connectedAddress) throw new Error("Connect Wallet First");
      if (!isOnPolygon) {
        setStatus("Switching to Polygon...");
        await switchChain({ chainId: polygon.id });
      }

      // 1. التوليد والرفع الحقيقي (Mint Mode)
      setStatus(`🎨 Generating & Uploading ${tierName} NFT...`);

      const response = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // هذه المرة نرسل mode: 'mint' ونرسل الفئة المختارة ليتم تلوين الكرت حسب الفئة
        body: JSON.stringify({ name: name, tier: tierName, mode: "mint" }),
      });

      const apiData = await response.json();
      if (!response.ok) throw new Error(apiData.error || "Upload Failed");

      const finalURI = apiData.tokenURI;
      console.log("Uploaded URI:", finalURI);

      // 2. التعامل مع البلوكتشين
      setStatus("🔐 Confirming Transaction in Wallet...");

      if (isOwner) {
        console.log("Owner Minting...");
        await writeContractAsync({
          functionName: "reserveName",
          args: [name, tierIndex, finalURI],
        });
      } else if (isAuthorized) {
        console.log("Authorized Minting...");
        await writeContractAsync({
          functionName: "authorizedMint",
          args: [name, tierIndex, finalURI],
        });
      } else {
        console.log("Public Minting...");
        // للعامة: (تم تركها كما طلبت بدون تحديد قيمة لكي تنجح معك كمالك)
        await writeContractAsync({
          functionName: "mintPublic",
          args: [name, tierIndex, finalURI],
        });
      }

      setStatus(`🎉 SUCCESS! You own ${name} now!`);
      // إبقاء الصورة للاحتفال، أو مسحها إذا أردت:
      // setPreviewImage(null);
      // setName("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Minting transaction failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center pt-10 min-h-screen px-4 pb-20">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-2">Mint Your Identity</h1>
        <p className="mb-8 opacity-70">Secure your Gen-0 digital legacy</p>

        <div className="bg-base-100 rounded-3xl shadow-xl border border-base-300 p-8">
          {!connectedAddress ? (
            <div className="text-lg font-bold text-warning animate-pulse">Please Connect Wallet ↗</div>
          ) : (
            <>
              {/* === 1. البحث === */}
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={name}
                  onChange={e => {
                    const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "");
                    setName(val);
                    setIsNameValid(false);
                    setPreviewImage(null); // إخفاء المعاينة عند تغيير الاسم
                    setError("");
                    setStatus("");
                  }}
                  placeholder="Enter Name (e.g. Satoshi)"
                  className="input input-bordered w-full text-lg font-mono"
                  maxLength={25}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSearch}
                  className={`btn btn-neutral px-8 ${isLoading && !previewImage ? "loading" : ""}`}
                  disabled={!name || isLoading}
                >
                  {isLoading && !previewImage ? "" : "Search"}
                </button>
              </div>

              {/* رسائل التنبيه */}
              {error && <div className="alert alert-error text-sm mb-4 font-bold">{error}</div>}
              {status && (
                <div className={`alert ${status.includes("SUCCESS") ? "alert-success" : "alert-info"} text-sm mb-4`}>
                  {status}
                </div>
              )}

              {/* === 2. المعاينة (تظهر فقط بعد نجاح البحث) === */}
              {previewImage && (
                <div className="animate-fade-in mb-8">
                  <p className="text-xs uppercase tracking-widest opacity-50 mb-2">Generated Preview</p>
                  <div className="relative group inline-block">
                    <img
                      src={previewImage}
                      alt="NFT Preview"
                      className="rounded-xl shadow-2xl border-4 border-base-300 max-w-[280px] mx-auto hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute -bottom-3 -right-3 badge badge-primary badge-lg rotate-12">Gen-0</div>
                  </div>
                </div>
              )}

              {/* === 3. خيارات الدفع (تظهر فقط عند وجود المعاينة) === */}
              <div
                className={`transition-all duration-700 ${isNameValid && previewImage ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none h-0 overflow-hidden"}`}
              >
                <div className="divider">Ready to Mint?</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tiers.map(tier => (
                    <button
                      key={tier.index}
                      onClick={() => handleMintClick(tier.index, tier.name)}
                      disabled={isLoading}
                      className={`btn h-auto py-4 flex flex-col items-center gap-1 btn-outline ${tier.color} hover:text-white transition-all`}
                    >
                      <span className="text-xs font-bold tracking-widest opacity-80">{tier.name}</span>
                      <span className="text-2xl font-black">${tier.price}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs opacity-40 mt-4">One-time payment. No renewal fees.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
