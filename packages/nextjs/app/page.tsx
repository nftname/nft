"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { CubeIcon, ShoppingBagIcon, RectangleStackIcon } from "@heroicons/react/24/outline";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5 w-full max-w-6xl">
          <h1 className="text-center mb-4">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              NNM Market
            </span>
          </h1>
          <p className="text-center text-xl mb-8 opacity-80">
            Mint, Trade, and Collect NFTs on Polygon Mainnet
          </p>

          {!connectedAddress && (
            <div className="alert alert-warning max-w-2xl mx-auto mb-8">
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
              <span>Please connect your wallet to get started. Make sure you&apos;re on Polygon Mainnet!</span>
            </div>
          )}

          <div className="flex justify-center mb-12">
            <Link href="/mint" className="btn btn-primary btn-lg gap-2">
              <CubeIcon className="h-6 w-6" />
              Start Minting
            </Link>
          </div>
        </div>

        <div className="grow bg-base-300 w-full mt-8 px-8 py-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Explore NNM Market</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Link
                href="/mint"
                className="flex flex-col bg-base-100 px-10 py-10 text-center items-center rounded-3xl hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-6">
                  <CubeIcon className="h-12 w-12 text-primary-content" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Mint NFTs</h3>
                <p className="opacity-80">
                  Create your unique NFT with a custom name. Your metadata will be stored on IPFS via Pinata.
                </p>
                <div className="mt-4 text-primary font-semibold">Get Started →</div>
              </Link>

              <Link
                href="/marketplace"
                className="flex flex-col bg-base-100 px-10 py-10 text-center items-center rounded-3xl hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mb-6">
                  <ShoppingBagIcon className="h-12 w-12 text-secondary-content" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Marketplace</h3>
                <p className="opacity-80">
                  Browse all NFTs minted on NNM Market. Discover unique collections from the community.
                </p>
                <div className="mt-4 text-secondary font-semibold">Explore Now →</div>
              </Link>

              <Link
                href="/dashboard"
                className="flex flex-col bg-base-100 px-10 py-10 text-center items-center rounded-3xl hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="w-20 h-20 bg-accent rounded-2xl flex items-center justify-center mb-6">
                  <RectangleStackIcon className="h-12 w-12 text-accent-content" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Dashboard</h3>
                <p className="opacity-80">
                  View and manage your NFT collection. Check your minted NFTs and their details.
                </p>
                <div className="mt-4 text-accent font-semibold">View Collection →</div>
              </Link>
            </div>

            <div className="mt-16 bg-base-100 rounded-3xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">Why NNM Market?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="badge badge-primary badge-lg">✓</div>
                  <div>
                    <h4 className="font-bold mb-2">Polygon Mainnet</h4>
                    <p className="text-sm opacity-80">Low gas fees and fast transactions on Polygon network</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="badge badge-primary badge-lg">✓</div>
                  <div>
                    <h4 className="font-bold mb-2">IPFS Storage</h4>
                    <p className="text-sm opacity-80">Your NFT metadata is permanently stored on IPFS via Pinata</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="badge badge-primary badge-lg">✓</div>
                  <div>
                    <h4 className="font-bold mb-2">Easy to Use</h4>
                    <p className="text-sm opacity-80">Simple interface powered by Scaffold-ETH 2</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="badge badge-primary badge-lg">✓</div>
                  <div>
                    <h4 className="font-bold mb-2">Fully Decentralized</h4>
                    <p className="text-sm opacity-80">No centralized servers, all data on blockchain and IPFS</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
