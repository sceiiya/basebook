import { run } from "hardhat";

async function main() {
  // Replace these addresses with your deployed contract addresses
  const MOCK_USDC_ADDRESS = process.env.MOCK_USDC_ADDRESS || "";
  const ESCROW_CONTRACT_ADDRESS = process.env.ESCROW_CONTRACT_ADDRESS || "";

  if (!MOCK_USDC_ADDRESS || !ESCROW_CONTRACT_ADDRESS) {
    console.error("❌ Please set MOCK_USDC_ADDRESS and ESCROW_CONTRACT_ADDRESS environment variables");
    process.exit(1);
  }

  console.log("🔍 Starting contract verification on BaseScan...\n");

  try {
    // Verify MockUSDC
    console.log("📋 Verifying MockUSDC at:", MOCK_USDC_ADDRESS);
    await run("verify:verify", {
      address: MOCK_USDC_ADDRESS,
      constructorArguments: [], // MockUSDC has no constructor arguments
    });
    console.log("✅ MockUSDC verified successfully!\n");

    // Verify BaseBookEscrow
    console.log("📋 Verifying BaseBookEscrow at:", ESCROW_CONTRACT_ADDRESS);
    await run("verify:verify", {
      address: ESCROW_CONTRACT_ADDRESS,
      constructorArguments: [MOCK_USDC_ADDRESS], // BaseBookEscrow constructor takes USDC address
    });
    console.log("✅ BaseBookEscrow verified successfully!\n");

    console.log("🎉 All contracts verified on BaseScan!");

  } catch (error) {
    console.error("❌ Verification failed:");
    console.error(error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
