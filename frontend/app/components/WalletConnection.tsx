"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { clsx } from "clsx";
import { Wallet, LogOut, Copy, ExternalLink } from "lucide-react";
import { useAlert } from "./AlertProvider";
import { useEffect, useState } from "react";

export function WalletConnection() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { success, error } = useAlert();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      success("Address copied to clipboard");
    }
  };

  const handleViewOnExplorer = () => {
    if (address && chain) {
      const explorerUrl = `https://sepolia.basescan.org/address/${address}`;
      window.open(explorerUrl, "_blank");
    }
  };

  const handleConnect = (connectorId: string) => {
    const connector = connectors.find(c => c.id === connectorId);
    if (connector) {
      connect({ connector });
    }
  };

  // Prevent hydration mismatch by showing loading state on server
  if (!isMounted) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-3">
            <Wallet className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Wallet...</h3>
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Wallet className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Wallet Connected</h3>
              <p className="text-sm text-gray-600">
                {chain?.name || "Base Sepolia"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyAddress}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Copy address"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={handleViewOnExplorer}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="View on BaseScan"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
            <button
              onClick={() => disconnect()}
              className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Disconnect</span>
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-md p-3">
          <p className="text-xs text-gray-500 mb-1">Connected Address:</p>
          <p className="font-mono text-sm text-gray-900 break-all">
            {address}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-3">
          <Wallet className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
        <p className="text-gray-600">
          Connect your wallet to start sending and receiving USDC on Base Sepolia
        </p>
      </div>

      <div className="space-y-3">
        {connectors.map((connector) => (
          <button
            key={connector.id}
            onClick={() => handleConnect(connector.id)}
            disabled={isPending}
            className={clsx(
              "w-full flex items-center justify-center space-x-3 px-4 py-3 border border-gray-200 rounded-lg transition-all",
              "hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              isPending && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded"></div>
            <span className="font-medium text-gray-900">
              {connector.name}
            </span>
            {isPending && (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          By connecting your wallet, you agree to our terms of service
        </p>
      </div>
    </div>
  );
}
