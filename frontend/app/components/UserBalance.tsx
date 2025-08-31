"use client";

import { useAccount } from "wagmi";
import { Coins, RefreshCw, Gift } from "lucide-react";
import { useUSDCBalance, formatUSDC, useFaucet, useTransactionReceipt } from "../../lib/hooks";
import { CONTRACTS, MOCK_USDC_ABI } from "../../lib/contracts";
import { parseUSDC } from "../../lib/hooks";
import { useAlert } from "./AlertProvider";
import { useState } from "react";

export function UserBalance() {
  const { address, isConnected } = useAccount();
  const { data: balance, isLoading, refetch } = useUSDCBalance(address);
  const { writeContract, isPending: isFaucetPending, data: faucetHash } = useFaucet();
  const { success, error } = useAlert();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Wait for faucet transaction
  const { isLoading: isFaucetConfirming, isSuccess: isFaucetSuccess } = useTransactionReceipt(faucetHash);

  const handleFaucet = async () => {
    try {
      if (!CONTRACTS.MOCK_USDC) {
        error("Contract not configured", "Please check environment variables");
        return;
      }

      const faucetAmount = parseUSDC("100"); // 100 MUSDC
      
      writeContract({
        address: CONTRACTS.MOCK_USDC,
        abi: MOCK_USDC_ABI,
        functionName: "faucet",
        args: [faucetAmount],
      });

      success("Faucet request sent", "Getting 100 MUSDC for testing...");
    } catch (err) {
      console.error("Faucet error:", err);
      error("Faucet failed", "Please try again");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Show success message when faucet transaction is confirmed
  if (isFaucetSuccess) {
    success("Faucet successful!", "100 MUSDC added to your balance");
  }

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          <Coins className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Connect your wallet to view balance</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-full">
            <Coins className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">USDC Balance</h3>
            <p className="text-sm text-gray-600">Mock USDC on Base Sepolia</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title="Refresh balance"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-4">
        <div className="text-center">
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">Loading balance...</span>
            </div>
          ) : (
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {balance ? formatUSDC(balance) : "0.00"} MUSDC
              </p>
              <p className="text-sm text-gray-600 mt-1">
                ≈ ${balance ? formatUSDC(balance) : "0.00"} USD
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleFaucet}
          disabled={isFaucetPending || isFaucetConfirming}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Gift className="h-4 w-4" />
          <span>
            {isFaucetPending || isFaucetConfirming ? "Getting tokens..." : "Get Test USDC"}
          </span>
          {(isFaucetPending || isFaucetConfirming) && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
        </button>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Click "Get Test USDC" to receive 100 MUSDC for testing
        </p>
      </div>
    </div>
  );
}
