import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployMarketplace: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // 1. Manually set your existing Registry Contract Address (From Remix)
  const registryAddress = "0x8e46c897bc74405922871a8a6863ccf5cd1fc721";

  // 2. Define WPOL Address for Amoy Testnet (Standard)
  const WPOL_ADDRESS = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889";

  console.log("🚀 Deploying Zero-Liability Marketplace PLUS...");
  console.log("   - Linking to YOUR NFT Contract:", registryAddress);
  console.log("   - Linking to WPOL Contract:", WPOL_ADDRESS);

  await deploy("NNMMarketplaceZeroPlus", {
    from: deployer,
    // Arguments: [NFT_ADDRESS, WPOL_ADDRESS]
    args: [registryAddress, WPOL_ADDRESS],
    log: true,
    autoMine: true,
  });

  const marketplace = await hre.ethers.getContract("NNMMarketplaceZeroPlus", deployer);
  console.log("✅ NNMMarketplaceZeroPlus deployed at:", await marketplace.getAddress());
};

export default deployMarketplace;

deployMarketplace.tags = ["NNMMarketplaceZeroPlus"];
