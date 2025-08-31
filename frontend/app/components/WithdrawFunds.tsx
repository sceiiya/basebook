"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Download, Hash, User, AlertTriangle, CheckCircle } from "lucide-react";
import { 
  useWithdrawFunds, 
  useTransaction, 
  useIsWithdrawable,
  useTransactionReceipt,
  formatUSDC,
  useRecipientTransactions
} from "../../lib/hooks";
import { CONTRACTS, ESCROW_ABI } from "../../lib/contracts";
import { useAlert } from "./AlertProvider";

export function WithdrawFunds() {
  const { address, isConnected } = useAccount();
  const { success, error } = useAlert();

  // Form state
  const [transactionId, setTransactionId] = useState("");
  const [selectedTxId, setSelectedTxId] = useState<number | null>(null);

  // Contract hooks
  const parsedTxId = transactionId ? parseInt(transactionId) : undefined;
  const { data: transaction, isLoading: isLoadingTx } = useTransaction(parsedTxId);
  const { data: isWithdrawable } = useIsWithdrawable(parsedTxId, address);
  const { data: recipientTxs } = useRecipientTransactions(address);
  const { writeContract: withdrawFunds, isPending: isWithdrawing, data: withdrawHash } = useWithdrawFunds();

  // Transaction status
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } = useTransactionReceipt(withdrawHash);

  // Handle withdraw success
  useEffect(() => {
    if (isWithdrawSuccess) {
      success("Withdrawal successful!", "Funds have been transferred to your wallet");
      setTransactionId("");
      setSelectedTxId(null);
    }
  }, [isWithdrawSuccess, success]);

  const handleWithdraw = async () => {
    try {
      if (!CONTRACTS.ESCROW || !parsedTxId) {
        error("Invalid transaction ID", "Please enter a valid transaction ID");
        return;
      }

      if (!isWithdrawable) {
        error("Cannot withdraw", "This transaction is not withdrawable by you");
        return;
      }

      withdrawFunds({
        address: CONTRACTS.ESCROW,
        abi: ESCROW_ABI,
        functionName: "withdrawFunds",
        args: [BigInt(parsedTxId)],
      });
    } catch (err) {
      console.error("Withdraw error:", err);
      error("Withdrawal failed", "Please try again");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      error("Wallet not connected", "Please connect your wallet first");
      return;
    }

    if (!transactionId || !parsedTxId) {
      error("Invalid transaction ID", "Please enter a valid transaction ID");
      return;
    }

    handleWithdraw();
  };

  const handleSelectTransaction = (txId: number) => {
    setTransactionId(txId.toString());
    setSelectedTxId(txId);
  };

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Connect your wallet to withdraw funds</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Available Withdrawals */}
      {recipientTxs && recipientTxs.length > 0 && (
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-3">Available Withdrawals</h4>
          <div className="space-y-2">
            {recipientTxs.map((txId) => (
              <WithdrawableTransaction 
                key={txId.toString()} 
                txId={Number(txId)} 
                onSelect={handleSelectTransaction}
                isSelected={selectedTxId === Number(txId)}
              />
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transaction ID Input */}
        <div>
          <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700 mb-2">
            Transaction ID
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="number"
              id="transactionId"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter transaction ID"
              min="1"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Enter the transaction ID you received when funds were sent to you
          </p>
        </div>

        {/* Transaction Details */}
        {parsedTxId && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Transaction Details</h4>
            
            {isLoadingTx ? (
              <div className="flex items-center space-x-2 text-gray-600">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading transaction details...</span>
              </div>
            ) : transaction && transaction.exists ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{formatUSDC(transaction.amount)} MUSDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">From:</span>
                  <span className="font-mono text-xs">
                    {transaction.sender.slice(0, 6)}...{transaction.sender.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">To:</span>
                  <span className="font-mono text-xs">
                    {transaction.recipient.slice(0, 6)}...{transaction.recipient.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`inline-flex items-center space-x-1 ${
                    transaction.isWithdrawn ? "text-green-600" : "text-blue-600"
                  }`}>
                    {transaction.isWithdrawn ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Withdrawn</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Available</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span>{new Date(Number(transaction.timestamp) * 1000).toLocaleDateString()}</span>
                </div>

                {/* Withdrawal eligibility */}
                {transaction.recipient.toLowerCase() !== address?.toLowerCase() && (
                  <div className="mt-3 flex items-center space-x-2 text-amber-600 bg-amber-50 p-2 rounded">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">You are not the recipient of this transaction</span>
                  </div>
                )}

                {transaction.isWithdrawn && (
                  <div className="mt-3 flex items-center space-x-2 text-green-600 bg-green-50 p-2 rounded">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">This transaction has already been withdrawn</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Transaction not found</span>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            !parsedTxId || 
            !transaction?.exists || 
            transaction?.isWithdrawn || 
            !isWithdrawable ||
            isWithdrawing || 
            isWithdrawConfirming
          }
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-5 w-5" />
          <span>
            {isWithdrawing || isWithdrawConfirming ? "Withdrawing..." : "Withdraw Funds"}
          </span>
          {(isWithdrawing || isWithdrawConfirming) && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
        </button>
      </form>
    </div>
  );
}

// Component for displaying withdrawable transactions
function WithdrawableTransaction({ 
  txId, 
  onSelect, 
  isSelected 
}: { 
  txId: number; 
  onSelect: (txId: number) => void;
  isSelected: boolean;
}) {
  const { data: transaction } = useTransaction(txId);
  const { address } = useAccount();
  const { data: isWithdrawable } = useIsWithdrawable(txId, address);

  if (!transaction?.exists || transaction.isWithdrawn || !isWithdrawable) {
    return null;
  }

  return (
    <button
      onClick={() => onSelect(txId)}
      className={`w-full text-left p-3 rounded-lg border transition-colors ${
        isSelected 
          ? "border-green-500 bg-green-100" 
          : "border-green-200 hover:border-green-300 hover:bg-green-50"
      }`}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="font-medium text-green-900">Transaction #{txId}</p>
          <p className="text-sm text-green-700">{formatUSDC(transaction.amount)} MUSDC</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-green-600">Available</p>
          <p className="text-xs text-green-500">
            {new Date(Number(transaction.timestamp) * 1000).toLocaleDateString()}
          </p>
        </div>
      </div>
    </button>
  );
}
