import { ethers } from "hardhat";
import { Contract } from "ethers";

async function main() {
  console.log("🚀 Starting deployment to Base Sepolia...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("🔐 Deploying contracts with account:", deployer.address);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  if (balance < ethers.parseEther("0.01")) {
    console.warn("⚠️  Warning: Low ETH balance. You may need more ETH for deployment.\n");
  }

  try {
    // Deploy MockUSDC
    console.log("📦 Deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC: Contract = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();
    const mockUSDCAddress = await mockUSDC.getAddress();
    console.log("✅ MockUSDC deployed to:", mockUSDCAddress);

    // Deploy BaseBookEscrow
    console.log("\n📦 Deploying BaseBookEscrow...");
    const BaseBookEscrow = await ethers.getContractFactory("BaseBookEscrow");
    const baseBookEscrow: Contract = await BaseBookEscrow.deploy(mockUSDCAddress);
    await baseBookEscrow.waitForDeployment();
    const escrowAddress = await baseBookEscrow.getAddress();
    console.log("✅ BaseBookEscrow deployed to:", escrowAddress);

    // Verify the contracts are deployed correctly
    console.log("\n🔍 Verifying deployments...");
    const usdcName = await mockUSDC.name();
    const usdcSymbol = await mockUSDC.symbol();
    const usdcDecimals = await mockUSDC.decimals();
    console.log(`📋 MockUSDC: ${usdcName} (${usdcSymbol}) with ${usdcDecimals} decimals`);

    const escrowUSDCAddress = await baseBookEscrow.usdcToken();
    const transactionCounter = await baseBookEscrow.getTransactionCounter();
    console.log(`📋 BaseBookEscrow: Connected to USDC at ${escrowUSDCAddress}, Transaction counter: ${transactionCounter}`);

    // Mint some initial tokens to deployer for testing
    console.log("\n🪙 Minting initial tokens for testing...");
    const mintAmount = ethers.parseUnits("10000", 6); // 10,000 MUSDC
    await mockUSDC.mint(deployer.address, mintAmount);
    const deployerBalance = await mockUSDC.balanceOf(deployer.address);
    console.log(`✅ Minted ${ethers.formatUnits(deployerBalance, 6)} MUSDC to deployer`);

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT SUCCESSFUL!");
    console.log("=".repeat(60));
    console.log("📋 Contract Addresses:");
    console.log(`   MockUSDC:        ${mockUSDCAddress}`);
    console.log(`   BaseBookEscrow:  ${escrowAddress}`);
    console.log("\n📝 Next Steps:");
    console.log("1. Update your frontend .env with these contract addresses");
    console.log("2. Verify contracts on BaseScan (optional)");
    console.log("3. Test the dApp with these deployed contracts");
    console.log("\n💡 Environment Variables for Frontend:");
    console.log(`NEXT_PUBLIC_MOCK_USDC_ADDRESS=${mockUSDCAddress}`);
    console.log(`NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=${escrowAddress}`);
    console.log(`NEXT_PUBLIC_CHAIN_ID=84532`);
    console.log("=".repeat(60));

  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  }
}

// Handle errors and run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });
