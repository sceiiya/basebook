import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("BaseBookEscrow", function () {
  let mockUSDC: Contract;
  let escrow: Contract;
  let owner: Signer;
  let sender: Signer;
  let recipient: Signer;
  let other: Signer;

  const INITIAL_SUPPLY = ethers.parseUnits("1000000", 6); // 1M MUSDC
  const TEST_AMOUNT = ethers.parseUnits("100", 6); // 100 MUSDC

  beforeEach(async function () {
    [owner, sender, recipient, other] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();

    // Deploy BaseBookEscrow
    const BaseBookEscrow = await ethers.getContractFactory("BaseBookEscrow");
    escrow = await BaseBookEscrow.deploy(await mockUSDC.getAddress());
    await escrow.waitForDeployment();

    // Mint tokens to sender for testing
    await mockUSDC.mint(await sender.getAddress(), TEST_AMOUNT * 10n);
  });

  describe("Deployment", function () {
    it("Should set the correct USDC token address", async function () {
      expect(await escrow.usdcToken()).to.equal(await mockUSDC.getAddress());
    });

    it("Should set the correct owner", async function () {
      expect(await escrow.owner()).to.equal(await owner.getAddress());
    });

    it("Should initialize transaction counter to 0", async function () {
      expect(await escrow.getTransactionCounter()).to.equal(0);
    });
  });

  describe("MockUSDC", function () {
    it("Should have correct name, symbol, and decimals", async function () {
      expect(await mockUSDC.name()).to.equal("Mock USD Coin");
      expect(await mockUSDC.symbol()).to.equal("MUSDC");
      expect(await mockUSDC.decimals()).to.equal(6);
    });

    it("Should allow faucet minting", async function () {
      const faucetAmount = ethers.parseUnits("500", 6);
      await mockUSDC.connect(sender).faucet(faucetAmount);
      
      const balance = await mockUSDC.balanceOf(await sender.getAddress());
      expect(balance).to.be.at.least(faucetAmount);
    });

    it("Should reject faucet amounts over 1000 MUSDC", async function () {
      const largeAmount = ethers.parseUnits("1001", 6);
      await expect(mockUSDC.connect(sender).faucet(largeAmount))
        .to.be.revertedWith("MockUSDC: Max 1000 MUSDC per faucet call");
    });
  });

  describe("Send Funds", function () {
    beforeEach(async function () {
      // Approve escrow to spend sender's tokens
      await mockUSDC.connect(sender).approve(await escrow.getAddress(), TEST_AMOUNT);
    });

    it("Should successfully send funds to escrow", async function () {
      const senderAddress = await sender.getAddress();
      const recipientAddress = await recipient.getAddress();

      await expect(escrow.connect(sender).sendFunds(recipientAddress, TEST_AMOUNT))
        .to.emit(escrow, "FundsDeposited")
        .withArgs(1, senderAddress, recipientAddress, TEST_AMOUNT, await time.latest() + 1);

      // Check transaction details
      const transaction = await escrow.getTransaction(1);
      expect(transaction.sender).to.equal(senderAddress);
      expect(transaction.recipient).to.equal(recipientAddress);
      expect(transaction.amount).to.equal(TEST_AMOUNT);
      expect(transaction.isWithdrawn).to.be.false;
      expect(transaction.exists).to.be.true;

      // Check transaction counter
      expect(await escrow.getTransactionCounter()).to.equal(1);

      // Check contract balance
      expect(await escrow.getContractBalance()).to.equal(TEST_AMOUNT);
    });

    it("Should reject zero amount", async function () {
      await expect(escrow.connect(sender).sendFunds(await recipient.getAddress(), 0))
        .to.be.revertedWithCustomError(escrow, "InvalidAmount");
    });

    it("Should reject sending to zero address", async function () {
      await expect(escrow.connect(sender).sendFunds(ethers.ZeroAddress, TEST_AMOUNT))
        .to.be.revertedWith("BaseBookEscrow: Invalid recipient address");
    });

    it("Should reject sending to self", async function () {
      const senderAddress = await sender.getAddress();
      await expect(escrow.connect(sender).sendFunds(senderAddress, TEST_AMOUNT))
        .to.be.revertedWith("BaseBookEscrow: Cannot send to yourself");
    });

    it("Should reject insufficient allowance", async function () {
      const largeAmount = TEST_AMOUNT * 2n;
      await expect(escrow.connect(sender).sendFunds(await recipient.getAddress(), largeAmount))
        .to.be.revertedWithCustomError(escrow, "InsufficientAllowance");
    });

    it("Should track sender and recipient transactions", async function () {
      const senderAddress = await sender.getAddress();
      const recipientAddress = await recipient.getAddress();

      await escrow.connect(sender).sendFunds(recipientAddress, TEST_AMOUNT);

      const senderTxs = await escrow.getSenderTransactions(senderAddress);
      const recipientTxs = await escrow.getRecipientTransactions(recipientAddress);

      expect(senderTxs).to.deep.equal([1n]);
      expect(recipientTxs).to.deep.equal([1n]);
    });
  });

  describe("Withdraw Funds", function () {
    let transactionId: number;

    beforeEach(async function () {
      // Setup: Send funds to escrow
      await mockUSDC.connect(sender).approve(await escrow.getAddress(), TEST_AMOUNT);
      const tx = await escrow.connect(sender).sendFunds(await recipient.getAddress(), TEST_AMOUNT);
      const receipt = await tx.wait();
      transactionId = 1; // First transaction
    });

    it("Should allow recipient to withdraw funds", async function () {
      const recipientAddress = await recipient.getAddress();
      const initialBalance = await mockUSDC.balanceOf(recipientAddress);

      await expect(escrow.connect(recipient).withdrawFunds(transactionId))
        .to.emit(escrow, "FundsWithdrawn")
        .withArgs(transactionId, recipientAddress, TEST_AMOUNT, await time.latest() + 1);

      // Check recipient balance
      const finalBalance = await mockUSDC.balanceOf(recipientAddress);
      expect(finalBalance - initialBalance).to.equal(TEST_AMOUNT);

      // Check transaction is marked as withdrawn
      const transaction = await escrow.getTransaction(transactionId);
      expect(transaction.isWithdrawn).to.be.true;

      // Check contract balance
      expect(await escrow.getContractBalance()).to.equal(0);
    });

    it("Should reject withdrawal by non-recipient", async function () {
      await expect(escrow.connect(other).withdrawFunds(transactionId))
        .to.be.revertedWithCustomError(escrow, "UnauthorizedWithdrawal");
    });

    it("Should reject withdrawal of non-existent transaction", async function () {
      await expect(escrow.connect(recipient).withdrawFunds(999))
        .to.be.revertedWithCustomError(escrow, "TransactionNotFound");
    });

    it("Should reject double withdrawal", async function () {
      await escrow.connect(recipient).withdrawFunds(transactionId);
      
      await expect(escrow.connect(recipient).withdrawFunds(transactionId))
        .to.be.revertedWithCustomError(escrow, "AlreadyWithdrawn");
    });

    it("Should correctly report withdrawable status", async function () {
      const recipientAddress = await recipient.getAddress();
      const otherAddress = await other.getAddress();

      // Should be withdrawable by recipient
      expect(await escrow.isWithdrawable(transactionId, recipientAddress)).to.be.true;
      
      // Should not be withdrawable by others
      expect(await escrow.isWithdrawable(transactionId, otherAddress)).to.be.false;

      // After withdrawal, should not be withdrawable
      await escrow.connect(recipient).withdrawFunds(transactionId);
      expect(await escrow.isWithdrawable(transactionId, recipientAddress)).to.be.false;
    });
  });

  describe("Emergency Withdrawal", function () {
    let transactionId: number;

    beforeEach(async function () {
      await mockUSDC.connect(sender).approve(await escrow.getAddress(), TEST_AMOUNT);
      await escrow.connect(sender).sendFunds(await recipient.getAddress(), TEST_AMOUNT);
      transactionId = 1;
    });

    it("Should allow sender to emergency withdraw after 30 days", async function () {
      // Fast forward 30 days
      await time.increase(30 * 24 * 60 * 60);

      const senderAddress = await sender.getAddress();
      const initialBalance = await mockUSDC.balanceOf(senderAddress);

      await expect(escrow.connect(sender).emergencyWithdrawal(transactionId))
        .to.emit(escrow, "EmergencyWithdrawal")
        .withArgs(transactionId, senderAddress, TEST_AMOUNT, await time.latest() + 1);

      // Check sender balance
      const finalBalance = await mockUSDC.balanceOf(senderAddress);
      expect(finalBalance - initialBalance).to.equal(TEST_AMOUNT);

      // Check transaction is marked as withdrawn
      const transaction = await escrow.getTransaction(transactionId);
      expect(transaction.isWithdrawn).to.be.true;
    });

    it("Should reject emergency withdrawal before 30 days", async function () {
      await expect(escrow.connect(sender).emergencyWithdrawal(transactionId))
        .to.be.revertedWith("BaseBookEscrow: Emergency withdrawal only after 30 days");
    });

    it("Should reject emergency withdrawal by non-sender", async function () {
      await time.increase(30 * 24 * 60 * 60);
      
      await expect(escrow.connect(other).emergencyWithdrawal(transactionId))
        .to.be.revertedWith("BaseBookEscrow: Only sender can emergency withdraw");
    });

    it("Should reject emergency withdrawal if already withdrawn", async function () {
      await escrow.connect(recipient).withdrawFunds(transactionId);
      await time.increase(30 * 24 * 60 * 60);

      await expect(escrow.connect(sender).emergencyWithdrawal(transactionId))
        .to.be.revertedWithCustomError(escrow, "AlreadyWithdrawn");
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to emergency withdraw stuck tokens", async function () {
      // Send some tokens directly to contract (simulating stuck tokens)
      await mockUSDC.transfer(await escrow.getAddress(), TEST_AMOUNT);
      
      const ownerAddress = await owner.getAddress();
      const initialBalance = await mockUSDC.balanceOf(ownerAddress);

      await escrow.connect(owner).ownerEmergencyWithdraw(await mockUSDC.getAddress(), TEST_AMOUNT);

      const finalBalance = await mockUSDC.balanceOf(ownerAddress);
      expect(finalBalance - initialBalance).to.equal(TEST_AMOUNT);
    });

    it("Should reject owner emergency withdraw by non-owner", async function () {
      await expect(
        escrow.connect(sender).ownerEmergencyWithdraw(await mockUSDC.getAddress(), TEST_AMOUNT)
      ).to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await mockUSDC.connect(sender).approve(await escrow.getAddress(), TEST_AMOUNT * 3n);
      await escrow.connect(sender).sendFunds(await recipient.getAddress(), TEST_AMOUNT);
      await escrow.connect(sender).sendFunds(await other.getAddress(), TEST_AMOUNT);
    });

    it("Should return correct transaction details", async function () {
      const transaction = await escrow.getTransaction(1);
      expect(transaction.sender).to.equal(await sender.getAddress());
      expect(transaction.recipient).to.equal(await recipient.getAddress());
      expect(transaction.amount).to.equal(TEST_AMOUNT);
      expect(transaction.isWithdrawn).to.be.false;
      expect(transaction.exists).to.be.true;
    });

    it("Should return sender transactions", async function () {
      const senderTxs = await escrow.getSenderTransactions(await sender.getAddress());
      expect(senderTxs).to.deep.equal([1n, 2n]);
    });

    it("Should return recipient transactions", async function () {
      const recipientTxs = await escrow.getRecipientTransactions(await recipient.getAddress());
      expect(recipientTxs).to.deep.equal([1n]);
      
      const otherTxs = await escrow.getRecipientTransactions(await other.getAddress());
      expect(otherTxs).to.deep.equal([2n]);
    });

    it("Should return correct contract balance", async function () {
      expect(await escrow.getContractBalance()).to.equal(TEST_AMOUNT * 2n);
    });
  });
});
