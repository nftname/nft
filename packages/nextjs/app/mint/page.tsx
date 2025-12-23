"use client";

import { useState } from "react";
import { keccak256, parseEther, toHex } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export default function MintPage() {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  const { address } = useAccount();

  const ADMIN_WALLET = "0xf65bf669ee7775c9788ed367742e1527d0118b58";

  const REGISTRY = "NNMRegistryV99";

  const { refetch: checkNameRegistered } = (useScaffoldReadContract as any)({
    contractName: REGISTRY,
    functionName: "registeredNames",
    args: [name ? keccak256(toHex(name)) : undefined],
  });

  const { writeContractAsync: mintPublic } = (useScaffoldWriteContract as any)(REGISTRY);
  const { writeContractAsync: reserveName } = (useScaffoldWriteContract as any)(REGISTRY);

  const { data: founderCost } = (useScaffoldReadContract as any)({
    contractName: REGISTRY,
    functionName: "getMaticCost",
    args: [parseEther("10")],
  });
  const { data: eliteCost } = (useScaffoldReadContract as any)({
    contractName: REGISTRY,
    functionName: "getMaticCost",
    args: [parseEther("30")],
  });
  const { data: immortalCost } = (useScaffoldReadContract as any)({
    contractName: REGISTRY,
    functionName: "getMaticCost",
    args: [parseEther("50")],
  });

  const handleSearch = async () => {
    setStatus("");
    setIsAvailable(false);

    const cleanName = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (!cleanName || cleanName.length < 3) {
      notification.error("Name must be at least 3 characters");
      return;
    }

    if (name !== cleanName) setName(cleanName);

    const { data: isTaken } = await checkNameRegistered();

    if (isTaken) {
      setStatus("❌ Taken. Please choose another.");
      setIsAvailable(false);
    } else {
      setStatus("✅ Available! Select a Tier:");
      setIsAvailable(true);
    }
  };

  const handleMint = async (tierName: string, tierIndex: number, costWei: bigint | undefined) => {
    if (!name || !isAvailable) return;
    setIsLoading(true);

    try {
      const response = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, tier: tierName }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      const tokenURI = data.tokenUri;
      const isAdmin = address && address.toLowerCase() === ADMIN_WALLET.toLowerCase();

      if (isAdmin) {
        await reserveName({
          functionName: "reserveName",
          args: [name, tierIndex, tokenURI],
        });
      } else {
        const valueToSend = ((costWei ?? 0n) * 105n) / 100n;
        await mintPublic({
          functionName: "mintPublic",
          args: [name, tierIndex, tokenURI],
          value: valueToSend,
        });
      }

      setStatus(`🎉 Successfully Minted: ${name}`);
      notification.success("Mint Successful!");
      setIsAvailable(false);
      setName("");
    } catch (error: any) {
      console.error(error);
      notification.error(error.message || "Mint Failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center pt-10 min-h-screen px-4 pb-20 bg-base-300">
      <div className="w-full max-w-xl text-center">
        <h1 className="text-4xl font-bold mb-2">Claim Your Name</h1>
        <p className="mb-8 opacity-70">Check availability and mint instantly.</p>

        <div className="bg-base-100 rounded-3xl shadow-xl p-8">
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value.toUpperCase());
                setIsAvailable(false);
                setStatus("");
              }}
              placeholder="ENTER NAME"
              className="input input-bordered w-full text-lg font-mono uppercase"
              disabled={isLoading}
            />
            <button onClick={handleSearch} className="btn btn-primary px-6" disabled={isLoading || !name}>
              Check
            </button>
          </div>

          {status && <div className="text-sm font-bold mb-6">{status}</div>}

          {isAvailable && (
            <div className="grid grid-cols-1 gap-3 animate-fade-in">
              <button
                onClick={() => handleMint("immortal", 0, immortalCost as bigint | undefined)}
                disabled={isLoading}
                className="btn h-auto py-3 btn-outline border-purple-500 hover:bg-purple-500 hover:text-white"
              >
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold">IMMORTAL</span>
                  <span className="text-sm opacity-80">$50</span>
                </div>
              </button>

              <button
                onClick={() => handleMint("elite", 1, eliteCost as bigint | undefined)}
                disabled={isLoading}
                className="btn h-auto py-3 btn-outline border-red-500 hover:bg-red-500 hover:text-white"
              >
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold">ELITE</span>
                  <span className="text-sm opacity-80">$30</span>
                </div>
              </button>

              <button
                onClick={() => handleMint("founder", 2, founderCost as bigint | undefined)}
                disabled={isLoading}
                className="btn h-auto py-3 btn-outline border-green-500 hover:bg-green-500 hover:text-white"
              >
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold">FOUNDER</span>
                  <span className="text-sm opacity-80">$10</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
