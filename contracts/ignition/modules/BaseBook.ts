import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BaseBookModule = buildModule("BaseBookModule", (m) => {
  // Deploy MockUSDC first
  const mockUSDC = m.contract("MockUSDC");

  // Deploy BaseBookEscrow with MockUSDC address
  const baseBookEscrow = m.contract("BaseBookEscrow", [mockUSDC]);

  return { mockUSDC, baseBookEscrow };
});

export default BaseBookModule;
