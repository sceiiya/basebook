"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { isAddress } from "viem";
import { Send, DollarSign, User, AlertTriangle } from "lucide-react";
import { 
  useUSDCBalance, 
  useUSDCAllowance, 
  useApproveUSDC, 
  useSendFunds, 
  useTransactionReceipt,
  formatUSDC, 
  parseUSDC 
} from "../../lib/hooks";
import { CONTRACTS, MOCK_USDC_ABI, ESCROW_ABI } from "../../lib/contracts";
import { useAlert } from "./AlertProvider";

export function SendFunds() {
  const { address, isConnected } = useAccount();
  const { success, error } = useAlert();

  // Form state
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "approve" | "send">("form");

  // Contract hooks
  const { data: balance } = useUSDCBalance(address);
  const { data: allowance, refetch: refetchAllowance } = useUSDCAllowance(address, CONTRACTS.ESCROW);
  const { writeContract: approve, isPending: isApproving, data: approveHash } = useApproveUSDC();
  const { writeContract: sendFunds, isPending: isSending, data: sendHash } = useSendFunds();

  // Transaction status
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useTransactionReceipt(approveHash);
  const { isLoading: isSendConfirming, isSuccess: isSendSuccess } = useTransactionReceipt(sendHash);

  // Form validation
  const isValidRecipient = recipient && isAddress(recipient);
  const isValidAmount = amount && parseFloat(amount) > 0;
  const parsedAmount = isValidAmount ? parseUSDC(amount) : 0n;
  const hasInsufficientBalance = balance && parsedAmount > balance;
  const needsApproval = allowance !== undefined && parsedAmount > allowance;

  const isFormValid = isValidRecipient && isValidAmount && !hasInsufficientBalance;

  // Handle approve success
  useEffect(() => {
    if (isApproveSuccess && approveHash) {
      success("Approval successful!", `Transaction hash: ${approveHash}`);
      refetchAllowance();
      setStep("send");
    }
  }, [isApproveSuccess, approveHash, success, refetchAllowance]);

  // Handle send success
  useEffect(() => {
    if (isSendSuccess && sendHash) {
      success("Transfer successful!", `Sent ${amount} MUSDC to recipient. Transaction hash: ${sendHash}`);
      setRecipient("");
      setAmount("");
      setStep("form");
    }
  }, [isSendSuccess, sendHash, success, amount]);

  const handleApprove = async () => {
    try {
      if (!CONTRACTS.MOCK_USDC || !parsedAmount) {
        error("Invalid configuration", "Please check contract settings");
        return;
      }

      setStep("approve");
      approve({
        address: CONTRACTS.MOCK_USDC,
        abi: MOCK_USDC_ABI,
        functionName: "approve",
        args: [CONTRACTS.ESCROW, parsedAmount],
      });
    } catch (err) {
      console.error("Approve error:", err);
      error("Approval failed", "Please try again");
      setStep("form");
    }
  };

  const handleSend = async () => {
    try {
      if (!CONTRACTS.ESCROW || !isValidRecipient || !parsedAmount) {
        error("Invalid parameters", "Please check all fields");
        return;
      }

      sendFunds({
        address: CONTRACTS.ESCROW,
        abi: ESCROW_ABI,
        functionName: "sendFunds",
        args: [recipient as `0x${string}`, parsedAmount],
      });
    } catch (err) {
      console.error("Send error:", err);
      error("Transfer failed", "Please try again");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      error("Wallet not connected", "Please connect your wallet first");
      return;
    }

    if (!isFormValid) {
      return;
    }

    if (needsApproval) {
      handleApprove();
    } else {
      handleSend();
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Connect your wallet to send funds</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Recipient Address */}
      <div>
        <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">
          Recipient Address
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            id="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
          />
        </div>
        {recipient && !isValidRecipient && (
          <p className="mt-1 text-sm text-red-600">Invalid Ethereum address</p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
          Amount (MUSDC)
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.000001"
            min="0"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
          />
        </div>
        
        {/* Balance info */}
        <div className="mt-2 flex justify-between items-center text-sm">
          <span className="text-gray-600">
            Available: {balance ? formatUSDC(balance) : "0.00"} MUSDC
          </span>
          {balance && (
            <button
              type="button"
              onClick={() => setAmount(formatUSDC(balance))}
              className="text-blue-600 hover:text-blue-700"
            >
              Use Max
            </button>
          )}
        </div>

        {/* Validation messages */}
        {hasInsufficientBalance && (
          <div className="mt-2 flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Insufficient balance</span>
          </div>
        )}
      </div>

      {/* Transaction Preview */}
      {isFormValid && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Transaction Preview</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <div className="flex justify-between">
              <span>Amount:</span>
              <span>{amount} MUSDC</span>
            </div>
            <div className="flex justify-between">
              <span>To:</span>
              <span className="font-mono">{recipient.slice(0, 6)}...{recipient.slice(-4)}</span>
            </div>
            <div className="flex justify-between">
              <span>Network:</span>
              <span>Base Sepolia</span>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={
          !isFormValid || 
          isApproving || 
          isApproveConfirming || 
          isSending || 
          isSendConfirming ||
          step === "approve" ||
          step === "send"
        }
        className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="h-5 w-5" />
        <span>
          {step === "approve" || isApproving || isApproveConfirming ? (
            "Approving..."
          ) : step === "send" || isSending || isSendConfirming ? (
            "Sending..."
          ) : needsApproval ? (
            `Approve ${amount} MUSDC`
          ) : (
            `Send ${amount} MUSDC`
          )}
        </span>
        {(isApproving || isApproveConfirming || isSending || isSendConfirming) && (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        )}
      </button>

      {/* Step indicator */}
      {(step !== "form" || needsApproval) && isFormValid && (
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
          <div className={`flex items-center space-x-1 ${
            step === "approve" || isApproving || isApproveConfirming ? "text-blue-600" : 
            isApproveSuccess ? "text-green-600" : "text-gray-400"
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              step === "approve" || isApproving || isApproveConfirming ? "bg-blue-600" : 
              isApproveSuccess ? "bg-green-600" : "bg-gray-400"
            }`}></div>
            <span>Approve</span>
          </div>
          <div className="w-8 h-px bg-gray-300"></div>
          <div className={`flex items-center space-x-1 ${
            step === "send" || isSending || isSendConfirming ? "text-blue-600" : 
            isSendSuccess ? "text-green-600" : "text-gray-400"
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              step === "send" || isSending || isSendConfirming ? "bg-blue-600" : 
              isSendSuccess ? "bg-green-600" : "bg-gray-400"
            }`}></div>
            <span>Send</span>
          </div>
        </div>
      )}

      {/* Transaction Status */}
      {(approveHash || sendHash) && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-gray-900">Transaction Status</h4>
          
          {approveHash && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Approval Transaction:</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isApproveConfirming ? "bg-yellow-100 text-yellow-800" :
                  isApproveSuccess ? "bg-green-100 text-green-800" : 
                  "bg-gray-100 text-gray-800"
                }`}>
                  {isApproveConfirming ? "Confirming..." : isApproveSuccess ? "Confirmed" : "Pending"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Hash:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                  {approveHash}
                </code>
                <button
                  onClick={() => window.open(`https://sepolia.basescan.org/tx/${approveHash}`, '_blank')}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  View
                </button>
              </div>
            </div>
          )}

          {sendHash && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Send Transaction:</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isSendConfirming ? "bg-yellow-100 text-yellow-800" :
                  isSendSuccess ? "bg-green-100 text-green-800" : 
                  "bg-gray-100 text-gray-800"
                }`}>
                  {isSendConfirming ? "Confirming..." : isSendSuccess ? "Confirmed" : "Pending"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Hash:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                  {sendHash}
                </code>
                <button
                  onClick={() => window.open(`https://sepolia.basescan.org/tx/${sendHash}`, '_blank')}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  View
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
