"use client";

import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { History, ArrowUpRight, ArrowDownLeft, ExternalLink, User, RefreshCw } from "lucide-react";
import { 
  useSenderTransactions, 
  useRecipientTransactions, 
  useTransaction, 
  formatUSDC 
} from "../../lib/hooks";

type TransactionType = "sent" | "received" | "all";

export function TransactionHistory() {
  const { address, isConnected } = useAccount();
  const [filter, setFilter] = useState<TransactionType>("all");

  // Get transaction IDs
  const { data: sentTxIds, refetch: refetchSent } = useSenderTransactions(address);
  const { data: receivedTxIds, refetch: refetchReceived } = useRecipientTransactions(address);

  // Combine and filter transaction IDs
  const allTxIds = useMemo(() => {
    const sent = (sentTxIds || []).map(id => ({ id: Number(id), type: "sent" as const }));
    const received = (receivedTxIds || []).map(id => ({ id: Number(id), type: "received" as const }));
    
    const combined = [...sent, ...received];
    
    // Remove duplicates and sort by ID (newest first)
    const unique = combined.filter((tx, index, self) => 
      index === self.findIndex(t => t.id === tx.id)
    );
    
    return unique.sort((a, b) => b.id - a.id);
  }, [sentTxIds, receivedTxIds]);

  // Filter transactions based on selected filter
  const filteredTxIds = useMemo(() => {
    if (filter === "all") return allTxIds;
    return allTxIds.filter(tx => tx.type === filter);
  }, [allTxIds, filter]);

  const handleRefresh = () => {
    refetchSent();
    refetchReceived();
  };

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Connect your wallet to view transaction history</p>
      </div>
    );
  }

  if (allTxIds.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 mb-4">No transactions found</p>
        <p className="text-sm text-gray-400">Your transaction history will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter and Refresh */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {(["all", "sent", "received"] as TransactionType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === type
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {type === "all" ? "All" : type === "sent" ? "Sent" : "Received"}
            </button>
          ))}
        </div>
        
        <button
          onClick={handleRefresh}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title="Refresh transactions"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Transaction Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{allTxIds.length}</p>
          <p className="text-sm text-blue-800">Total</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">
            {allTxIds.filter(tx => tx.type === "sent").length}
          </p>
          <p className="text-sm text-orange-800">Sent</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {allTxIds.filter(tx => tx.type === "received").length}
          </p>
          <p className="text-sm text-green-800">Received</p>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {filteredTxIds.map(({ id, type }) => (
          <TransactionItem key={id} txId={id} type={type} userAddress={address} />
        ))}
      </div>
    </div>
  );
}

// Component for individual transaction items
function TransactionItem({ 
  txId, 
  type, 
  userAddress 
}: { 
  txId: number; 
  type: "sent" | "received"; 
  userAddress: `0x${string}` | undefined;
}) {
  const { data: transaction, isLoading } = useTransaction(txId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction?.exists) {
    return null;
  }

  const isSent = type === "sent";
  const otherAddress = isSent ? transaction.recipient : transaction.sender;
  const date = new Date(Number(transaction.timestamp) * 1000);

  const handleViewOnExplorer = () => {
    // Note: In a real app, you'd need the transaction hash from events
    window.open(`https://sepolia.basescan.org/address/${otherAddress}`, "_blank");
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {/* Transaction Type Icon */}
          <div className={`p-2 rounded-full ${
            isSent ? "bg-orange-100" : "bg-green-100"
          }`}>
            {isSent ? (
              <ArrowUpRight className="h-4 w-4 text-orange-600" />
            ) : (
              <ArrowDownLeft className="h-4 w-4 text-green-600" />
            )}
          </div>

          {/* Transaction Details */}
          <div>
            <div className="flex items-center space-x-2">
              <p className="font-medium text-gray-900">
                {isSent ? "Sent" : "Received"} #{txId}
              </p>
              <span className={`px-2 py-1 text-xs rounded-full ${
                transaction.isWithdrawn 
                  ? "bg-green-100 text-green-800" 
                  : "bg-blue-100 text-blue-800"
              }`}>
                {transaction.isWithdrawn ? "Completed" : "Pending"}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>
                {isSent ? "To:" : "From:"} 
              </span>
              <span className="font-mono">
                {otherAddress.slice(0, 6)}...{otherAddress.slice(-4)}
              </span>
              <button
                onClick={handleViewOnExplorer}
                className="text-blue-600 hover:text-blue-700"
                title="View on BaseScan"
              >
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {date.toLocaleDateString()} at {date.toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right">
          <p className={`text-lg font-semibold ${
            isSent ? "text-orange-600" : "text-green-600"
          }`}>
            {isSent ? "-" : "+"}{formatUSDC(transaction.amount)} MUSDC
          </p>
          <p className="text-sm text-gray-500">
            ≈ ${formatUSDC(transaction.amount)} USD
          </p>
        </div>
      </div>
    </div>
  );
}
