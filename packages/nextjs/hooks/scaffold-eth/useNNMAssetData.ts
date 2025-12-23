import { useMemo } from "react";
import { useScaffoldReadContract } from "./useScaffoldReadContract";
import { resolveTier } from "~~/utils/tierHelper";

const REGISTRY_CONTRACT = "NNMRegistryV99";

export interface AssetData {
  tokenId: bigint;
  name: string;
  tier: string;
  owner?: string;
  tokenURI?: string;
  // Metadata generated locally
  displayName: string;
  tierColor: string;
  tierGradient: string;
  rank: number;
}

/**
 * useNNMAssetData - The Warehouse (Single Source of Truth)
 *
 * Central hook for all NFT asset data from NNMRegistryV99.
 * Generates metadata locally (colors, tiers, names) to maintain
 * consistency across Marketplace, Dashboard, and Search.
 *
 * @param tokenId - Optional specific token ID to fetch
 * @returns Asset data with local metadata generation
 */
export const useNNMAssetData = (tokenId?: bigint) => {
  const { data: tokenURI } = useScaffoldReadContract({
    contractName: REGISTRY_CONTRACT,
    functionName: "tokenURI",
    args: tokenId !== undefined ? [tokenId] : ([undefined] as const),
  });

  const { data: owner } = useScaffoldReadContract({
    contractName: REGISTRY_CONTRACT,
    functionName: "ownerOf",
    args: tokenId !== undefined ? [tokenId] : ([undefined] as const),
  });

  const assetData = useMemo((): AssetData | null => {
    if (tokenId === undefined) return null;

    const id = Number(tokenId);
    const uri = tokenURI as string | undefined;

    // Extract name from tokenURI path (or use fallback)
    const extractedName = uri ? uri.split("/").pop()?.split(".")[0] || `Asset #${id}` : `Asset #${id}`;

    // Default tier (can be enhanced later to read from metadata)
    const tierIndex = 2; // founders
    const tierName = resolveTier(tierIndex);

    // Generate tier-specific colors (World Class Standard)
    let tierColor = "#4db6ac";
    let tierGradient = "linear-gradient(135deg, #001f24 0%, #003840 100%)";

    if (tierName === "immortal") {
      tierColor = "#FCD535";
      tierGradient = "linear-gradient(135deg, #0a0a0a 0%, #1c1c1c 100%)";
    } else if (tierName === "elite") {
      tierColor = "#ff3232";
      tierGradient = "linear-gradient(135deg, #2b0505 0%, #4a0a0a 100%)";
    }

    return {
      tokenId,
      name: extractedName,
      tier: tierName,
      owner: owner as string | undefined,
      tokenURI: uri,
      displayName: extractedName,
      tierColor,
      tierGradient,
      rank: id + 1, // Can be enhanced with actual ranking logic
    };
  }, [tokenId, tokenURI, owner]);

  return assetData;
};

/**
 * useNNMAllAssets - Fetch all assets from the registry
 *
 * Returns array of all token IDs in reverse chronological order
 * (newest first, like a market listing)
 */
export const useNNMAllAssets = () => {
  const { data: totalSupply } = useScaffoldReadContract({
    contractName: REGISTRY_CONTRACT,
    functionName: "totalSupply",
  });

  const allTokenIds = useMemo(() => {
    const total = totalSupply ? Number(totalSupply) : 0;
    return Array.from({ length: total }, (_, i) => BigInt(total - 1 - i));
  }, [totalSupply]);

  return {
    tokenIds: allTokenIds,
    totalCount: allTokenIds.length,
  };
};

/**
 * useNNMUserAssets - Fetch assets owned by specific address
 *
 * @param address - User wallet address
 * @returns Array of token IDs owned by the user
 */
export const useNNMUserAssets = (address?: string) => {
  const { data: balance } = useScaffoldReadContract({
    contractName: REGISTRY_CONTRACT,
    functionName: "balanceOf",
    args: address ? [address] : ([undefined] as const),
  });

  // Note: ERC721 doesn't have tokenOfOwnerByIndex in standard interface
  // This is a placeholder - you may need to implement off-chain indexing
  // or use events to track user's tokens
  const userTokenCount = balance ? Number(balance) : 0;

  return {
    balance: userTokenCount,
    // tokens: [] // Implement token enumeration if available
  };
};

/**
 * useNNMAssetAvailability - Check if a name is available for minting
 *
 * @param name - Name to check
 * @returns Availability status
 */
export const useNNMAssetAvailability = (name?: string) => {
  const { data: isAvailable } = useScaffoldReadContract({
    contractName: REGISTRY_CONTRACT,
    functionName: "isAvailable",
    args: name ? [name] : ([undefined] as const),
  });

  const { data: isReserved } = useScaffoldReadContract({
    contractName: REGISTRY_CONTRACT,
    functionName: "isReserved",
    args: name ? [name] : ([undefined] as const),
  });

  return {
    isAvailable: Boolean(isAvailable),
    isReserved: Boolean(isReserved),
    canMint: Boolean(isAvailable) && !Boolean(isReserved),
  };
};
