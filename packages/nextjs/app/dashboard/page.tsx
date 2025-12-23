"use client";

import { useState } from "react";
import { formatEther } from "viem";
import { useAccount, useBalance } from "wagmi";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export default function DashboardPage() {
  const { address: connectedAddress } = useAccount();
  const [error, setError] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Get contract info
  const { data: deployedContractData } = useDeployedContractInfo("NNMRegistryV99");
  const contractAddress = deployedContractData?.address;

  // Read user's NFT balance
  const { data: balance } = useScaffoldReadContract({
    contractName: "NNMRegistryV99",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  // Read contract owner
  const { data: contractOwner } = useScaffoldReadContract({
    contractName: "NNMRegistryV99",
    functionName: "owner",
  });

  // Get contract balance
  const { data: contractBalanceData } = useBalance({
    address: contractAddress,
  });

  // Write contract function
  const { writeContractAsync } = useScaffoldWriteContract("NNMRegistryV99");

  // Check if user is owner
  const isOwner = connectedAddress && contractOwner && connectedAddress.toLowerCase() === contractOwner.toLowerCase();

  // Handle withdraw
  const handleWithdraw = async () => {
    if (!isOwner) return;

    setIsWithdrawing(true);
    try {
      await writeContractAsync({
        functionName: "withdraw",
      });
    } catch (err: any) {
      console.error("Withdraw error:", err);
      setError(err.message || "Failed to withdraw funds");
    } finally {
      setIsWithdrawing(false);
    }
  };

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

        {isOwner && (
          <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 mb-8 text-white">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-xl font-bold mb-2">👑 Contract Owner Panel</h3>
                <p className="opacity-90">
                  Contract Balance:{" "}
                  <span className="font-bold text-2xl">
                    {contractBalanceData ? formatEther(contractBalanceData.value) : "0"} POL
                  </span>
                </p>
              </div>
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing || !contractBalanceData || contractBalanceData.value === 0n}
                className="btn btn-neutral btn-lg"
              >
                {isWithdrawing ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Withdrawing...
                  </>
                ) : (
                  "💰 Withdraw Funds"
                )}
              </button>
            </div>
          </div>
        )}

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

        {!balance || balance === 0n ? (
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
          <div className="text-center py-20">
            <p className="text-2xl mb-4">Dashboard Under Construction</p>
            <p className="opacity-70 mb-6">Your NFT collection will be displayed here soon</p>
            <p className="text-sm opacity-50">You own {balance.toString()} NFT(s)</p>
          </div>
        )}
      </div>
    </div>
  );
}
